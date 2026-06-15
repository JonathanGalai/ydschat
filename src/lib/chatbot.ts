const EN_GREETINGS = ['hi', 'hello', 'hey']
const HE_GREETINGS = ['הי', 'היי', 'שלום']

const EN_RESPONSE = "Hello! I'm YDS Chat, what can I help you with?"
const HE_RESPONSE = 'שלום! אני YDS Chat, במה אוכל לעזור?'

export function getGreetingResponse(input: string): string | null {
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase()

  if (HE_GREETINGS.some((g) => trimmed === g || lower === g)) {
    return HE_RESPONSE
  }

  if (EN_GREETINGS.includes(lower)) {
    return EN_RESPONSE
  }

  return null
}

export async function typeOutText(
  text: string,
  onUpdate: (partial: string) => void,
  charDelayMs = 28
): Promise<void> {
  for (let i = 1; i <= text.length; i++) {
    onUpdate(text.slice(0, i))
    const jitter = Math.random() * 18
    await new Promise((r) => setTimeout(r, charDelayMs + jitter))
  }
}
