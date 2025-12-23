/**
 * Generate a plain text excerpt from markdown content
 * Removes all markdown syntax including images, links, code blocks, and blockquotes
 */
export function generateExcerpt(content: string, maxLength: number = 150): string {
  if (!content) return '';

  // Remove markdown syntax in order
  const cleanContent = content
    // Remove code blocks (```code```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code (`code`)
    .replace(/`[^`]+`/g, '')
    // Remove images (![alt](url))
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove links but keep text ([text](url) -> text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove blockquotes (> text)
    .replace(/^>\s+/gm, '')
    // Remove entire header lines (#, ##, etc.)
    .replace(/^#{1,6}\s+.*$/gm, '')
    // Remove bold/italic markers (**, *, __, _)
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    // Remove strikethrough (~~text~~)
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove horizontal rules (---, ***, ___)
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove extra whitespace and newlines
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate to maxLength
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }

  // Find a good breaking point (space) near maxLength
  const truncated = cleanContent.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    // If we have a space in the last 20% of maxLength, use it
    return truncated.substring(0, lastSpace) + '...';
  }

  // Otherwise just hard cut
  return truncated + '...';
}
