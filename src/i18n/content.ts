import type { Locale } from './routes';
// Name-keyed overlays change display copy only: source order, URLs, brands,
// technology identifiers and filter fields remain owned by the legacy JSON.
export const projectsEs: Record<string, { name: string; description: string }> = {
  'Health System': { name: 'Sistema de salud', description: 'Sistema que informa a los pacientes sobre su tratamiento.' },
  'Hotel System': { name: 'Sistema hotelero', description: 'Sistema que gestiona las habitaciones de un hotel. Incluye una página de administración y un sitio web.' },
  'Education Website': { name: 'Sitio web educativo', description: 'Sitio web concebido para comunicarse de forma clara y eficiente con los clientes de los centros educativos.' },
  'Budget Platform': { name: 'Plataforma de presupuesto', description: 'Aplicación para gestionar gastos e ingresos. Incluye un panel de administración y una aplicación móvil.' },
};
export const toolsEs: Record<string, string> = {
  'Portfolio4Me': 'Portfolio4Me ofrece una plataforma rápida e intuitiva para crear y gestionar carteras de inversión diversificadas con estrategias inteligentes adaptadas a cada tipo de inversor.',
  'Compose Icons': 'Mejora la experiencia de usuario de tu aplicación con una biblioteca de iconos reactivos para acciones de interfaz fluidas. Ideal para desarrolladores que desean ahorrar tiempo sin renunciar al estilo.',
  'hCaptcha for WP': 'hCaptcha para WordPress permite implementar fácilmente una capa de seguridad sólida y centrada en la privacidad que mantiene alejados a los bots y respeta los datos de los usuarios. Olvídate del spam y concéntrate en tu contenido.',
  'Nkhili CSS Framework': 'NkhiliCSS es un framework CSS ligero que simplifica la creación de diseños web atractivos y adaptables. Es fácil de aprender, personalizable y funciona con proyectos de cualquier tamaño.',
  'Authentik': 'Explora el futuro de las identidades digitales seguras con GoAuthentik. Simplifica la autenticación de usuarios con una plataforma intuitiva y protege tus datos sin complicaciones.',
  'CloneWebX': 'CloneWebX permite duplicar cualquier sitio web fácilmente y ofrece herramientas de personalización para realizar ajustes y mejoras. Ideal para desarrolladores y diseñadores que buscan ahorrar tiempo y esfuerzo sin perder calidad.',
  'Tailwind Gennie': 'Tailwind Genie facilita la creación de interfaces elegantes y adaptables. Genera código Tailwind CSS al instante a partir de diseños visuales y da vida a tus ideas fácilmente.',
  'Stack Auth': 'StackAuth es un cortafuegos para tus aplicaciones. Protege tus datos frente a filtraciones con una integración sencilla y funciones sólidas. Mejora la seguridad de tu aplicación sin complicar tu flujo de trabajo.',
  'ProdBrief Generator': 'ProdBrief facilita el desarrollo de productos. Crea, gestiona y comparte documentos de proyecto en minutos: ideal para equipos que buscan agilizar la comunicación y dar vida a sus ideas sin esfuerzo.',
  'Converter Code': 'Simplifica las tareas de programación con ConverterCode. Transforma fragmentos de código, organiza ideas e inicia el desarrollo sin esfuerzo. Ideal para programadores que buscan soluciones rápidas.',
  'Formity': 'Formity agiliza la creación, implementación y gestión de formularios para tu empresa. Personaliza fácilmente, integra sin complicaciones y recopila datos de manera eficiente sin conocimientos técnicos.',
  'Eldora UI': 'Eldora UI Kit ofrece a los diseñadores un conjunto potente de herramientas para crear rápidamente interfaces atractivas y fáciles de usar. Es rápido de configurar, intuitivo y ofrece resultados cuidados.',
  'Chart AI': 'Chart AI da vida a tus datos creando gráficos atractivos al instante. No requiere conocimientos técnicos: carga tu conjunto de datos y la automatización generará visualizaciones detalladas que cuentan su historia.',
  'Component Wizard': 'Component Wizard transforma ideas de diseño en componentes funcionales para aplicaciones web sin esfuerzo. Arrastra, suelta y conecta, sin programar. Ideal para fundadores que quieren lanzar sus ideas rápidamente.',
  'PalForm': 'PalForm facilita la creación de formularios sencillos e interactivos. Agiliza la recopilación de datos, mejora la experiencia de usuario y ahorra tiempo. Ideal para comentarios, registros o encuestas.',
  'TinyWow': 'TinyWow facilita y acelera las tareas digitales cotidianas. Ya sea convertir archivos, editar vídeos o crear gráficos rápidos, sus herramientas ayudan a completar el trabajo sin complicaciones.',
  'Indie Starter UI': 'Indie Starter UI es un conjunto de herramientas de diseño para crear sitios web atractivos. Con plantillas sin código y diseños dinámicos, permite lanzar productos digitales impactantes sin esfuerzo.',
  'LibSwitch': 'LibSwitch simplifica la gestión de bibliotecas automatizando el seguimiento de libros, los préstamos y las devoluciones. Ahorra tiempo y reduce errores; es ideal para escuelas y bibliotecas comunitarias.',
  'URLtoText': 'URLtoText convierte al instante cualquier página web en texto limpio y fácil de editar. Ideal para creadores que desean reutilizar contenido o mejorar su productividad.',
  'Domain Explorer': 'Domain Explorer permite descubrir, analizar y comparar nombres de dominio. Encuentra con facilidad y precisión el dominio que refleja la visión de tu marca.',
  'Popify': 'Popify ayuda a captar la atención del público mediante ventanas emergentes inteligentes y personalizables. Desde la captación de clientes potenciales hasta los anuncios, busca mejorar la interacción sin resultar intrusivo.',
  'TTS Maker': '¿Necesitas una locución sin complicaciones? TTS Maker convierte tu texto en audio natural con distintas voces. Es fácil de usar e ideal para pódcast, vídeos y mucho más.',
  'CoolMindMaps': 'CoolMindMaps ayuda a los creadores a convertir sus ideas en mapas mentales visuales y dinámicos. Desarrolla tu creatividad, organiza tus pensamientos y colabora sin esfuerzo.',
  'VideoDubber AI': 'VideoDubber AI transforma vídeos doblando las palabras habladas a varios idiomas mediante IA avanzada para generar locuciones fluidas y sincronizadas. Ideal para creadores que buscan llegar a un público global.',
  'MemFree': 'MemFree permite buscar cualquier cosa al instante y obtener respuestas precisas de diversas fuentes, como internet, marcadores, notas y documentos. También ofrece indexación de marcadores y páginas web con un clic para mejorar la experiencia de búsqueda.',
  'Venice AI': 'Venice es una alternativa innovadora y sin restricciones de acceso a las aplicaciones de IA convencionales, diseñada para respetar la privacidad y ofrecer inteligencia artificial sin censura ni sesgos. A diferencia de otras aplicaciones, no vulnera tu privacidad ni censura las respuestas, por lo que se presenta como una herramienta fiable para tus necesidades de IA.',
  'Humanizar Texto': 'Humanizar Texto transforma textos complejos en contenido cercano y humanizado. Ideal para conectar emocionalmente con tu público sin perder claridad ni autenticidad.',
  'AI Translator': 'AITranslator utiliza inteligencia artificial avanzada para traducir, analizar y sugerir traducciones óptimas. Admite una amplia variedad de idiomas, desde los más comunes, como inglés y español, hasta otros menos frecuentes, como aimara y zulú.',
  'Learn Opal': 'Opal es una herramienta de estudio con IA diseñada para potenciar el aprendizaje. Ofrece notas generadas por IA, tarjetas de estudio, cuestionarios y mucho más. Creada por estudiantes para estudiantes, permite cargar cualquier tipo de documento para estudiar de forma eficiente.',
  'PsyPM': 'PsyPM ofrece herramientas personalizadas de bienestar mental para comprender mejor tu mente. Su plataforma, diseñada para ser eficiente y eficaz, ayuda a registrar, comprender y mejorar tu salud mental sin complicaciones.',
  'Keo': 'Keo es un asistente de IA dedicado a ayudarte a mantener la organización y la concentración en tus tareas. Aprende y comprende tus tareas para ofrecerte la mejor ayuda posible.',
  'AI Signature Generator': 'Deja atrás las firmas de correo aburridas. AI Signature Generator ayuda a crear firmas personalizadas y llamativas. Introduce tus datos, elige entre diseños atractivos y deja que la IA haga el resto.',
  'AI Photo Enhancer': 'Mejora tus fotos al instante con tecnología avanzada de IA. Eleva la calidad de tus fotografías con un clic, mejorando la nitidez, los colores y los detalles sin esfuerzo.',
  'Chat PDF': 'Da vida a tus PDF interactuando directamente con ellos. Extrae información, formula preguntas y trabaja con tus documentos de una nueva manera. Ideal para estudiantes, investigadores y profesionales con poco tiempo.',
  'AnySummary': 'AnySummary permite crear resúmenes concisos e informativos de artículos extensos, informes o vídeos. Ideal para profesionales con poco tiempo y personas con interés por aprender.',
  'NoteGPT': 'NoteGPT utiliza IA para capturar y organizar ideas, notas y tareas rápidamente. Trabaja de forma más inteligente con resúmenes eficientes y categorización automática para concentrarte en lo que realmente importa.',
};
export function toolDescription(tool: { name: string; description: string }, locale: Locale): string {
  return locale === 'es' ? toolsEs[tool.name] : tool.description;
}
export const postSummaries: Record<Locale, Record<string, string>> = {
  en: {
    '2024-05-30-chatgpt-forums': 'A comparison of ChatGPT and forums, and why information quality matters.',
    '2024-05-31-bye-windows-10': 'Microsoft announces the end of Windows 10 support and recommends Windows 11.',
    '2024-05-31-tool-to-link-preview': 'Preview links and avoid distractions with Max Focus.',
    '2024-06-02-tool-for-notes': 'Organize and synchronize notes with the free OpenNotas app.',
    '2024-07-19-microsoft-windows-outages': "The Blue Screen of Death have appeared on the different companies' devices",
  },
  es: {
    '2024-05-30-chatgpt-forums': 'Una comparación entre ChatGPT y los foros, y por qué importa la calidad de la información.',
    '2024-05-31-bye-windows-10': 'Microsoft anuncia el fin del soporte de Windows 10 y recomienda Windows 11.',
    '2024-05-31-tool-to-link-preview': 'Previsualiza enlaces y evita distracciones con Max Focus.',
    '2024-06-02-tool-for-notes': 'Organiza y sincroniza tus notas con la aplicación gratuita OpenNotas.',
    '2024-07-19-microsoft-windows-outages': 'La pantalla azul de la muerte ha aparecido en los dispositivos de distintas empresas.',
  },
};
