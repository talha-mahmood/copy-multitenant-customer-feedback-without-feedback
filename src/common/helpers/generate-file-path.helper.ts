export function generateFilePath(fileName: string | null): string | null {
  if (!fileName) return null;
  const basePath = process.env.APP_URL || 'http://localhost:3000';
  return `${basePath}${fileName}`;
}
