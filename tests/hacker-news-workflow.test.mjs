import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import yaml from 'js-yaml';

const workflow = await readFile(new URL('../.github/workflows/update-hacker-news.yml', import.meta.url), 'utf8');
const guide = await readFile(new URL('../docs/hacker-news-automation.md', import.meta.url), 'utf8');
const hookScript = workflow.match(/<<'NODE'\n([\s\S]+?)\n          NODE/)[1].replace(/^          /gm, '');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

// Execute only the extracted hook JavaScript with mocked capabilities: no network.
async function runHook(hook, outcome = 'ok') {
  const requests = [], logs = [];
  const process = { env: { VERCEL_DEPLOY_HOOK: hook }, exitCode: 0 };
  await new AsyncFunction('process', 'fetch', 'console', 'URL', 'AbortSignal', hookScript)(
    process,
    async (url, options) => {
      requests.push({ url: String(url), options });
      if (outcome === 'throw') throw Error(`secret ${url}`);
      return { ok: outcome === 'ok' };
    },
    { log: message => logs.push(message), error: message => logs.push(message) },
    URL, { timeout: ms => ({ timeout: ms }) },
  );
  return { requests, logs, exitCode: process.exitCode };
}

test('workflow has daily/manual default-branch scope and bounded least privilege', () => {
  const triggers = workflow.split('\npermissions:')[0];
  assert.match(triggers, /cron: '37 8 \* \* \*'/);
  assert.match(triggers, /workflow_dispatch:/);
  assert.doesNotMatch(triggers, /pull_request|push:/);
  assert.match(workflow, /permissions:\n  contents: read/);
  assert.match(workflow, /permissions:\n      contents: write/);
  assert.match(workflow, /timeout-minutes: 10/);
  assert.match(workflow, /group: hacker-news-refresh\n  cancel-in-progress: false/);
  assert.equal(yaml.load(workflow).jobs.refresh.if,
    "github.ref == format('refs/heads/{0}', github.event.repository.default_branch)");
  assert.match(workflow, /ref: \$\{\{ github.event.repository.default_branch \}\}/);
  assert.match(workflow, /DEFAULT_BRANCH: \$\{\{ github.event.repository.default_branch \}\}/);
  assert.doesNotMatch(workflow, /\bmaster\b|\bmain\b/);
  assert.deepEqual([...workflow.matchAll(/uses: (\S+)/g)].map(match => match[1]), [
    'actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
    'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020',
  ]);
  assert.match(workflow, /node-version: '22'/);
  const steps = yaml.load(workflow).jobs.refresh.steps;
  const runs = steps.map(step => step.run);
  const install = runs.indexOf('npm ci --ignore-scripts --no-audit --no-fund');
  const tests = runs.indexOf('node --test tests/hacker-news.test.mjs tests/news-sources.test.mjs tests/editorial-blog.test.mjs tests/hacker-news-workflow.test.mjs');
  const updater = runs.indexOf('node scripts/update-hacker-news.mjs');
  assert.ok(install >= 0, 'Locked dependencies must install without scripts or runtime audits');
  assert.ok(install < tests && tests < updater, 'Install must precede all four tests and refresh');
  assert.equal(runs.filter(run => /\bnpm\b/.test(run || '')).length, 1);
  assert.equal(yaml.load(workflow).name, 'Update editorial reading');
  assert.ok(guide.includes('**Update editorial reading → Run workflow**'));
  assert.ok(guide.includes('disable **Update editorial reading**'));
});

