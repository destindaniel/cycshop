import { parse, type DefaultTreeAdapterMap } from 'parse5';

/** Patch source offsets, not serialized HTML: hydration payloads must stay byte-exact. */
export function synchronizeScriptNonces(html: string, nonce: string) {
  if (!/^[A-Za-z0-9+/_=-]+$/.test(nonce)) throw new Error('Invalid CSP nonce');
  const document = parse(html, { sourceCodeLocationInfo: true });
  const edits: { start: number; end: number; value: string }[] = [];
  const attribute = (node: DefaultTreeAdapterMap['element'], name: string, value: string) => {
    const location = node.sourceCodeLocation;
    const existing = location?.attrs?.[name];
    if (existing) edits.push({ start: existing.startOffset, end: existing.endOffset, value: `${name}="${value}"` });
    else if (location?.startTag) edits.push({ start: location.startTag.endOffset - 1, end: location.startTag.endOffset - 1, value: ` ${name}="${value}"` });
  };
  const visit = (node: DefaultTreeAdapterMap['node']) => {
    if ('tagName' in node) {
      if (node.tagName === 'script') attribute(node, 'nonce', nonce);
      if (node.tagName === 'meta' && node.attrs.some((a) => a.name === 'property' && a.value === 'csp-nonce')) attribute(node, 'content', nonce);
    }
    if ('childNodes' in node) for (const child of node.childNodes) visit(child);
    if ('tagName' in node && node.tagName === 'template' && 'content' in node) visit(node.content);
  };
  visit(document);
  let result = html;
  for (const edit of edits.sort((a, b) => b.start - a.start)) result = result.slice(0, edit.start) + edit.value + result.slice(edit.end);
  return result;
}