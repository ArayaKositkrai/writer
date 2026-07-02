const BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'LI']);
const ALLOWED_TAGS = new Set(['P', 'DIV', 'BR', 'STRONG', 'B', 'EM', 'I', 'H2', 'H3', 'BLOCKQUOTE', 'UL', 'OL', 'LI']);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function isRichText(value: string) {
  return /<(?:p|div|br|strong|b|em|i|h2|h3|blockquote|ul|ol|li)(?:\s|>|\/)/i.test(value);
}

export function plainTextToHtml(value: string) {
  if (!value.trim()) return '';
  return value
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function normalizeRichText(value: string) {
  return isRichText(value) ? value : plainTextToHtml(value);
}

export function sanitizeRichText(value: string) {
  if (typeof DOMParser === 'undefined') return value;
  const parsed = new DOMParser().parseFromString(`<div>${value}</div>`, 'text/html');
  const root = parsed.body.firstElementChild;
  if (!root) return '';

  for (const element of Array.from(root.querySelectorAll('*'))) {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    const lineHeight = element instanceof HTMLElement ? element.style.lineHeight : '';
    const marginLeft = element instanceof HTMLElement ? element.style.marginLeft : '';
    for (const attribute of Array.from(element.attributes)) element.removeAttribute(attribute.name);
    if (element instanceof HTMLElement) {
      if (/^(?:1|1\.5|2)$/.test(lineHeight)) element.style.lineHeight = lineHeight;
      if (/^\d+(?:px|em)$/.test(marginLeft)) element.style.marginLeft = marginLeft;
    }
  }
  return root.innerHTML;
}

export function richTextToPlainText(value: string) {
  if (!isRichText(value)) return value.replace(/\r\n/g, '\n').trim();
  if (typeof DOMParser === 'undefined') {
    return value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|h[1-3]|blockquote|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  const parsed = new DOMParser().parseFromString(value, 'text/html');
  const lines: string[] = [];
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      lines.push(node.textContent ?? '');
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === 'BR') {
      lines.push('\n');
      return;
    }
    const isBlock = BLOCK_TAGS.has(node.tagName);
    if (isBlock && lines.length && !lines[lines.length - 1]?.endsWith('\n')) lines.push('\n');
    node.childNodes.forEach(visit);
    if (isBlock) lines.push('\n');
  };
  parsed.body.childNodes.forEach(visit);
  return lines.join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function richTextToMarkdown(value: string) {
  if (!isRichText(value) || typeof DOMParser === 'undefined') return richTextToPlainText(value);
  const parsed = new DOMParser().parseFromString(value, 'text/html');
  const render = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (!(node instanceof HTMLElement)) return '';
    const inner = Array.from(node.childNodes).map(render).join('');
    if (node.tagName === 'BR') return '\n';
    if (node.tagName === 'STRONG' || node.tagName === 'B') return `**${inner}**`;
    if (node.tagName === 'EM' || node.tagName === 'I') return `*${inner}*`;
    if (node.tagName === 'H2') return `## ${inner}\n\n`;
    if (node.tagName === 'H3') return `### ${inner}\n\n`;
    if (node.tagName === 'BLOCKQUOTE') return `> ${inner.trim().replace(/\n/g, '\n> ')}\n\n`;
    if (node.tagName === 'LI') return `- ${inner}\n`;
    if (node.tagName === 'P' || node.tagName === 'DIV') return `${inner}\n\n`;
    if (node.tagName === 'UL' || node.tagName === 'OL') return `${inner}\n`;
    return inner;
  };
  return Array.from(parsed.body.childNodes).map(render).join('').replace(/\n{3,}/g, '\n\n').trim();
}

export function countWords(value: string) {
  const text = richTextToPlainText(value);
  if (!text) return 0;
  const Segmenter = (Intl as typeof Intl & {
    Segmenter?: new (locale: string, options: { granularity: 'word' }) => {
      segment: (input: string) => Iterable<{ isWordLike?: boolean }>;
    };
  }).Segmenter;
  if (Segmenter) {
    const segmenter = new Segmenter('th', { granularity: 'word' });
    return Array.from(segmenter.segment(text)).filter((segment) => segment.isWordLike).length;
  }
  return text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}

export function parseWordTarget(value: string) {
  const numbers = [...value.matchAll(/\d[\d,]*/g)].map((match) => Number(match[0].replace(/,/g, ''))).filter(Number.isFinite);
  const minimum = Math.max(1, numbers[0] ?? 1_500);
  const maximum = numbers[1] ?? (/ขึ้นไป/.test(value) ? Math.ceil(minimum * 1.2) : minimum);
  return { minimum, maximum: Math.max(minimum, maximum), target: Math.round((minimum + Math.max(minimum, maximum)) / 2) };
}
