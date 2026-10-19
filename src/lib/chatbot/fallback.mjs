import { chatbotCopy } from '../../i18n/chatbot.mjs';

const normalize = value => String(value).toLowerCase().normalize('NFD')
  .replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const contains = (query, term) => (` ${query} `).includes(` ${normalize(term)} `);
const keywords = {
  projects: ['projects', 'project', 'proyectos', 'proyecto'],
  tech: ['tech', 'technology', 'technologies', 'tecnologia', 'tecnologias', 'stack', 'skills', 'habilidades', 'capabilities', 'capacidades'],
  experience: ['experience', 'experiencia', 'about', 'perfil'],
  contact: ['contact', 'contacto', 'email', 'correo'],
};
// Question scaffolding is not feature evidence. Remaining words must match
// published feature text; this is bounded lexical routing, not understanding.
const scaffolding = new Set(('what how does do is are the a an in on for of with and tell me about use uses used '
  + 'que como cual cuales el la los las un una en de del con y sobre usa usar utiliza '
  + 'project projects proyecto proyectos features feature funciones funcion details detalles '
  + 'can you explain puedes explicar tiene have it its su sus hablame cuentame dime '
  + 'purpose proposito status estado implementation implementacion description descripcion '
  + 'work works funciona handle handles implement implements manage gestiona implementa').split(' '));
function relevantFeature(project, query) {
  let detail = query;
  for (const name of projectNames(project).sort((a, b) => normalize(b).length - normalize(a).length)) {
    detail = (` ${detail} `).replace(` ${normalize(name)} `, ' ').trim();
  }
  const tokens = [...new Set(detail.split(' ').filter(word => word.length > 2 && !scaffolding.has(word)))];
  const ranked = project.features.map((text, index) => ({ text, index,
    score: tokens.filter(word => contains(normalize(text), word)).length,
  })).sort((a, b) => b.score - a.score || a.index - b.index);
  return { detail: tokens.length > 0, text: ranked[0]?.score ? ranked[0].text : null };
}
// Strip only a published trailing version, not arbitrary substrings (React != React Native).
const technologyName = value => value.replace(/\s+\d+(?:\.\d+)*$/, '');
const capabilityGroups = [
  ['React', 'Next.js', 'JavaScript', 'TypeScript'],
  ['Express', 'PHP', 'Laravel', 'n8n'],
  ['MongoDB', 'MySQL', 'PostgreSQL', 'Prisma'],
  ['AWS', 'Google Cloud', 'Docker'],
];

