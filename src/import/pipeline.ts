import type { Database } from "#/db/types";
import {
  classifyRecipeTags,
  type ClassifyTagsInput,
} from "#/import/classify-tags";
import { extractImageUrl, extractJsonLdRecipe } from "#/import/extract";
import type { RecipeDraft } from "#/import/schema";
import { getAllTags } from "#/tags/crud";
import { validatePublicUrl } from "#/utils/url-validation";

export type AiExtractionInput =
  | { kind: "html"; html: string }
  | { kind: "images"; images: Array<{ base64: string; mimeType: string }> };

export type ImportDeps = {
  db: Database;
  openaiApiKey: string;
};

export type ImportTestOverrides = {
  fetchHtml?: (url: string) => Promise<string>;
  extractWithAi?: (
    input: AiExtractionInput,
    tagNames: string[],
  ) => Promise<RecipeDraft | null>;
  classifyTags?: (
    recipe: ClassifyTagsInput,
    tagNames: string[],
  ) => Promise<string[]>;
  storeImage?: (url: string) => Promise<string | null>;
};

export type UrlImportResult = {
  draft: RecipeDraft;
  tagIds: number[];
  imageUrl: string | null;
  sourceUrl: string;
  extraction: "json-ld" | "ai";
};

export type PhotoImportResult = {
  draft: RecipeDraft;
  tagIds: number[];
  extraction: "ocr";
};

type ClassifyTagsFn = (
  recipe: ClassifyTagsInput,
  tagNames: string[],
) => Promise<string[]>;

type ExtractWithAiFn = (
  input: AiExtractionInput,
  tagNames: string[],
) => Promise<RecipeDraft | null>;

export const importFromUrl = async (
  url: string,
  deps: ImportDeps,
  overrides: ImportTestOverrides = {},
): Promise<UrlImportResult> => {
  const fetchHtml = overrides.fetchHtml ?? defaultFetchHtml;
  const extractWithAi =
    overrides.extractWithAi ?? defaultExtractWithAi(deps.openaiApiKey);
  const classifyTags =
    overrides.classifyTags ?? defaultClassifyTags(deps.openaiApiKey);
  const storeImage = overrides.storeImage ?? defaultStoreImage;

  const tags = await getAllTags(deps.db);
  const tagNames = tags.map((t) => t.name);

  const html = await fetchHtml(url);

  const jsonLdDraft = extractJsonLdRecipe(html);
  if (jsonLdDraft) {
    const [tagIds, imageUrl] = await Promise.all([
      resolveTagIds(jsonLdDraft, tags, classifyTags),
      resolveImageUrl(html, storeImage),
    ]);
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
    const [tagIds, imageUrl] = await Promise.all([
      resolveTagIds(aiDraft, tags, classifyTags),
      resolveImageUrl(html, storeImage),
    ]);
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

export const importFromPhotos = async (
  images: Array<{ base64: string; mimeType: string }>,
  deps: ImportDeps,
  overrides: ImportTestOverrides = {},
): Promise<PhotoImportResult> => {
  const extractWithAi =
    overrides.extractWithAi ?? defaultExtractWithAi(deps.openaiApiKey);
  const classifyTags =
    overrides.classifyTags ?? defaultClassifyTags(deps.openaiApiKey);

  const tags = await getAllTags(deps.db);
  const tagNames = tags.map((t) => t.name);

  const draft = await extractWithAi({ kind: "images", images }, tagNames);

  if (!draft) {
    throw new Error("Kunde inte extrahera något recept från bilderna");
  }

  const tagIds = await resolveTagIds(draft, tags, classifyTags);

  return {
    draft,
    tagIds,
    extraction: "ocr",
  };
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
  classifyTags: ClassifyTagsFn,
): Promise<number[]> => {
  if (draft.suggestedTagNames && draft.suggestedTagNames.length > 0) {
    return matchTagNames(draft.suggestedTagNames, tags);
  }

  if (tags.length === 0) return [];

  // No tags from extraction (e.g. JSON-LD) -- ask AI to classify
  try {
    const tagNames = tags.map((t) => t.name);
    const allItems = draft.ingredients.flatMap((g) => g.items);
    const suggestedNames = await classifyTags(
      {
        title: draft.title,
        description: draft.description ?? null,
        ingredients: allItems,
      },
      tagNames,
    );
    return matchTagNames(suggestedNames, tags);
  } catch {}

  return [];
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
  const { downloadAndStoreImage } = await import("#/images");
  return downloadAndStoreImage(url);
};

const defaultExtractWithAi =
  (apiKey: string): ExtractWithAiFn =>
  async (input, tagNames) => {
    if (input.kind === "html") {
      const { extractRecipeWithAi } = await import("#/import/ai-extract");
      return extractRecipeWithAi(input.html, tagNames, apiKey);
    }
    const { extractRecipeFromImages } = await import("#/import/ocr-extract");
    return extractRecipeFromImages(input.images, tagNames, apiKey);
  };

const defaultClassifyTags =
  (apiKey: string): ClassifyTagsFn =>
  (recipe, tagNames) =>
    classifyRecipeTags(recipe, tagNames, apiKey);

const defaultFetchHtml = async (url: string): Promise<string> => {
  validatePublicUrl(url);

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
