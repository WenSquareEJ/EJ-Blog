export function parseScratchId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If they pasted a number already
  if (/^\d{3,}$/.test(trimmed)) return trimmed;

  // Try to pull an ID from a URL like:
  // https://scratch.mit.edu/projects/123456789/
  const match = trimmed.match(/scratch\.mit\.edu\/projects\/(\d+)/i);
  if (match?.[1]) return match[1];

  return null;
}