// Natural references visitors use for published projects, in both locales.
const aliases = {
  'centro-carnes': ['Traceability System', 'Sistema de trazabilidad', 'traceability', 'trazabilidad'],
  huracorp: ['Waste Management Software', 'Software de residuos', 'waste management', 'gestion de residuos', 'waste', 'residuos'],
  'maia-plagas': ['Sanitation Software', 'Software de saneamiento', 'pest control', 'control de plagas', 'pest', 'plagas', 'sanitation', 'saneamiento'],
  'course-notes': ['Course Notes', 'generador de apuntes', 'apuntes'],
  'license-server': ['License Server', 'servidor de licencias', 'license', 'licenses', 'licencias'],
  'maia-website': ['website', 'sitio web', 'pagina web'],
};
// Published project narrative fields a visitor can ask for by name.
const facetTerms = {
  problem: /\b(?:problems?|problemas?)\b/u,
  solution: /\b(?:solution|solucion)\b/u,
  impact: /\b(?:impact|impacto|outcome|results?|resultados?)\b/u,
};
const projectNames = project => [project.name, project.displayName, project.id, ...(aliases[project.id] ?? [])];
const commercial = 'salary|sueldo|remuneracion|rates|price|prices|pay|employer|employers|jobs|years|salario|tarifas|precio|empleador|empleadores|empleos|anos|availability|disponibilidad';
const greeting = /^(hi|hello|hey|hola|buenos dias|buenas tardes)$/u;
// Intent templates are anchored to the ENTIRE input. Slots contain only named
// public entities or bounded feature nouns, never arbitrary tails/instructions.
// This grammar intentionally clarifies valid but unrecognized phrasings.
const featureTerms = ('purpose features feature status implementation implemented description details stack technology technologies '
  + 'proposito funciones funcion estado implementacion implementado descripcion detalles tecnologia tecnologias '
  + 'attachments adjuntos signatures firmas grace gracia gps oauth odt pdf exports exportaciones '
  + 'authentication autenticacion persistence persistencia idempotency idempotencia automation automatizacion '
  + 'webhooks gmail calendar google roles permissions permisos access acceso signing firma '
  + 'database framework base de datos planned planificado production readiness produccion '
  + 'domain modules architectural layers modulos dominio capas arquitectonicas '
  + 'tracking progress correction lessons courses seguimiento progreso correccion lecciones cursos '
  + 'pagination filtering search paginacion filtros busqueda inventory inventario '
  + 'traceability trazabilidad licensing licencias dry run live ai prueba ia '
  + 'kubernetes queued jobs cola tareas attachments adjuntos signatures firmas '
  + 'sha 256 mime zip xlsx excel pdfs evidence evidencias exports exportaciones '
  + 'forms formularios audit auditoria approvals aprobacion documents documentos '
  + 'domain binding vinculacion dominios grace period periodo gracia '
  + 'hooks hook rebuilds reconstrucciones schema esquema adapters adaptador '
  + 'sign in login inicio sesion sync synchronization sincronizacion states estados '
  + 'implementation descriptions descripcion implementaciones role based por rol '
  + 'problem problema solution solucion impact impacto').split(' ');
const unrelated = /\b(recipe|recipes|receta|recetas|cooking|cocina|politics|politica|election|elecciones|capital|math|mathematics|matematicas|arithmetic|solve|resuelve|resolver|calculate|calcula|interest|intereses|finance|finanzas|financieros|investment|inversion|weather|clima|medical|medicina|tutorial|tutorials|teach|ensename|code|codigo|program|programa|write|escribe|generate|genera|ignore|ignora|override|instructions|instrucciones|rules|reglas|prompt|become|actua)\b/u;

function commonPortfolioTopic(query) {
  if (/^(?:que proyectos tienes|tell me about your projects)$/u.test(query)) return 'projects';
  if (/^con que tecnologias trabajas$/u.test(query)) return 'tech';
  if (/^what programming languages do you use$/u.test(query)) return 'languages';
  return null;
}

// A descriptive generation question is not a generation command. Only a full
// named-project + output template can bypass that verb's general rejection.
// This bounded output route is grounded in Course Notes' published ODT feature;
// recognized output/project mismatches clarify, never infer implementations.
function publishedOutputQuestion(data, query) {
  const formats = '(odt|pdf|excel|html|zip|xlsx|json|markdown|txt)';
  for (const project of data.projects) {
    for (const alias of projectNames(project)) {
      const name = normalize(alias);
      const match = query.match(new RegExp(`^how does ${name} generate ${formats}$`, 'u'))
        ?? query.match(new RegExp(`^como genera ${formats} ${name}$`, 'u'));
      const exports = project.id === 'course-notes'
        && new RegExp(`^${name} (?:exports|exportaciones|outputs|salidas)$`, 'u').test(query);
      if (!match && !exports) continue;
      const feature = project.id === 'course-notes' && (exports || match[1] === 'odt')
        ? project.features.find(text => contains(normalize(text), 'odt')
          && contains(normalize(text), 'odfpy') && /\b(output|salidas)\b/u.test(normalize(text))) : null;
      return { project, feature };
    }
  }
  return null;
}

