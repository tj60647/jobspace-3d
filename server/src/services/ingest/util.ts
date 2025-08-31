import { createHash } from 'crypto';

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function simHash(text: string): string {
  // Simplified simhash - just use SHA1 of first 500 chars as specified
  const slice = text.slice(0, 500);
  return createHash('sha1').update(slice).digest('hex');
}

export function createDedupeKey(company: string, title: string, description: string): string {
  const normalizedTitle = normalizeTitle(title);
  const descHash = simHash(description);
  return `${company.toLowerCase()}:${normalizedTitle}:${descHash}`;
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}