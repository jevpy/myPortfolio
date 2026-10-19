import { createHash } from 'node:crypto';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { requestText, MAX_BYTES } from './news-http.mjs';
import { canonicalUrlKey, makeArticle } from '../src/data/hacker-news.mjs';

export const INFOQ_FEEDS = Object.freeze([
  'https://feed.infoq.com/architecture/',
  'https://feed.infoq.com/ai-development/',
  'https://feed.infoq.com/ai-architecture/',
]);
export const XML_LIMITS = Object.freeze({ depth: 24, items: 500, text: 65536, bytes: MAX_BYTES });
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
const parser = new XMLParser({
  preserveOrder: true, ignoreAttributes: false, parseTagValue: false,
  trimValues: false, processEntities: false, cdataPropName: '#cdata', commentPropName: '#comment',
});

// Decode exactly once. CDATA remains literal; no custom/external entity resolution.
export function decodeXml(text) {
  return text.replace(/&([^;\s]+);/g, (_, entity) => {
    const predefined = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    if (Object.hasOwn(predefined, entity)) return predefined[entity];
    if (!/^#(?:[0-9]+|x[0-9a-f]+)$/i.test(entity)) throw Error('Unknown XML entity');
    const cp = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    if (!(cp === 9 || cp === 10 || cp === 13 || cp >= 32 && cp <= 0xd7ff ||
          cp >= 0xe000 && cp <= 0xfffd || cp >= 0x10000 && cp <= 0x10ffff)) throw Error('Invalid XML character');
    return String.fromCodePoint(cp);
  });
}
const nodes = (list, name) => list.filter(node => Object.hasOwn(node, name)).map(node => node[name]);
function textOf(list) {
  let text = '';
  for (const node of list) {
    if (Object.hasOwn(node, '#text')) text += decodeXml(String(node['#text']));
    else if (Object.hasOwn(node, '#cdata')) text += node['#cdata'].map(part => part['#text'] ?? '').join('');
    else throw Error('Nested RSS text');
  }
  if (text.length > XML_LIMITS.text) throw Error('RSS text limit');
  return text;
}
function field(list, name, required = false) {
  const values = nodes(list, name);
  if (values.length > 1 || required && values.length !== 1) throw Error('Invalid RSS field');
  return values.length ? textOf(values[0]).trim() : null;
}

export function parseInfoq(xml, clock) {
  if (typeof xml !== 'string' || Buffer.byteLength(xml) > XML_LIMITS.bytes || /<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml)) throw Error('Unsafe XML');
  // This lexical guard supplements the maintained XML validator; it does NOT
  // parse RSS structure. Entity-like text in CDATA/comments is not markup.
  const entityText = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->/g, '');
  if (/&(?!(?:amp|lt|gt|quot|apos|#[0-9]+|#x[0-9a-f]+);)/i.test(entityText)) throw Error('Unknown XML entity');
  decodeXml(entityText);
  if (XMLValidator.validate(xml) !== true) throw Error('Malformed XML');
  const tree = parser.parse(xml);
  const stack = tree.map(node => ({ node, depth: 1 }));
  let items = 0;
  // Iterative traversal never recurses on attacker-controlled depth.
  while (stack.length) {
    const { node, depth } = stack.pop();
    if (depth > XML_LIMITS.depth) throw Error('XML depth limit');
    for (const [key, value] of Object.entries(node)) {
      if (key === 'item' && ++items > XML_LIMITS.items) throw Error('RSS item limit');
      if (key === ':@') {
        if (Object.values(value).some(val => String(val).length > XML_LIMITS.text)) throw Error('XML text limit');
      } else if (Array.isArray(value)) {
        for (const child of value) stack.push({ node: child, depth: depth + 1 });
      } else if (typeof value === 'string' && value.length > XML_LIMITS.text) throw Error('XML text limit');
    }
  }
  const roots = tree.filter(node => !Object.keys(node).some(key => key.startsWith('?') || key === '#text' || key === '#comment'));
  if (roots.length !== 1 || !roots[0].rss || roots[0][':@']?.['@_version'] !== '2.0') throw Error('Expected RSS2');
  const rss = roots[0].rss, channels = nodes(rss, 'channel');
  if (channels.length !== 1 || nodes(rss, 'item').length) throw Error('Invalid RSS channel');
  const candidates = [];
  for (const item of nodes(channels[0], 'item')) {
    const title = field(item, 'title', true), url = field(item, 'link', true);
    const pubDate = field(item, 'pubDate'), dcDate = field(item, 'dc:date'), guid = field(item, 'guid');
    if (!pubDate && !dcDate) throw Error('Missing publication date');
    if (dcDate && !ISO_DATE.test(dcDate)) throw Error('Invalid ISO publication date');
    if (pubDate && !/\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{2}:\d{2}(?::\d{2})?\s+(?:GMT|UT|[+-]\d{4})$/.test(pubDate)) throw Error('Invalid RSS publication date');
    const time = Date.parse(pubDate || dcDate);
    if (!Number.isFinite(time) || pubDate && dcDate && Date.parse(dcDate) !== time) throw Error('Invalid publication date');
    const key = canonicalUrlKey(url);
    if (!key) throw Error('Invalid RSS link');
    // GUID is an opaque identity, never a request target. No bodies/GUIDs fetched.
    const sourceId = guid || createHash('sha256').update(key).digest('hex');
    const article = makeArticle({
      source: 'infoq', sourceId, title, url, eventAt: new Date(time).toISOString(),
      sourceTags: nodes(item, 'category').map(textOf).map(tag => tag.trim()),
    }, clock);
    if (article) candidates.push(article);
  }
  return candidates;
}

export async function collectInfoq(options, clock) {
  const candidates = [];
  for (const feed of INFOQ_FEEDS) candidates.push(...parseInfoq(await requestText(feed, options), clock));
  return candidates;
}
