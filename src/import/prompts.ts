const buildTagSection = (tagNames: string[]) =>
  tagNames.length > 0
    ? `\n\nTillgängliga taggar att välja bland: ${tagNames.join(', ')}\nVälj de taggar som passar receptet bäst och returnera dem i fältet "suggestedTagNames". Välj bara taggar från listan ovan.`
    : ''

const sharedRules = `Regler:
- Extrahera ALLA ingredienser, inte bara några. Var noggrann.
- Ingredienser ska grupperas om receptet har underrubriker (t.ex. "Deg", "Fyllning", "Sås"). Varje grupp har ett "group"-fält (gruppnamn eller null om ingen grupp) och "items" (lista med ingredienser).
- Om receptet inte har grupperade ingredienser, använd en enda grupp med group: null.
- Extrahera ALLA tillagningssteg i ordning. Var noggrann.
- Steg ska vara en lista med strängar, ett per steg
- Tillagningstid i minuter som heltal
- Portioner som heltal
- Om informationen saknas, sätt fältet till null
- Svara alltid på svenska`

export const buildExtractionPrompt = (
  contextParagraph: string,
  tagNames: string[],
) => `${contextParagraph}\n\n${sharedRules}${buildTagSection(tagNames)}`
