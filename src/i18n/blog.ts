import type { Locale } from './routes';
import { CATEGORIES } from '../data/article-topics.mjs';

const en = {
  title: 'Blog', description: 'Recent reading on AI, software engineering and development, alongside the notebook of Jean Pierre Ayala Viera.',
  eyebrow: 'Jean Pierre / Notes & reading', lead: 'Technology, tools and the questions behind the software we use.',
  authored: 'From my notebook', notebookLead: 'My own notes on technology and the tools I use.', posts: 'articles', read: 'Read article', back: 'All articles', published: 'Published',
  home: 'Home', skip: 'Skip to content',
  recent: 'Recent reading',
  topics: 'Browse reading by topic', all: 'All topics', shared: 'Shared', original: 'Read at source', newTab: '(opens in a new tab)',
  empty: 'No recent links to read here yet.', emptyCategory: 'No links published or shared in this topic yet. Browse all topics or explore my notebook below.',
  pagination: 'Reading pages', page: 'Page', previous: 'Previous', next: 'Next',
  range: (start: number, end: number, total: number) => `Showing ${start}–${end} of ${total}`,
};
export type BlogCopy = typeof en;
const es: BlogCopy = {
  title: 'Blog', description: 'Lecturas recientes sobre IA, ingeniería de software y desarrollo, junto al cuaderno de Jean Pierre Ayala Viera.',
  eyebrow: 'Jean Pierre / Notas y lecturas', lead: 'Tecnología, herramientas y las preguntas detrás del software que usamos.',
  authored: 'De mi cuaderno', notebookLead: 'Mis propias notas sobre tecnología y las herramientas que uso.', posts: 'artículos', read: 'Leer artículo', back: 'Todos los artículos', published: 'Publicado',
  home: 'Inicio', skip: 'Saltar al contenido',
  recent: 'Lecturas recientes',
  topics: 'Explorar lecturas por tema', all: 'Todos los temas', shared: 'Compartido', original: 'Leer en origen', newTab: '(se abre en una pestaña nueva)',
  empty: 'Todavía no hay enlaces recientes para leer aquí.', emptyCategory: 'Todavía no hay enlaces publicados o compartidos sobre este tema. Explora todos los temas o mi cuaderno más abajo.',
  pagination: 'Páginas de lecturas', page: 'Página', previous: 'Anterior', next: 'Siguiente',
  range: (start: number, end: number, total: number) => `Mostrando ${start}–${end} de ${total}`,
};
export const blogCopy: Record<Locale, BlogCopy> = { en, es };
// Stable query keys are separate from the shared classifier's category names.
export const blogTopics = [
  { key: 'ai-engineering', category: 'AI Engineering', en: 'AI Engineering', es: 'Ingeniería de IA' },
  { key: 'software-architecture', category: 'Software Architecture', en: 'Software Architecture', es: 'Arquitectura de software' },
  { key: 'web-development', category: 'Web Development', en: 'Web Development', es: 'Desarrollo web' },
  { key: 'automation-integrations', category: 'Automation Integrations', en: 'Automation Integrations', es: 'Automatización e integraciones' },
  { key: 'cloud-devops', category: 'Cloud DevOps', en: 'Cloud DevOps', es: 'Nube y DevOps' },
  { key: 'security', category: 'Security', en: 'Security', es: 'Seguridad' },
] as const satisfies readonly { key: string; category: (typeof CATEGORIES)[number]; en: string; es: string }[];
type BlogTopic = (typeof blogTopics)[number];
const legacyTopicAliases: Record<string, BlogTopic['key']> = {
  ai: 'ai-engineering', harnesses: 'ai-engineering', development: 'web-development',
  'software-engineering': 'software-architecture', cloud: 'cloud-devops',
};
export function resolveBlogTopic(key: string | null): BlogTopic | undefined {
  const canonical = key && Object.hasOwn(legacyTopicAliases, key) ? legacyTopicAliases[key] : key;
  return blogTopics.find(topic => topic.key === canonical);
}
export function filterBlogArticles<T extends { primaryCategory: string }>(articles: T[], topic?: BlogTopic): T[] {
  return topic ? articles.filter(article => article.primaryCategory === topic.category) : articles;
}
const blogTags: Record<string, Record<Locale, string>> = {
  AI: { en: 'AI', es: 'IA' }, Harnesses: { en: 'Harnesses', es: 'Harnesses' }, Agents: { en: 'Agents', es: 'Agentes' },
};
export function blogTagLabel(tag: string, locale: Locale): string {
  return Object.hasOwn(blogTags, tag) ? blogTags[tag][locale] : tag;
}
export function blogDate(value: string, locale: Locale, withTime = false): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' } as const : {}),
  }).format(new Date(value));
}