test('guide describes bounded recent topic discovery, presentation and failure semantics', () => {
  for (const phrase of [
    'search_by_date', 'classifier version 2',
    'AI Engineering, Software Architecture, Web Development, Automation Integrations, Cloud DevOps, Security',
    'rolling seven-day', 'submission time, not verified publisher publication time',
    'ALL eligible articles found', 'without truncation', 'zero articles', '25 queries', 'two pages', '100 hits', '5,000',
    '50 logical requests', '150 requests', 'not exhaustive', 'updatedAt',
    'not displayed', 'expired and future', 'even when a refresh fails',
    'No source or category quotas or filler', 'originality', 'Show HN:', 'Ask HN:',
    'publisher URLs', 'last good snapshot', 'Schema version 4', 'Schema version 3 is a historical contract only', 'without `maxArticles`', 'dateKind', 'eventAt',
    'dateKind: submitted', 'dateKind: published',
    'published_at', 'canonical_url', 'nine tags', '100 articles', 'RSS2', 'pubDate',
    'Every request includes `top=7`', 'provider-native weekly popularity for DEV only',
    '12 links per page', 'display size only, never a dataset cap', 'full topic counts',
    'huge positive requests safely clamp', 'mixed feed remains globally newest-first',
    'DTD', 'ENTITY', 'depth 24', '500 items', '65,536', '1 MiB', '1,000',
    'tracking parameters', 'comparison only', 'namespaced', 'pure offline',
    'All enabled sources', 'new tab', 'same-tab', 'authored',
    'npm ci --ignore-scripts --no-audit --no-fund', 'fast-xml-parser',
    '37 dependency vulnerabilities', 'existing dependency baseline', 'separate audit follow-up',
    'https://developers.forem.com/api', 'https://feed.infoq.com/architecture/',
    'https://feed.infoq.com/ai-development/', 'https://feed.infoq.com/ai-architecture/',
    'https://github.com/NaturalIntelligence/fast-xml-parser',
  ]) assert.ok(guide.includes(phrase), `Guide missing: ${phrase}`);
  assert.doesNotMatch(guide, /exactly ten|ranked stories|official HN API|article's publication time|confirm ten links and the new refresh timestamp|no dependency installation|24 queries|Schema version 2 uses/);
  assert.match(guide, /08:37 UTC daily/);
  assert.match(guide, /contents: read/);
  assert.match(guide, /contents: write/);
});

test('publication stages only JSON and fails on branch races without force or unsafe interpolation', () => {
  assert.deepEqual(workflow.match(/^\s+git add .+$/gm).map(line => line.trim()), ['git add -- src/data/hacker-news.json']);
  assert.match(workflow, /user.name='github-actions\[bot\]'/);
  assert.match(workflow, /41898282\+github-actions\[bot\]@users.noreply.github.com/);
  assert.equal((workflow.match(/if \[ "\$base_tip" != "\$remote_tip" \]/g) || []).length, 2);
  assert.match(workflow, /git push origin "HEAD:refs\/heads\/\$DEFAULT_BRANCH"/);
  assert.doesNotMatch(workflow, /--force|git (reset|rebase)|--author/);
  for (const script of workflow.matchAll(/        run: \|\n([\s\S]*?)(?=\n      -|$)/g)) {
    assert.doesNotMatch(script[1], /\$\{\{/);
  }
  assert.match(workflow, /if: steps.publish.outputs.pushed == 'true'/);
});

test('optional hook missing/invalid URLs never request or leak the secret', async () => {
  const missing = await runHook(undefined);
  assert.equal(missing.requests.length, 0);
  assert.match(missing.logs[0], /integration only.*not guaranteed/);
  for (const hook of [
    'http://api.vercel.com/v1/integrations/deploy/project/secret',
    'https://api.vercel.com.evil.test/v1/integrations/deploy/project/secret',
    'https://user:secret@api.vercel.com/v1/integrations/deploy/project/secret',
    'https://api.vercel.com:444/v1/integrations/deploy/project/secret',
    'https://api.vercel.com/wrong/secret',
    'https://api.vercel.com/v1/integrations/deploy/project/secret?token=secret',
    'not a URL secret',
  ]) {
    const result = await runHook(hook);
    assert.equal(result.requests.length, 0);
    assert.equal(result.exitCode, 1);
    assert.ok(result.logs.every(log => !log.includes(hook) && !log.includes('secret')));
  }
});

test('hook sends one bounded no-redirect POST; failures have generic logs and no retries', async () => {
  const hook = 'https://api.vercel.com/v1/integrations/deploy/project/private-token';
  for (const outcome of ['ok', 'bad-status', 'throw']) {
    const result = await runHook(hook, outcome);
    assert.equal(result.requests.length, 1);
    assert.deepEqual(result.requests[0], { url: hook, options: {
      method: 'POST', redirect: 'error', signal: { timeout: 30000 },
    } });
    assert.equal(result.exitCode, outcome === 'ok' ? 0 : 1);
    assert.ok(result.logs.every(log => !log.includes(hook) && !log.includes('private-token')));
  }
});
