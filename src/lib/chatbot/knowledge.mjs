import { cvFacts, cvDownloads } from './cv-facts.mjs';

// Curated public identity/contact/stack: src/views/HomePage.astro hero and skills.
// Keep this small source synchronized if those published statements change.
export const publicIdentity = {
  name: 'Jean Pierre Ayala Viera',
  email: 'jean.ayala.viera@gmail.com',
  stack: ['React', 'Next.js', 'JavaScript', 'TypeScript', 'Express', 'PHP', 'Laravel', 'n8n', 'MongoDB', 'MySQL', 'PostgreSQL', 'Prisma', 'AWS', 'Google Cloud', 'Docker'],
};

// Explicit projection prevents server configuration or incidental fields being serialized.
// The caller supplies CURRENT homeCopy/projects, not legacy content or remote sources.
export function createKnowledge({ homeCopy, projects }) {
  return Object.fromEntries(['en', 'es'].map(locale => {
    const t = homeCopy[locale];
    const home = locale === 'es' ? '/es/' : '/';
    return [locale, {
      name: publicIdentity.name, email: publicIdentity.email,
      role: t.role, about: t.aboutText, experience: t.heroLead,
      contact: t.contactLead, stack: [...publicIdentity.stack],
      capabilities: [t.interfacesText, t.serversText, t.dataText, t.cloudText],
      // Public owner statements, not independent award/transition verification.
      // Keep first-person source text intact; answer writers must not adopt its voice.
      achievements: (t.achievements ?? []).map(a => ({
        id: a.id, title: a.title, statement: a.statement,
        brand: a.brand, projectId: a.projectId,
        source: 'owner-authored',
        qualification: 'Owner-authored public statement; not independently verified. Describe in third person; do not impersonate the owner. Unstated award and transition details remain unknown.',
      })),
      projects: projects.map(p => ({
        id: p.id, name: p.name, displayName: p[locale].displayName ?? p.name,
        type: p.type, stack: [...p.stack], category: p[locale].category,
        description: p[locale].description, problem: p[locale].problem,
        solution: p[locale].solution, impact: p[locale].impact, features: [...p[locale].features],
        status: p[locale].status, qualification: p[locale].qualification,
      })),
      // Public CV facts (cv/*.html); portfolio projects above remain the project source.
      cv: structuredClone(cvFacts[locale]),
      links: [
        { id: 'projects', label: t.projects, href: `${home}#proyectos` },
        { id: 'tech', label: t.capabilities, href: `${home}#habilidades` },
        { id: 'contact', label: t.contact, href: `${home}#contacto` },
        { id: 'email', label: t.writeEmail, href: `mailto:${publicIdentity.email}` },
        ...cvDownloads[locale].map(link => ({ ...link })),
      ],
    }];
  }));
}
