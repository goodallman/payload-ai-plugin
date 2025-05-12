// Simple dictionary for demonstration. Expand as needed.
const czechDictionary: Record<string, string> = {
  'Click to stop': 'Klikněte pro zastavení',
  'Proofread': 'Korektura',
  'Rephrase': 'Přeformulovat',
  'Compose': 'Složit',
  'Settings': 'Nastavení',
  'Loading...': 'Načítání...'
  // Add more translations as needed
}

export function translateToCzech(text: string): string {
  return czechDictionary[text] || text
}
