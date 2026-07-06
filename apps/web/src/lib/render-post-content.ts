import DOMPurify from 'dompurify';
import type { Config as PurifyConfig } from 'dompurify';
import { renderMarkdown } from './markdown';

const HTML_TAG_PATTERN = /^<[a-z][\s\S]*>/i;

const PURIFY_CONFIG: PurifyConfig = {
  ALLOWED_TAGS: [
    'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
    'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins', 'sub', 'sup',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'figure', 'figcaption', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height', 'class', 'style'],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false,
};

export function renderPostContent(content: string): { html: string; className: string } {
  const isHtml = HTML_TAG_PATTERN.test(content.trim());

  if (isHtml) {
    return { html: DOMPurify.sanitize(content, PURIFY_CONFIG) as string, className: 'tiptap-content' };
  }

  return { html: DOMPurify.sanitize(renderMarkdown(content), PURIFY_CONFIG) as string, className: 'md-content' };
}
