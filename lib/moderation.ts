const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const PHONE_REGEX = /(?:(?:\+?44\s?7\d{3}|\(0\)7\d{3}|07\d{3})\s?\d{3}\s?\d{3})/
const ADDRESS_HINTS = /(\d+\s+\w+\s+(road|rd|street|st|avenue|ave|close|cl|lane|ln))/i
const PROFANITY = new Set(["damn","hell"])

export function detectPII(text: string) {
  return EMAIL_REGEX.test(text) || PHONE_REGEX.test(text) || ADDRESS_HINTS.test(text)
}
export function detectProfanity(text: string) {
  const t = text.toLowerCase()
  return [...PROFANITY].some(w => t.includes(w))
}
export async function scoreToxicity(_text: string) {
  if (!process.env.ENABLE_PERSPECTIVE) return 0
  return 0
}
export function shouldHold(text: string) {
  return detectPII(text) || detectProfanity(text)
}
