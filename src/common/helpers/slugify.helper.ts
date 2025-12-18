import { generateRandomString } from './random-string.helper';

export function generateSlug(text: string): string {
  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '') + generateRandomString()
  );
}
