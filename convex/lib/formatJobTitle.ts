// Job title (jabatan) formatting helpers, mirrored from the frontend
// (src/pages/letters/_lib/formatJobTitle.ts) so the emailed PDF and HTML render
// identically to the on-screen letter detail.

const LOWERCASE_WORDS = new Set([
  "dan",
  "atau",
  "di",
  "ke",
  "dari",
  "yang",
  "untuk",
  "pada",
  "dalam",
  "atas",
  "the",
  "of",
  "and",
]);

const isAcronym = (word: string): boolean => /^[A-Z]{2,4}$/.test(word);

// Title Case: every word capitalized (connector words stay lowercase, short
// acronyms preserved). Used for the signer (pengirim).
export function formatJobTitle(value: string | null | undefined): string {
  if (!value) return "";
  const words = value.trim().split(/\s+/);
  return words
    .map((word, index) => {
      if (isAcronym(word)) return word;
      const lower = word.toLowerCase();
      if (index > 0 && LOWERCASE_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

// Sentence case: only the first letter capitalized. Used for the recipient
// (penerima).
export function formatJobTitleSentence(value: string | null | undefined): string {
  if (!value) return "";
  const lower = value.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
