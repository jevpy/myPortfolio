// Server-side check that every "Technology Version" pair in an AI reply is
// published verbatim in the public knowledge (stack chips, project text, CV).
// Bare numbers (years, counts like "11 forms" or "3 years") are not versions.
const KNOWN = ['Laravel', 'PHP', 'Livewire', 'Next.js', 'React', 'Node.js', 'Python', 'PostgreSQL', 'MySQL',
  'Astro', 'TypeScript', 'Tailwind', 'Docker', 'Gemini', 'GPT-OSS', 'Qwen', 'Auth.js', 'Drizzle'];
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const year = /^(?:19|20)\d\d$/;

const strings = value => typeof value === 'string' ? [value]
  : Array.isArray(value) ? value.flatMap(strings)
  : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];

// Known technology names: the fixed list plus every published stack chip name.
function technologyNames(data) {
  const chips = [...(data.stack ?? []), ...(data.projects ?? []).flatMap(p => p.stack ?? [])]
    .map(chip => chip.replace(/\s+v?\d+(?:\.\d+)*$/u, ''));
  return [...new Set([...KNOWN, ...chips].map(name => name.toLowerCase()))];
}

function pairs(text, names) {
  const found = [];
  const known = new RegExp(`(?<![\\w.])(${names.sort((a, b) => b.length - a.length).map(escape).join('|')})\\s*v?(\\d+(?:\\.\\d+)*)\\b`, 'giu');
  for (const [, name, version] of text.matchAll(known)) found.push({ name: name.toLowerCase(), version, known: true });
  // Unknown capitalized names count only with a dotted version ("Foo 2.1"),
  // so sentence-initial counts ("In 11 modules") are never mistaken for versions.
  for (const [, name, version] of text.matchAll(/(?<![\w.])([A-Z](?:[\w.+-]*[\w+])?)\s*v?(\d+\.\d+(?:\.\d+)*)\b/gu)) {
    if (!names.includes(name.toLowerCase())) found.push({ name: name.toLowerCase(), version, known: false });
  }
  return found.filter(pair => !year.test(pair.version));
}

export function publishedVersions(data) {
  const names = technologyNames(data);
  return new Set(strings(data).flatMap(text => pairs(text, names)).map(p => `${p.name} ${p.version}`));
}

// Returns the unpublished "name version" pairs; an empty list means the reply is grounded.
export function unpublishedVersions(text, data) {
  const allowed = publishedVersions(data);
  return pairs(text, technologyNames(data)).map(p => `${p.name} ${p.version}`).filter(pair => !allowed.has(pair));
}
