const EN_GREETINGS = ['hi', 'hello', 'hey']
const HE_GREETINGS = ['הי', 'היי', 'שלום']

function getDisplayName(username?: string | null): string {
  if (username?.trim()) return username.trim()
  return 'there'
}

export function getGreetingResponse(input: string, username?: string | null): string | null {
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase()
  const name = getDisplayName(username)

  if (HE_GREETINGS.some((g) => trimmed === g || lower === g)) {
    return `היי, אני YDS Chat, איך אפשר לעזור לך היום (${name})?`
  }

  if (EN_GREETINGS.includes(lower)) {
    return `Hi! I'm YDS Chat, how can I help you today (${name})?`
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
