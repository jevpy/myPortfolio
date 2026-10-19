import type { Locale } from './routes';
const en = {
  home: 'Home', codeTools: 'Code Tools', tools: 'Tools', blog: 'Blog', navigation: 'Main navigation', menu: 'Toggle navigation',
  about: 'About', aboutDescription: 'Explore my life as a developer, what technologies I use and what I bring to the wonderful world of development.',
  toolsTitle: 'AI, Web, Programming and more', blogDescription: 'Follow the news on tools, AI and more that can be useful in your life. Also keep up to date with these news',
  role: 'Fullstack & Web developer', available: 'Avaliable for working', aboutMe: 'About Me',
  bio: 'I am a self-taught developer who adapts to unfamiliar technologies, using AI to accelerate learning and implementation. I enjoy spending time with my pets and family.',
  goals: 'I bring discipline, collaboration and technical judgment to each project. I use documentation, tests and validation to check decisions and results, keeping engineering responsibility at the center of AI-assisted work.',
  talk: "Let's talk!", laptop: 'Laptop Image', resume: 'Resume', resumeDescription: 'To explore my professional trajectory using 2 ways: online version or in pdf format .', resumeEn: 'Resume(en)', resumeEs: 'Resume(es)',
  projects: 'Projects', techs: 'techs:', code: 'Code', explore: 'Explore More', skills: 'Skills', mainText: 'Thinking, Smiling and Coding',
  phrases: ['Expert in writing clean, efficient code', 'Passionate about delivering high-quality, effective code', 'Built scalable solutions that grow with client demands', 'Delivered well-structured code that ensures client satisfaction and performance'],
  codingHeading: 'Coding Tools', codingIntro: 'Unlock your programming potential with our curated collection of coding tools designed for developers at all levels. Explore our resources to elevate your coding experience and turn your ideas into reality!',
  dailyHeading: 'Daily Tools', dailyIntro: 'Make every day more efficient with our essential daily tools designed to simplify your routine and enhance productivity. Discover how our daily tools can transform your workflow and elevate your everyday tasks!',
  readMore: 'Read more', posts: 'articles',
};
const es: typeof en = {
  home: 'Inicio', codeTools: 'Herramientas de programación', tools: 'Herramientas', blog: 'Blog', navigation: 'Navegación principal', menu: 'Abrir o cerrar la navegación',
  about: 'Acerca de mí', aboutDescription: 'Conoce mi trayectoria como desarrollador, las tecnologías que utilizo y lo que aporto al mundo del desarrollo.',
  toolsTitle: 'IA, web, programación y más', blogDescription: 'Descubre novedades sobre herramientas, IA y otros recursos útiles para tu vida y mantente al día.',
  role: 'Desarrollador fullstack y web', available: 'Disponible para trabajar', aboutMe: 'Acerca de mí',
  bio: 'Soy un desarrollador autodidacta que se adapta a tecnologías nuevas, utilizando IA para acelerar el aprendizaje y la implementación. Disfruto pasar tiempo con mis mascotas y mi familia.',
  goals: 'Aporto disciplina, colaboración y criterio técnico a cada proyecto. Utilizo documentación, pruebas y validación para comprobar decisiones y resultados, manteniendo la responsabilidad de ingeniería en el centro del trabajo asistido por IA.',
  talk: '¡Hablemos!', laptop: 'Imagen de un portátil', resume: 'Currículum', resumeDescription: 'Explora mi trayectoria profesional de dos maneras: en la versión en línea o en formato PDF.', resumeEn: 'Currículum (inglés)', resumeEs: 'Currículum (español)',
  projects: 'Proyectos', techs: 'Tecnologías:', code: 'Código', explore: 'Explorar más', skills: 'Habilidades', mainText: 'Pensar, sonreír y programar',
  phrases: ['Experto en escribir código limpio y eficiente', 'Apasionado por ofrecer código eficaz y de alta calidad', 'He creado soluciones escalables que crecen con las necesidades del cliente', 'He entregado código bien estructurado que garantiza la satisfacción del cliente y el rendimiento'],
  codingHeading: 'Herramientas de programación', codingIntro: 'Desarrolla tu potencial con nuestra selección de herramientas de programación para desarrolladores de todos los niveles. Explora estos recursos para mejorar tu experiencia y convertir tus ideas en realidad.',
  dailyHeading: 'Herramientas cotidianas', dailyIntro: 'Haz que cada día sea más eficiente con herramientas esenciales que simplifican tu rutina y mejoran la productividad. Descubre cómo pueden transformar tu flujo de trabajo y tus tareas cotidianas.',
  readMore: 'Leer más', posts: 'artículos',
};
export const legacy: Record<Locale, typeof en> = { en, es };
export function postDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es' : 'en', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date));
}