// 'solve' is a rejected math verb in general; only this full named-project
// problem form may use it.
function projectProblemQuestion(data, query) {
  return data.projects.some(project => projectNames(project).some(alias => {
    const name = `(?:the |el |la )?(?:project |proyecto )?${normalize(alias)}(?: project)?`;
    return new RegExp(`^(?:what|which) problems? (?:does|do) ${name} (?:solve|address)$`, 'u').test(query)
      || new RegExp(`^(?:que|cual|cuales) problemas? (?:resuelve|soluciona|resuelven) ${name}$`, 'u').test(query);
  }));
}

function achievementQuestion(data, query) {
  // Full anchored owner-fact forms, not permission for business advice.
  for (const a of data.achievements ?? []) {
    const brand = normalize(a.brand);
    const award = a.id === 'startup-peru-2025';
    const subject = award ? '(?:startup peru(?: 2025)?|achievements|logros)'
      : '(?:meta tech provider|technology provider|tech provider|proveedor tecnologico|proveedor de tecnologia)';
    const unknown = '(?:funding|category|team|financiamiento|categoria|equipo|conversion year|ano de conversion|certification|certificacion|program details|detalles del programa)';
    const forms = award ? [
      `(?:what did you achieve with|que logro|que gano) ${brand}(?: en 2025)?`,
      `(?:what is|tell me about|que es|cuentame sobre) ${subject}(?: with| con)? ${brand}`,
    ] : [
      `how did ${brand} become a (?:meta tech provider|technology provider|tech provider)`,
      `como (?:se transformo|se convirtio) ${brand} en (?:un )?(?:meta tech provider|proveedor tecnologico|proveedor de tecnologia)`,
      `(?:what is|tell me about|que es|cuentame sobre) ${subject} (?:of|for|de) ${brand}`,
    ];
    forms.push(`${brand} ${subject}(?: ${unknown})?`, `${subject} (?:with|con|de) ${brand}(?: ${unknown})?`);
    if (forms.some(form => new RegExp(`^(?:${form})$`, 'u').test(query))) {
      return { achievement: a, unknown: new RegExp(`\\b${unknown}\\b`, 'u').test(query),
        details: /^(?:how did|como)/u.test(query) };
    }
  }
  return null;
}

// Full anchored CV forms: downloads plus public CV roles, certifications and
// spoken languages. Compound forms (e.g. 'Laravel employers') stay unknown.
const cvDocument = '(?:cv|curriculum(?: vitae)?|resume|hoja de vida)';
// The profile owner, never another person: "de Jean Pierre", "Jean Pierre's".
const owner = '(?:jean pierre(?: andre)?(?: ayala(?: viera)?)?|ayala(?: viera)?|jean)';
const workplace = `(?:(?:where|which company|what company) (?:does|do) (?:he|you|${owner}) (?:currently )?work(?: for| at)?`
  + `|(?:donde|en que empresa|para que empresa|en que compania) trabaja(?: ${owner})?(?: actualmente)?)`;
const cvForms = {
  download: new RegExp(`^(?:(?:where can i|can i|how can i|i want to|donde puedo|como puedo|puedo|quiero) )?(?:(?:download|get|see|view|descargar|descarga|obtener|ver|dame|give me|send me|enviame)(?: (?:me|the|your|his|el|tu|su|la))? )?(?:${owner}(?: s)? )?${cvDocument}(?: (?:de|del|of) ${owner})?(?: (?:pdf|in english|in spanish|english|spanish|en espanol|en ingles|espanol|ingles))?$`, 'u'),
  roles: new RegExp(`^(?:(?:(?:who are|what are|which are|quienes son|cuales son) (?:your |his |tus |sus )?)?(?:employers?|empleadores?|work history|employment history|historial laboral|trayectoria laboral)`
    + `|${workplace}|(?:what experience (?:does (?:he|${owner}) have|do you have)|que experiencia tiene(?: ${owner})?) (?:and|y) ${workplace})$`, 'u'),
  certifications: /^(?:(?:what|which|que|cuales)(?: (?:are|son))? (?:your |his |tus |sus )?)?(?:certifications?|certificates?|certificaciones?|certificados?)(?: (?:do you have|does he have|tienes|tiene))?$/u,
  languages: /^(?:(?:what|which|que|cuales) )?(?:spoken languages|languages|idiomas)(?: (?:do you speak|does he speak|hablas|habla))?$/u,
};
const cvQuestion = query => Object.keys(cvForms).find(id => cvForms[id].test(query)) ?? null;

