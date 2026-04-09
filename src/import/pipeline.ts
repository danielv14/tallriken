import type { Database } from "#/db/types";
import { extractImageUrl, extractJsonLdRecipe } from "#/import/extract";
import type { RecipeDraft } from "#/import/schema";
import { getAllTags } from "#/tags/crud";

export type ImportSource =
  | { kind: "url"; url: string }
  | { kind: "photos"; images: Array<{ base64: string; mimeType: string }> };

export type AiExtractionInput =
  | { kind: "html"; html: string }
  | { kind: "images"; images: Array<{ base64: string; mimeType: string }> };

export type ImportDeps = {
  db: Database;
  openaiApiKey: string;
  fetchHtml?: (url: string) => Promise<string>;
  extractWithAi?: (
    input: AiExtractionInput,
    tagNames: string[],
  ) => Promise<RecipeDraft | null>;
  storeImage?: (url: string) => Promise<string | null>;
};

export type ImportResult = {
  draft: RecipeDraft;
  tagIds: number[];
  imageUrl: string | null;
  sourceUrl?: string;
  extraction: "json-ld" | "ai" | "ocr";
};

export const importRecipe = async (
  source: ImportSource,
  deps: ImportDeps,
): Promise<ImportResult> => {
  if (source.kind === "url") {
    return importFromUrl(source.url, deps);
  }

  return importFromPhotos(source.images, deps);
};

const importFromUrl = async (
  url: string,
  deps: ImportDeps,
): Promise<ImportResult> => {
  const fetchHtml = deps.fetchHtml ?? defaultFetchHtml;
  const extractWithAi =
    deps.extractWithAi ?? defaultExtractWithAi(deps.openaiApiKey);
  const storeImage = deps.storeImage ?? defaultStoreImage;

  const tags = await getAllTags(deps.db);
  const tagNames = tags.map((t) => t.name);

  const html = await fetchHtml(url);

  const jsonLdDraft = extractJsonLdRecipe(html);
  if (jsonLdDraft) {
    const tagIds = await resolveTagIds(jsonLdDraft, tags, extractWithAi);
    const imageUrl = await resolveImageUrl(html, storeImage);
    return {
      draft: jsonLdDraft,
      tagIds,
      imageUrl,
      sourceUrl: url,
      extraction: "json-ld",
    };
  }

  const aiDraft = await extractWithAi({ kind: "html", html }, tagNames);
  if (aiDraft) {
    const tagIds = await resolveTagIds(aiDraft, tags, extractWithAi);
    const imageUrl = await resolveImageUrl(html, storeImage);
    return {
      draft: aiDraft,
      tagIds,
      imageUrl,
      sourceUrl: url,
      extraction: "ai",
    };
  }

  throw new Error("Kunde inte extrahera något recept från den angivna sidan");
};

const matchTagNames = (
  suggestedNames: string[],
  tags: Array<{ id: number; name: string }>,
): number[] => {
  return suggestedNames
    .map((name) =>
      tags.find((t) => t.name.toLowerCase() === name.toLowerCase()),
    )
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
    .map((t) => t.id);
};

const resolveTagIds = async (
  draft: RecipeDraft,
  tags: Array<{ id: number; name: string }>,
  extractWithAi: (
    input: AiExtractionInput,
    tagNames: string[],
  ) => Promise<RecipeDraft | null>,
): Promise<number[]> => {
  if (draft.suggestedTagNames && draft.suggestedTagNames.length > 0) {
    return matchTagNames(draft.suggestedTagNames, tags);
  }

  if (tags.length === 0) return [];

  // No tags from extraction (e.g. JSON-LD) -- ask AI to classify
  try {
    const tagNames = tags.map((t) => t.name);
    const allItems = draft.ingredients.flatMap((g) => g.items);
    const summaryHtml = `<title>${draft.title}</title><p>${draft.description ?? ""}</p><ul>${allItems.map((i) => `<li>${i}</li>`).join("")}</ul>`;
    const aiDraft = await extractWithAi(
      { kind: "html", html: summaryHtml },
      tagNames,
    );
    if (aiDraft?.suggestedTagNames) {
      return matchTagNames(aiDraft.suggestedTagNames, tags);
    }
  } catch {
    // AI tagging failed, continue without tags
  }

  return [];
};

const importFromPhotos = async (
  images: Array<{ base64: string; mimeType: string }>,
  deps: ImportDeps,
): Promise<ImportResult> => {
  const extractWithAi =
    deps.extractWithAi ?? defaultExtractWithAi(deps.openaiApiKey);

  const tags = await getAllTags(deps.db);
  const tagNames = tags.map((t) => t.name);

  const draft = await extractWithAi({ kind: "images", images }, tagNames);

  if (!draft) {
    throw new Error("Kunde inte extrahera något recept från bilderna");
  }

  const tagIds = await resolveTagIds(draft, tags, extractWithAi);

  return {
    draft,
    tagIds,
    imageUrl: null,
    extraction: "ocr",
  };
};

const resolveImageUrl = async (
  html: string,
  storeImage: (url: string) => Promise<string | null>,
): Promise<string | null> => {
  const originalImageUrl = extractImageUrl(html);
  if (!originalImageUrl) return null;
  return storeImage(originalImageUrl);
};

const defaultStoreImage = async (url: string): Promise<string | null> => {
  const { downloadAndStore } = await import("#/images/image-ops");
  return downloadAndStore(url);
};

const defaultExtractWithAi =
  (apiKey: string) =>
  async (
    input: AiExtractionInput,
    tagNames: string[],
  ): Promise<RecipeDraft | null> => {
    if (input.kind === "html") {
      const { extractRecipeWithAi } = await import("#/import/ai-extract");
      return extractRecipeWithAi(input.html, tagNames, apiKey);
    }
    const { extractRecipeFromImages } = await import("#/import/ocr-extract");
    return extractRecipeFromImages(input.images, tagNames, apiKey);
  };

const defaultFetchHtml = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Tallriken/1.0)",
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(`Kunde inte hämta sidan (${response.status})`);
  }

  return response.text();
};
