import { describe, it, expect } from 'vitest'
import { extractJsonLdRecipe } from '#/import/extract'

const HTML_WITH_RECIPE_JSON_LD = `
<html>
<head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Pasta Carbonara",
  "description": "Klassisk italiensk pasta",
  "recipeIngredient": ["400g spaghetti", "200g pancetta", "4 äggulor", "100g parmesan"],
  "recipeInstructions": [
    {"@type": "HowToStep", "text": "Koka pastan"},
    {"@type": "HowToStep", "text": "Stek pancettan"},
    {"@type": "HowToStep", "text": "Blanda ägg och ost"},
    {"@type": "HowToStep", "text": "Vänd ihop"}
  ],
  "totalTime": "PT25M",
  "recipeYield": "4 portioner"
}
</script>
</head>
<body><h1>Pasta Carbonara</h1></body>
</html>
`

const HTML_WITH_STRING_INSTRUCTIONS = `
<html>
<head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Enkel sallad",
  "recipeIngredient": ["sallad", "tomat", "gurka"],
  "recipeInstructions": "Skär grönsakerna. Blanda ihop."
}
</script>
</head>
<body></body>
</html>
`

const HTML_WITHOUT_JSON_LD = `
<html>
<head><title>Inte ett recept</title></head>
<body><h1>Hej</h1></body>
</html>
`

const HTML_WITH_MALFORMED_JSON_LD = `
<html>
<head>
<script type="application/ld+json">
{ this is not valid json }
</script>
</head>
<body></body>
</html>
`

const HTML_WITH_ARRAY_JSON_LD = `
<html>
<head>
<script type="application/ld+json">
[
  {"@context": "https://schema.org", "@type": "WebSite", "name": "Recept.se"},
  {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": "Pannkakor",
    "recipeIngredient": ["3 dl mjöl", "6 dl mjölk", "3 ägg"],
    "recipeInstructions": [{"@type": "HowToStep", "text": "Vispa ihop smeten"}],
    "totalTime": "PT20M",
    "recipeYield": "4"
  }
]
</script>
</head>
<body></body>
</html>
`

const HTML_WITH_ARRAY_TYPE = `
<html>
<head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["Recipe", "HowTo"],
  "name": "Köttbullar",
  "recipeIngredient": ["500g blandfärs", "1 ägg", "1 dl ströbröd"],
  "recipeInstructions": [{"@type": "HowToStep", "text": "Blanda ihop allt"}],
  "totalTime": "PT30M",
  "recipeYield": "4"
}
</script>
</head>
<body></body>
</html>
`

describe('extractJsonLdRecipe', () => {
  it('extracts recipe from HTML with JSON-LD', () => {
    const result = extractJsonLdRecipe(HTML_WITH_RECIPE_JSON_LD)

    expect(result).not.toBeNull()
    expect(result!.title).toBe('Pasta Carbonara')
    expect(result!.description).toBe('Klassisk italiensk pasta')
    expect(result!.ingredients).toEqual([{ group: null, items: ['400g spaghetti', '200g pancetta', '4 äggulor', '100g parmesan'] }])
    expect(result!.steps).toEqual(['Koka pastan', 'Stek pancettan', 'Blanda ägg och ost', 'Vänd ihop'])
    expect(result!.cookingTimeMinutes).toBe(25)
    expect(result!.servings).toBe(4)
  })

  it('handles string instructions', () => {
    const result = extractJsonLdRecipe(HTML_WITH_STRING_INSTRUCTIONS)

    expect(result).not.toBeNull()
    expect(result!.steps).toEqual(['Skär grönsakerna. Blanda ihop.'])
  })

  it('returns null when no JSON-LD is found', () => {
    const result = extractJsonLdRecipe(HTML_WITHOUT_JSON_LD)
    expect(result).toBeNull()
  })

  it('returns null for malformed JSON-LD', () => {
    const result = extractJsonLdRecipe(HTML_WITH_MALFORMED_JSON_LD)
    expect(result).toBeNull()
  })

  it('handles @type as array', () => {
    const result = extractJsonLdRecipe(HTML_WITH_ARRAY_TYPE)

    expect(result).not.toBeNull()
    expect(result!.title).toBe('Köttbullar')
    expect(result!.cookingTimeMinutes).toBe(30)
    expect(result!.servings).toBe(4)
  })

  it('finds recipe in JSON-LD array', () => {
    const result = extractJsonLdRecipe(HTML_WITH_ARRAY_JSON_LD)

    expect(result).not.toBeNull()
    expect(result!.title).toBe('Pannkakor')
    expect(result!.cookingTimeMinutes).toBe(20)
  })
})