// Topic gate (owner decision "Abrir por tema"): a remaining question that names
// the profile owner, a project or the CV is in scope; a profile technology also
// needs a profile signal. Generated work, other people and injections never are.
const generatedWork = /\b(?:essays?|ensayos?|translate|translation|traduce|traducir|traduccion|homework|deberes|tarea escolar|assignment|poems?|poemas?|jokes?|chistes?|story|cuento|song|cancion|crud|build me|create me|make me|hazme|creame|reveal|revela|revelar|disclose|divulga|jailbreak|secrets?|secretos?|api key)\b/u;
const otherPeople = /\b(?:another person|other person|otra persona|someone else|alguien mas|another candidate|other candidates?|otro candidato|otros candidatos|other developers?|otro desarrollador|otros desarrolladores|compare|compara|comparar|versus|vs|better than|mejor que)\b/u;
const ownerReference = new RegExp(`\\b(?:${owner}|he|him|his|himself|your|yours|yourself|tu|tus|su|sus|candidate|candidato|candidata|profile|perfil|portfolio|portafolio|hire|hiring|contratar|contratarlo|contratarle|recruit|reclutar)\\b`, 'u');
const cvReference = /\b(?:cv|curriculum|resume|hoja de vida|experience|experiencia|certifications?|certificaciones?)\b/u;
const profileSignal = /\b(?:experience|experiencia|skills?|habilidades|level|nivel|role|rol|puesto|position|fit|knows?|sabe|domina|worked|trabajado|used|usado|projects?|proyectos?)\b/u;
const definition = /^(?:(?:explain|explica|explicame|define|tell me|dime) )?(?:what|que) (?:is|are|es|son|significa|means)\b|\b(?:definition|definicion|meaning|significado|how to|how do i|como hago|como se hace|tips|consejos|advice|step by step|paso a paso|best practices|buenas practicas)\b/u;
// Generic lowercase aliases ('waste', 'pest control', 'sitio web') name a project only
// alongside a project noun or owner reference ('waste recycling' is not Huracorp).
const projectNoun = /\b(?:projects?|proyectos?|software|system|sistema|app|aplicacion|platform|plataforma)\b/u;
function topicScope(data, shape, query, message) {
  const owner = ownerReference.test(query) || /(?:^|[^\p{L}])él(?:[^\p{L}]|$)/iu.test(message.normalize('NFC'));
  const project = data.projects.some(p => [p.name, p.displayName, p.id, ...(aliases[p.id] ?? []).filter(a => /\p{Lu}/u.test(a))]
    .some(name => contains(query, name))) || (/\bprojectentity\b/u.test(shape) && (owner || projectNoun.test(query)));
  const named = owner || project;
  if (definition.test(query) && !named) return 'clarify';
  return named || cvReference.test(query) || (/\btechentity\b/u.test(shape) && profileSignal.test(query)) ? 'allow' : 'clarify';
}

