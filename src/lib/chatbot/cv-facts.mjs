// Public CV facts copied verbatim from cv/en.html and cv/es.html. Every string
// value must appear in its locale's CV (tests/chatbot-cv-sync.test.mjs), so a CV
// edit without updating this file fails the suite. No phone or private details.
export const cvFacts = {
  en: {
    experience: 'more than 3 years',
    roles: [
      { title: 'Full-Stack Software Developer', company: 'Maia Consultores', period: '2024 – Present' },
      { title: 'Freelance Developer', company: 'Independent', period: '2022 – 2023',
        clients: ['Esaalud Neuro', 'Bodega Don Pedro', 'Pizzería Elena'] },
    ],
    achievements: ['Startup Perú 2025', 'Meta Tech Provider'],
    certifications: [
      { issuer: 'IBM · Generative AI & RAG', year: '2026', detail: '6 courses: RAG applications, vector databases, generative AI apps, Python for AI' },
      { issuer: 'University of Colorado', year: '2026', detail: 'Requirements engineering for secure software (2 courses)' },
      { issuer: 'Google', year: '2026', detail: 'Foundations of Project Management' },
      { issuer: 'Google', detail: 'Web Development' },
      { issuer: 'Udemy', detail: 'React, PHP, Laravel' },
    ],
    languages: ['Spanish — Native', 'English — Advanced'],
    // portfolioId links a CV project to the same entry in src/i18n/home.ts.
    projects: [
      { name: 'Centro Carnes', portfolioId: 'centro-carnes' },
      { name: 'CRM Maia Consultores', portfolioId: 'crm-consultores' },
      { name: 'Huracorp', portfolioId: 'huracorp' },
      { name: 'Maia Plagas', portfolioId: 'maia-plagas' },
      { name: 'AI Chatbot for Hortifruit' },
      { name: 'Portfolio AI assistant' },
      { name: 'AI Learning', portfolioId: 'ai-learning' },
      { name: 'Course Notes Generator', portfolioId: 'course-notes' },
    ],
  },
  es: {
    experience: 'más de 3 años',
    roles: [
      { title: 'Desarrollador de Software Full-Stack', company: 'Maia Consultores', period: '2024 – Actualidad' },
      { title: 'Desarrollador Freelance', company: 'Independiente', period: '2022 – 2023',
        clients: ['Esaalud Neuro', 'Bodega Don Pedro', 'Pizzería Elena'] },
    ],
    achievements: ['Startup Perú 2025', 'Meta Tech Provider'],
    certifications: [
      { issuer: 'IBM · IA Generativa y RAG', year: '2026', detail: '6 cursos: aplicaciones RAG, bases vectoriales, apps con IA generativa, Python para IA' },
      { issuer: 'University of Colorado', year: '2026', detail: 'Ingeniería de requisitos para software seguro (2 cursos)' },
      { issuer: 'Google', year: '2026', detail: 'Foundations of Project Management' },
      { issuer: 'Google', detail: 'Desarrollo web' },
      { issuer: 'Udemy', detail: 'React, PHP, Laravel' },
    ],
    languages: ['Español — Nativo', 'Inglés — Avanzado'],
    projects: [
      { name: 'Centro Carnes', portfolioId: 'centro-carnes' },
      { name: 'CRM Maia Consultores', portfolioId: 'crm-consultores' },
      { name: 'Huracorp', portfolioId: 'huracorp' },
      { name: 'Maia Plagas', portfolioId: 'maia-plagas' },
      { name: 'Chatbot con IA para Hortifruit' },
      { name: 'Asistente IA del portafolio' },
      { name: 'AI Learning', portfolioId: 'ai-learning' },
      { name: 'Course Notes Generator', portfolioId: 'course-notes' },
    ],
  },
};

// Rendered by scripts/render-cv.py: resume.pdf is English, resume_es.pdf Spanish.
// Each locale lists its own language first.
export const cvDownloads = {
  en: [
    { id: 'cv-en', label: 'CV (English)', href: '/resume.pdf' },
    { id: 'cv-es', label: 'CV (Spanish)', href: '/resume_es.pdf' },
  ],
  es: [
    { id: 'cv-es', label: 'CV en español', href: '/resume_es.pdf' },
    { id: 'cv-en', label: 'CV en inglés', href: '/resume.pdf' },
  ],
};
