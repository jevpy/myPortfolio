// Only title, URL path and explicit publisher tags supply evidence. Never host/body.
export const CLASSIFIER_VERSION = 2;
export const CATEGORIES = Object.freeze(['AI Engineering', 'Software Architecture', 'Web Development', 'Automation Integrations', 'Cloud DevOps', 'Security']);
// Security wins overlapping evidence, then AI tooling and integrations; no quotas.
export const PRECEDENCE = Object.freeze(['Security', 'AI Engineering', 'Automation Integrations', 'Cloud DevOps', 'Software Architecture', 'Web Development']);
export const MAX_CATEGORY_TAGS = 5;
export const TAG_ALIASES = Object.freeze({
  ai: 'AI', machinelearning: 'AI', artificialintelligence: 'AI',
  architecture: 'Architecture', webdev: 'Web', javascript: 'Web', typescript: 'Web', react: 'Web',
  n8n: 'Integrations', automation: 'Integrations', integrations: 'Integrations', oauth: 'Integrations',
  devops: 'Cloud', cloud: 'Cloud', security: 'Security', agents: 'Agents', harnesses: 'Harnesses',
});
export const RULES = Object.freeze({
 'AI Engineering': /\b(?:AI|artificial intelligence|LLMs?|machine learning|neural networks?|ChatGPT|GPT[- ]?\d+|coding agents?|Claude (?:Code|Opus|Sonnet|Haiku))\b/i,
 'Software Architecture': /\b(?:software (?:architecture|engineering|design|testing)|distributed systems?|system design|design patterns?|microservices?|database (?:architecture|internals)|technical debt|code review)\b/i,
 'Web Development': /\b(?:web (?:development|developers?|applications?|components?)|JavaScript|TypeScript|Node\.js|WebAssembly|CSS|HTML|React (?:\d+|hooks?|components?|server)|Next\.js|frontend|front[- ]end)\b/i,
 'Automation Integrations': /\b(?:n8n|OAuth|webhooks?|API integrations?|workflow automation|integration (?:platform|patterns?|architecture)|automating workflows?)\b/i,
 'Cloud DevOps': /\b(?:Kubernetes|AWS|Azure|Google Cloud|Terraform|serverless|DevOps|CI\/CD|continuous integration|observability|cloud (?:infrastructure|native|deployment|computing))\b/i,
 'Security': /\b(?:cybersecurity|vulnerabilit(?:y|ies)|CVE[- ]\d+|malware|ransomware|cryptography|SQL injection|zero[- ]day|remote code execution|(?:software|application|network|Kubernetes|cloud|API|AI|LLM) security|security (?:patch|audit|flaw|research|engineering))\b/i,
});
export function classifyArticle(title, url = '', sourceTags = []) {
  if (typeof title !== 'string' || !Array.isArray(sourceTags)) return null;
  let path = '';
  try { path = decodeURIComponent(new URL(url).pathname).replace(/[-_/+.]/g, ' '); }
  catch { /* Invalid URLs add no evidence. */ }
  const text = `${title} ${path}`;
  const explicit = new Set(sourceTags.filter(tag => typeof tag === 'string')
    .map(tag => Object.hasOwn(TAG_ALIASES, tag.toLowerCase()) ? TAG_ALIASES[tag.toLowerCase()] : null).filter(Boolean));
  const evidence = {
    'AI Engineering': explicit.has('AI') || explicit.has('Agents') || explicit.has('Harnesses'),
    'Software Architecture': explicit.has('Architecture'),
    'Web Development': explicit.has('Web'),
    'Automation Integrations': explicit.has('Integrations'),
    'Cloud DevOps': explicit.has('Cloud'),
    Security: explicit.has('Security') || /\bsecurity\b/i.test(path),
  };
  const categories = PRECEDENCE.filter(category => RULES[category].test(text) || evidence[category]);
  if (/\b(?:games?|gaming|city[- ]building)\b/i.test(title) &&
      !/\b(?:game engine|rendering pipeline|vulnerability|coding agent)\b/i.test(text)) return null;
  if (!categories.length) return null;
  const ai = categories.includes('AI Engineering');
  const tags = [
    ai && 'AI',
    ai && (/\bharness(?:es)?\b/i.test(text) || explicit.has('Harnesses')) && 'Harnesses',
    ai && (/\b(?:agents?|agentic)\b/i.test(text) || explicit.has('Agents')) && 'Agents',
  ].filter(Boolean);
  return { primaryCategory: categories[0], categories: categories.slice(0, MAX_CATEGORY_TAGS), tags };
}
