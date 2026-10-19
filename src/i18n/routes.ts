export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export function localeFromLang(lang: string): Locale {
  return lang.toLowerCase().split('-')[0] === 'es' ? 'es' : 'en';
}
/** Only local page paths are localized; assets, mailto and external URLs stay intact. */
export function localizedPath(path: string, locale: Locale): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? '' : path.slice(suffixIndex);
  const base = pathname === '/es' ? '/' : pathname.replace(/^\/es\//, '/');
  if (/\.[^/]+$/.test(base)) return path;
  return (locale === 'es' ? (base === '/' ? '/es/' : `/es${base}`) : base) + suffix;
}
export function counterpartPath(path: string, locale: Locale): string {
  return localizedPath(path, locale === 'en' ? 'es' : 'en');
}
