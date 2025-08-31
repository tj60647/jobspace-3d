export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateSimHash(text: string): string {
  // Simple simhash implementation for deduplication
  const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/);
  const hash = new Array(64).fill(0);

  words.forEach(word => {
    if (word.length > 2) {
      const wordHash = simpleHash(word);
      for (let i = 0; i < 64; i++) {
        if ((wordHash >> i) & 1) {
          hash[i]++;
        } else {
          hash[i]--;
        }
      }
    }
  });

  return hash.map(bit => bit > 0 ? '1' : '0').join('');
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function extractTextPreview(text: string, maxLength: number = 500): string {
  return text.substring(0, maxLength).replace(/\s+/g, ' ').trim();
}