const briefQuestion = /^(?:yes|si|continue|continua|cuentame mas|tell me more|how does it work|como funciona)$/u;
export function resolveContext(knowledge, locale, message, history = []) {
  const lang = locale === 'es' ? 'es' : 'en';
  const data = knowledge[lang];
  const query = normalize(message);
  const { decision, open } = statelessScope(knowledge, lang, message);
  if (!briefQuestion.test(query)) return { decision, message, open };
  const window = Array.isArray(history) ? history.slice(-6) : [];
  for (let i = window.length - 1; i >= 0; i--) {
    const turn = window[i];
    if (turn?.role !== 'user' || typeof turn.content !== 'string') continue;
    const base = resolveContext(knowledge, lang, turn.content, window.slice(0, i));
    if (base.decision !== 'allow') return { decision: 'clarify', message };
    const named = data.projects.filter(p => projectNames(p).some(name => contains(normalize(base.message), name)));
    if (named.length !== 1) return { decision: 'clarify', message, choices: true };
    // Unsupported named features are a barrier, even if their intent was in scope.
    if (localReply(knowledge, lang, base.message).text === chatbotCopy[lang].unknown) {
      return { decision: 'clarify', message };
    }
    const project = named[0];
    return { decision: 'allow', message: `${project.name} features`, project, expansion: true };
  }
  return { decision: 'clarify', message };
}

export function resolveScope(knowledge, locale, message, history = []) {
  return resolveContext(knowledge, locale, message, history).decision;
}

// Returns { decision, open }: open marks questions admitted only by the topic gate.
function statelessScope(knowledge, locale, message) {
  const decision = boundedScope(knowledge, locale, message);
  return typeof decision === 'string' ? { decision, open: false } : decision;
}

