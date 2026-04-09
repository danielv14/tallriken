import OpenAI from 'openai'

type MenuRecipe = {
  title: string
  ingredients: Array<{ group: string | null; items: string[] }>
}

const buildPrompt = (recipes: MenuRecipe[]): string => {
  const recipeList = recipes
    .map((r) => {
      const ingredients = r.ingredients
        .flatMap((g) => (g.group ? [`**${g.group}:**`, ...g.items] : g.items))
        .join('\n')
      return `### ${r.title}\n${ingredients}`
    })
    .join('\n\n')

  return `Jag ska laga följande recept denna vecka:\n\n${recipeList}`
}

const systemPrompt = `Du är en hjälpsam assistent som skapar inköpslistor. Du får en lista med recept och deras ingredienser.

Uppgift:
- Slå ihop dubbletter av ingredienser och summera mängder (t.ex. "2 dl grädde" + "1 dl grädde" = "3 dl grädde")
- Gruppera ingredienserna efter avdelning i matbutiken
- Svara med en inköpslista i markdown-format
- Använd rubriker (##) för varje avdelning
- Lista ingredienser med bindestreck (-)
- Skriv på svenska
- Inkludera INTE receptnamn, bara ingredienser
- Var koncis`

export const generateShoppingList = async (
  recipes: MenuRecipe[],
  apiKey: string,
): Promise<string> => {
  const client = new OpenAI({ apiKey })

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildPrompt(recipes) },
    ],
    temperature: 0.3,
  })

  return response.choices[0].message.content ?? ''
}
