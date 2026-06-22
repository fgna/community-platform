import { renderMarkdown } from './markdown';

const HTML_TAG_PATTERN = /^<[a-z][\s\S]*>/i;

export function renderPostContent(content: string): { html: string; className: string } {
  const isHtml = HTML_TAG_PATTERN.test(content.trim());

  if (isHtml) {
    return { html: content, className: 'tiptap-content' };
  }

  return { html: renderMarkdown(content), className: 'md-content' };
}