function boundedScope(knowledge, locale, message) {
  const data = knowledge[locale === 'es' ? 'es' : 'en'];
  const query = normalize(message);
  if (achievementQuestion(data, query) || cvQuestion(query) || projectProblemQuestion(data, query)
    || /^(?:(?:what|which|cual|que) (?:is|are|es|son) (?:your |his |su |tu )?)?(?:expected )?(?:salary|sueldo|salario)(?: (?:esperado|expectations?|expectativas?|pretendido))?$/u.test(query)) return 'allow';
  const output = publishedOutputQuestion(data, query);
  if (output) return output.feature ? 'allow' : 'clarify';
  if (unrelated.test(query) || /\d\s*[+*=/%]\s*\d/u.test(message)
    || /\b(?:change|switch|cambia|cambiar)(?:\s+\w+){0,3}\s+(?:role|rol)\b|\b(?:act as|pretend|forget|olvida)\b/u.test(query)
    || generatedWork.test(query) || otherPeople.test(query)) return 'reject';
  if (/\b(projectentity|techentity|profileentity)\b/u.test(query)) return 'clarify';
  if (greeting.test(query)) return 'clarify'; // Local greeting, never a provider start.
  if (commonPortfolioTopic(query)) return 'allow';
  let shape = ` ${query} `;
  const entities = [
    ...data.projects.flatMap((p, index) => projectNames(p).map(name => [name, `projectentity${index}`])),
    ...[...data.stack, ...data.projects.flatMap(p => p.stack)].flatMap(name =>
      [[name, 'techentity'], [technologyName(name), 'techentity']]),
    ...[data.name, 'Jean Pierre', 'profile', 'perfil', 'portfolio', 'portafolio'].map(name => [name, 'profileentity']),
  ].sort((a, b) => normalize(b[0]).length - normalize(a[0]).length);
  for (const [name, kind] of entities) {
    shape = shape.split(` ${normalize(name)} `).join(` ${kind} `);
  }
  // Several names of the SAME project ('Centro Carnes traceability') are one
  // reference; names of different projects stay separate and clarify.
  shape = shape.replace(/\bprojectentity(\d+)(?: projectentity\1)+\b/gu, 'projectentity$1')
    .replace(/\bprojectentity\d+\b/gu, 'projectentity').trim();
  const topic = '(?:projects?|proyectos?|tech|skills|habilidades|capabilities|capacidades|experience|experiencia|background|about|contact|contacto|email|correo|name|nombre)';
  const entity = `(?:projectentity|techentity|profileentity|${topic}|${commercial})`;
  const detail = `(?:techentity|${featureTerms.join('|')}|${commercial})`;
  const prefix = '(?:(?:tell me about|show me|describe|explain|list|cuentame sobre|dime sobre|hablame (?:de|del|sobre)|describe|explica|muestra|listar) )?';
  const facet = '(?:problems?|problemas?|solution|solucion|impact|impacto|purpose|proposito)';
  // Definitions of a technology are not portfolio usage. Single-name shorthand
  // and explicit usage forms below retain their published local interpretation.
  if (/^(?:what is|que es) (?:the |el |la )?techentity$/u.test(shape)) return 'clarify';
  const patterns = [
    `${prefix}${entity}(?: ${detail}){0,6}`,
    `(?:what|which) (?:is|are) (?:the )?${entity}(?: (?:listed|published))?`,
    `(?:what|which) ${topic} (?:are|is) (?:listed|published)`,
    `(?:who is|quien es) profileentity`,
    `(?:what|which|que|cual|cuales) (?:is|are|es|son) (?:your |his |su |tu |sus |tus )?(?:${topic}|${commercial})`,
    `(?:what|which|que|cual|cuales) (?:is|are|es|son) profileentity(?: s)? (?:${topic}|${commercial})`,
    `${prefix}profileentity(?: s)? (?:${topic}|${commercial})`,
    `(?:what is|que es) (?:the |el |la )?(?:projectentity|profileentity)`,
    `${prefix}(?:(?:the|el|la|del|de) )?(?:(?:project|proyecto) (?:de |del )?)?projectentity(?: (?:project|proyecto))?(?: (?:and |y |e )?${detail}){0,6}`,
    `(?:what|which|que|cual) (?:is |are |es |son )?(?:the |el |la )?${facet} (?:does |do |of |for |de |del |tiene )?(?:the |el |la )?(?:project |proyecto )?projectentity(?: (?:project|proyecto))?(?: (?:have|has))?`,
    `(?:how|como) (?:is |does |do )?(?:projectentity|techentity) (?:use|uses|used|usa|utiliza)(?: (?:the |el |la )?(?:projectentity|techentity))?`,
    `(?:como) (?:usa|utiliza) techentity(?: (?:el |la )?projectentity)?`,
    `(?:does|do) projectentity (?:use|have) ${detail}(?: ${detail}){0,3}`,
    `(?:how|como) (?:does )?projectentity (?:work|works|funciona)`,
    `(?:how|como) (?:does )?projectentity (?:handle|handles|implement|implements|manage|gestiona|implementa) ${detail}(?: ${detail}){0,5}`,
    `(?:what|que|cuales) ${detail}(?: ${detail}){0,3} (?:does |has |tiene |usa )?projectentity(?: (?:use|have))?`,
    `${detail}(?: ${detail}){0,3} (?:of|in|for|de|del|en) (?:the |el |la )?projectentity`,
    `(?:how can i|how to|como puedo|como) (?:contact|contactar) (?:profileentity|you)`,
    `(?:years|anos) (?:of|de) (?:experience|experiencia)`,
    `(?:how many|cuantos) (?:years|anos) (?:of|de) (?:experience|experiencia)(?: (?:do you have|does profileentity have|tienes|tiene))?`,
  ];
  if (patterns.some(pattern => new RegExp(`^(?:${pattern})$`, 'u').test(shape))) return 'allow';
  const topical = topicScope(data, shape, query, message);
  return topical === 'allow' ? { decision: 'allow', open: true } : topical;
}

