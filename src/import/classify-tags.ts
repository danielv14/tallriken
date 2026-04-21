import OpenAI from "openai";

export type ClassifyTagsInput = {
  title: string;
  description: string | null;
  ingredients: string[];
};

export const classifyRecipeTags = async (
  recipe: ClassifyTagsInput,
  tagNames: string[],
  apiKey: string,
): Promise<string[]> => {
  const client = new OpenAI({ apiKey });

  const ingredientList = recipe.ingredients.join(", ");
  const description = recipe.description ?? "";

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Du är en receptklassificerare. Givet ett recepts titel, beskrivning och ingredienser, välj de taggar som passar bäst från listan.\n\nSvara med en JSON-array av strängar, t.ex. ["Fisk", "Vardag"]. Välj bara taggar från listan. Om inga taggar passar, svara med en tom array [].`,
      },
      {
        role: "user",
        content: `Recept: ${recipe.title}\nBeskrivning: ${description}\nIngredienser: ${ingredientList}\n\nTillgängliga taggar: ${tagNames.join(", ")}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0].message.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    const tags = Array.isArray(parsed) ? parsed : parsed.tags ?? [];
    return tags.filter((t: unknown): t is string => typeof t === "string");
  } catch {
    return [];
  }
};
