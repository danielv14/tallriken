import type { ImportDeps } from "#/import/pipeline";
import { importRecipe } from "#/import/pipeline";
import type { RecipeDraft } from "#/import/schema";
import { createTestDb, createTestTag } from "#/test-utils";
import { describe, expect, it } from "vitest";

const JSON_LD_HTML = `
<html>
<head>
  <script type="application/ld+json">
  {
    "@type": "Recipe",
    "name": "Pannkakor",
    "description": "Klassiska svenska pannkakor",
    "recipeIngredient": ["3 dl mjöl", "6 dl mjölk", "3 ägg"],
    "recipeInstructions": [{"text": "Blanda allt"}, {"text": "Stek i smör"}],
    "totalTime": "PT30M",
    "recipeYield": "4"
  }
  </script>
</head>
<body></body>
</html>
`;

const createTestDeps = (overrides: Partial<ImportDeps> = {}): ImportDeps => ({
  db: createTestDb(),
  openaiApiKey: "unused",
  fetchHtml: async () => "",
  extractWithAi: async () => null,
  classifyTags: async () => [],
  storeImage: async () => null,
  ...overrides,
});

describe("importRecipe", () => {
  it("extracts recipe from JSON-LD without calling AI", async () => {
    let aiWasCalled = false;

    const result = await importRecipe(
      { kind: "url", url: "https://example.com/recipe" },
      createTestDeps({
        fetchHtml: async () => JSON_LD_HTML,
        extractWithAi: async () => {
          aiWasCalled = true;
          return null;
        },
      }),
    );

    expect(result.draft.title).toBe("Pannkakor");
    expect(result.draft.ingredients[0].items).toEqual([
      "3 dl mjöl",
      "6 dl mjölk",
      "3 ägg",
    ]);
    expect(result.extraction).toBe("json-ld");
    expect(result.sourceUrl).toBe("https://example.com/recipe");
    expect(aiWasCalled).toBe(false);
  });

  it("falls back to AI extraction when no JSON-LD is found", async () => {
    const aiDraft: RecipeDraft = {
      title: "AI-extraherat recept",
      description: null,
      ingredients: [{ group: null, items: ["1 dl socker"] }],
      steps: null,
      cookingTimeMinutes: null,
      servings: null,
      suggestedTagNames: null,
    };

    const result = await importRecipe(
      { kind: "url", url: "https://example.com/recipe" },
      createTestDeps({
        fetchHtml: async () => "<html><body>Some recipe text</body></html>",
        extractWithAi: async (input) => {
          expect(input.kind).toBe("html");
          return aiDraft;
        },
      }),
    );

    expect(result.draft.title).toBe("AI-extraherat recept");
    expect(result.extraction).toBe("ai");
  });

  it("extracts recipe from photos via OCR", async () => {
    const ocrDraft: RecipeDraft = {
      title: "Fotograferat recept",
      description: null,
      ingredients: [{ group: null, items: ["2 dl grädde"] }],
      steps: ["Vispa grädden"],
      cookingTimeMinutes: null,
      servings: null,
      suggestedTagNames: null,
    };

    const images = [{ base64: "abc123", mimeType: "image/jpeg" }];

    const result = await importRecipe(
      { kind: "photos", images },
      createTestDeps({
        extractWithAi: async (input) => {
          expect(input.kind).toBe("images");
          if (input.kind === "images") {
            expect(input.images).toEqual(images);
          }
          return ocrDraft;
        },
      }),
    );

    expect(result.draft.title).toBe("Fotograferat recept");
    expect(result.extraction).toBe("ocr");
    expect(result.imageUrl).toBeNull();
    expect(result.sourceUrl).toBeUndefined();
  });

  it("resolves tag IDs from AI-suggested tag names (case-insensitive)", async () => {
    const db = createTestDb();
    const dessert = await createTestTag(db, "Dessert");
    const vegetariskt = await createTestTag(db, "Vegetariskt");
    await createTestTag(db, "Fisk");

    const draft: RecipeDraft = {
      title: "Chokladmousse",
      description: null,
      ingredients: [{ group: null, items: ["200g choklad"] }],
      steps: null,
      cookingTimeMinutes: null,
      servings: null,
      suggestedTagNames: ["dessert", "VEGETARISKT"],
    };

    const result = await importRecipe(
      { kind: "url", url: "https://example.com/mousse" },
      createTestDeps({
        db,
        fetchHtml: async () => "<html><body>No JSON-LD here</body></html>",
        extractWithAi: async () => draft,
      }),
    );

    expect(result.tagIds).toEqual(
      expect.arrayContaining([dessert.id, vegetariskt.id]),
    );
    expect(result.tagIds).toHaveLength(2);
  });

  it("calls classifyTags for tag classification when JSON-LD has no suggested tags", async () => {
    const db = createTestDb();
    const fisk = await createTestTag(db, "Fisk");
    await createTestTag(db, "Dessert");

    let classifyCallCount = 0;

    const result = await importRecipe(
      { kind: "url", url: "https://example.com/salmon" },
      createTestDeps({
        db,
        fetchHtml: async () => JSON_LD_HTML,
        classifyTags: async (recipe, tagNames) => {
          classifyCallCount++;
          expect(recipe.title).toBe("Pannkakor");
          expect(recipe.ingredients).toEqual(["3 dl mjöl", "6 dl mjölk", "3 ägg"]);
          expect(tagNames).toEqual(expect.arrayContaining(["Fisk", "Dessert"]));
          return ["Fisk"];
        },
      }),
    );

    expect(result.extraction).toBe("json-ld");
    expect(result.draft.title).toBe("Pannkakor");
    expect(classifyCallCount).toBe(1);
    expect(result.tagIds).toEqual([fisk.id]);
  });

  it("downloads and stores image from HTML", async () => {
    const htmlWithImage = `
    <html>
    <head>
      <meta property="og:image" content="https://example.com/photo.jpg" />
      <script type="application/ld+json">
      {
        "@type": "Recipe",
        "name": "Pasta",
        "recipeIngredient": ["500g pasta"]
      }
      </script>
    </head>
    <body></body>
    </html>`;

    let storedUrl: string | null = null;

    const result = await importRecipe(
      { kind: "url", url: "https://example.com/pasta" },
      createTestDeps({
        fetchHtml: async () => htmlWithImage,
        storeImage: async (url) => {
          storedUrl = url;
          return "https://r2.example.com/stored-photo.jpg";
        },
      }),
    );

    expect(storedUrl).toBe("https://example.com/photo.jpg");
    expect(result.imageUrl).toBe("https://r2.example.com/stored-photo.jpg");
  });

  it("throws when both JSON-LD and AI extraction fail", async () => {
    await expect(
      importRecipe(
        { kind: "url", url: "https://example.com/bad" },
        createTestDeps({
          fetchHtml: async () => "<html><body>Not a recipe</body></html>",
          extractWithAi: async () => null,
        }),
      ),
    ).rejects.toThrow(
      "Kunde inte extrahera något recept från den angivna sidan",
    );
  });

  it("throws when OCR extraction returns null", async () => {
    await expect(
      importRecipe(
        { kind: "photos", images: [{ base64: "abc", mimeType: "image/jpeg" }] },
        createTestDeps({
          extractWithAi: async () => null,
        }),
      ),
    ).rejects.toThrow("Kunde inte extrahera något recept från bilderna");
  });

  it("propagates fetchHtml errors", async () => {
    await expect(
      importRecipe(
        { kind: "url", url: "https://example.com/down" },
        createTestDeps({
          fetchHtml: async () => {
            throw new Error("Kunde inte hämta sidan (500)");
          },
        }),
      ),
    ).rejects.toThrow("Kunde inte hämta sidan (500)");
  });
});