// Deliberately bounded keyword routing, not semantic understanding. Always offline.
export function localReply(knowledge, locale, message, history = []) {
  const lang = locale === 'es' ? 'es' : 'en';
  const data = knowledge[lang];
  const context = resolveContext(knowledge, lang, message, history);
  const query = normalize(context.message);
  const words = new Set(query.split(' '));
  const links = (...ids) => data.links.filter(link => ids.includes(link.id)).map(link => ({ ...link }));
  const unknown = () => ({ text: chatbotCopy[lang].unknown, links: links('contact', 'email') });
  const decision = context.decision;
  if (decision !== 'allow') return {
    text: context.choices ? chatbotCopy[lang].contextChoices
      : greeting.test(query) ? chatbotCopy[lang].scopeHello
      : chatbotCopy[lang][decision === 'reject' ? 'scopeReject' : 'scopeClarify'],
    links: links('projects', 'tech', 'contact'),
  };
  const summary = (project, text = project.description) =>
    `${project.name}: ${text}\n${project.status}. ${project.qualification}`;
  if (context.expansion) return {
    text: summary(context.project, context.project.features.join('\n')), links: links('projects'),
  };
  const cv = data.cv;
  const roleLines = () => cv.roles.map(r => `${r.title} — ${r.company} (${r.period})${r.clients ? `: ${r.clients.join(', ')}` : ''}`);
  switch (cv ? cvQuestion(query) : null) {
    case 'download': return { text: `${chatbotCopy[lang].cvDownload}\n${roleLines()[0]}`, links: links('cv-es', 'cv-en') };
    case 'roles': return { text: `${chatbotCopy[lang].cvRoles} (${cv.experience}):\n${roleLines().join('\n')}`, links: links('cv-es', 'cv-en') };
    case 'certifications': return {
      text: `${chatbotCopy[lang].cvCertifications}:\n${cv.certifications.map(c => `${c.issuer}${c.year ? ` (${c.year})` : ''}: ${c.detail}`).join('\n')}`,
      links: links('cv-es', 'cv-en'),
    };
    case 'languages': return { text: `${chatbotCopy[lang].cvLanguages}: ${cv.languages.join(', ')}`, links: links('cv-es', 'cv-en') };
  }
  const achievement = achievementQuestion(data, query);
  if (achievement) {
    if (achievement.unknown) return unknown();
    const copy = chatbotCopy[lang];
    return { text: `${achievement.achievement.id === 'startup-peru-2025' ? copy.achievementAward : copy.achievementTransition}\n${copy.achievementQualification}${achievement.details ? `\n${copy.unknown}` : ''}`,
      links: links('projects', 'contact') };
  }
  // Unknown commercial/private claims win over project, technology and contact keywords.
  // Years of experience is published profile copy, unlike pay, employers or availability.
  if (/\b(?:years|anos) (?:of |de )?(?:experience|experiencia)\b/u.test(query)
    && !/\b(?:salary|rates|price|salario|tarifas|precio|availability|disponibilidad)\b/u.test(query)) {
    return { text: `${data.name} · ${data.role}\n${data.experience}`, links: links('projects', 'contact') };
  }
  if (new RegExp(`\\b(?:${commercial})\\b`, 'u').test(query.replace(/\bqueued jobs\b/gu, 'queued tasks'))) return unknown();
  const output = publishedOutputQuestion(data, query);
  if (output?.feature) return { text: summary(output.project, output.feature), links: links('projects') };
  const technologies = [...new Set([...data.stack, ...data.projects.flatMap(p => p.stack)].map(technologyName))]
    .filter(tech => contains(query, tech));
  const project = data.projects.find(p => projectNames(p).some(name => contains(query, name)));
  // Open topic questions (fit, strengths, what makes a project interesting) have no
  // bounded local intent: answer with the named project's narrative or the profile.
  if (context.open) {
    const named = data.projects.filter(p => projectNames(p).some(name => contains(query, name)));
    if (named.length === 1) return {
      text: summary(named[0], [named[0].description, named[0].problem, named[0].solution, named[0].impact].join('\n')),
      links: links('projects'),
    };
    const lines = [`${data.name} · ${data.role}`, data.experience, ...(cv ? roleLines() : [])];
    for (const tech of technologies) {
      const using = data.projects.filter(p => p.stack.some(item => technologyName(item) === tech)).map(p => p.name);
      if (using.length) lines.push(`${chatbotCopy[lang].techProjects} ${tech}: ${using.join(', ')}`);
    }
    if (named.length > 1) lines.push('', ...named.map(p => summary(p)));
    return { text: lines.join('\n'), links: links('projects', 'cv-es', 'cv-en', 'contact') };
  }
  if (project) {
    // A public profile skill cannot establish that this particular project uses it.
    if (technologies.some(tech => !project.stack.some(item => technologyName(item) === tech)
      && !project.features.some(text => contains(normalize(text), tech)))) return unknown();
    if (/\b(stack|technologies|tecnologias)\b/u.test(query)) return {
      text: summary(project, project.stack.join(', ')), links: links('projects'),
    };
    const facets = Object.keys(facetTerms).filter(id => facetTerms[id].test(query));
    if (facets.length) return { text: summary(project, facets.map(id => project[id]).join('\n')), links: links('projects') };
    const feature = relevantFeature(project, query);
    // "Tell me about the X project" is a project summary: published narrative fields.
    if (!feature.detail && /\b(?:project|proyecto)\b/u.test(query)) return {
      text: summary(project, [project.description, project.problem, project.solution, project.impact].join('\n')),
      links: links('projects'),
    };
    if (feature.detail && !feature.text && !technologies.length) return unknown();
    return { text: summary(project, feature.text ?? project.description), links: links('projects') };
  }
  if (technologies.length) {
    const tech = technologies[0];
    const examples = data.projects.filter(p => p.stack.some(item => technologyName(item) === tech)
      || p.features.some(text => contains(normalize(text), tech))).slice(0, 2);
    if (examples.length) return {
      text: examples.map(p => summary(p, ['Laravel', 'Python', 'React', 'Next.js'].includes(tech)
        ? p.description : relevantFeature(p, normalize(tech)).text ?? p.description)).join('\n\n'),
      links: links('projects'),
    };
    const group = capabilityGroups.findIndex(items => items.includes(tech));
    return {
      text: `${tech}: ${data.capabilities[group]}\n${lang === 'es'
        ? 'El portafolio lo incluye entre las tecnologías habituales, pero no indica un proyecto concreto que lo utilice.'
        : 'The portfolio lists it in the usual stack but does not name a project that uses it.'}`,
      links: links('tech'),
    };
  }
  const topic = commonPortfolioTopic(query)
    ?? Object.keys(keywords).find(id => keywords[id].some(word => words.has(word)))
    ?? (contains(query, 'Jean Pierre') || /\b(background|name|nombre|profile|portfolio|portafolio)\b/u.test(query) ? 'experience' : null);
  switch (topic) {
    case 'languages': return {
      text: `${lang === 'es' ? 'Lenguajes de programación publicados' : 'Published programming languages'}: ${data.stack
        .filter(item => ['JavaScript', 'TypeScript', 'PHP', 'Python'].includes(technologyName(item))).join(', ')}`,
      links: links('tech'),
    };
    case 'projects': return {
      text: ['crm-consultores', 'maia-website', 'course-notes'].map(id => summary(data.projects.find(p => p.id === id))).join('\n\n'),
      links: links('projects'),
    };
    case 'tech': return {
      text: capabilityGroups.map((_, index) => `${capabilityGroups[index].filter(tech => data.stack.includes(tech)).join(', ')}: ${data.capabilities[index]}`).join('\n\n'),
      links: links('tech'),
    };
    case 'experience': return {
      text: [`${data.name} · ${data.role}`, data.experience, ...(data.cv ? roleLines() : []), data.about].join('\n'),
      links: links('projects', 'contact'),
    };
    case 'contact': return { text: `${data.contact}\n${data.email}`, links: links('contact', 'email') };
    default: return unknown();
  }
}
