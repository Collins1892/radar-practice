/**
 * Automated PR review script.
 *
 * Fetches a PR diff from GitHub, reviews it via the Anthropic API using the
 * code-reviewer skill, and posts findings as a PR comment.
 *
 * Local usage (from repo root):
 *   cp .env.example .env   # then fill in real values
 *   npm install
 *   node .github/scripts/pr-review.js
 *   # or: npm run pr-review
 */

import { config } from 'dotenv';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const USER_AGENT = 'radar-practice-pr-review';
const SEVERITIES = ['Blocker', 'Major', 'Minor'];
const TRANSIENT_STATUS_CODES = new Set([429, 529]);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const envPath = path.join(repoRoot, '.env');
const skillPath = path.join(repoRoot, '.claude/skills/code-reviewer/SKILL.md');

config({ path: envPath });

function log(message) {
  console.log(`[pr-review] ${message}`);
}

function fail(message) {
  console.error(`[pr-review] ERROR: ${message}`);
  process.exit(1);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    fail(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function parseRepository(repository) {
  const parts = repository.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    fail(
      `Invalid GITHUB_REPOSITORY "${repository}" — expected owner/repo format`,
    );
  }
  return { owner: parts[0], repo: parts[1] };
}

function parsePrNumber(raw) {
  const prNumber = Number.parseInt(raw, 10);
  if (Number.isNaN(prNumber) || prNumber <= 0) {
    fail(`Invalid PR_NUMBER "${raw}" — expected a positive integer`);
  }
  return prNumber;
}

async function fetchWithRetry(url, options, label) {
  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const response = await fetch(url, options);

    if (response.ok) {
      return response;
    }

    const body = await response.text();
    lastError = `${label} failed (${response.status}): ${body.slice(0, 500)}`;

    if (!TRANSIENT_STATUS_CODES.has(response.status) || attempt === 2) {
      fail(lastError);
    }

    log(`${label} returned ${response.status}; retrying in 2s...`);
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  }

  fail(lastError ?? `${label} failed`);
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'User-Agent': USER_AGENT,
  };
}

async function fetchPrDiff(owner, repo, prNumber, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
  log(`Fetching PR diff from ${url}`);

  const response = await fetchWithRetry(
    url,
    {
      headers: {
        ...githubHeaders(token),
        Accept: 'application/vnd.github.v3.diff',
      },
    },
    'GitHub diff fetch',
  );

  const diff = await response.text();
  const lineCount = diff === '' ? 0 : diff.split('\n').length;
  log(`Fetched diff (${diff.length} bytes, ${lineCount} lines)`);
  return diff;
}

async function readSkillContent() {
  log(`Reading code-reviewer skill from ${skillPath}`);
  const skillContent = await readFile(skillPath, 'utf8');
  log(`Loaded skill (${skillContent.length} characters)`);
  return skillContent;
}

function buildReviewPrompt(skillContent, diff) {
  return `${skillContent}

---

${diff}

---

Review the diff above using the code-reviewer skill. Return ONLY a JSON array of findings. Each item must have:
- severity: "Blocker" | "Major" | "Minor"
- description: string (include where/rule/issue/fix as appropriate)

No markdown fences, no prose outside the JSON array.`;
}

async function requestReview(skillContent, diff, apiKey) {
  log('Sending diff to Anthropic API for review...');

  const response = await fetchWithRetry(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: buildReviewPrompt(skillContent, diff),
          },
        ],
      }),
    },
    'Anthropic API request',
  );

  const data = await response.json();
  const text = data?.content?.[0]?.text;

  if (typeof text !== 'string' || text.trim() === '') {
    fail('Anthropic API response missing content[0].text');
  }

  log('Received review response from Anthropic API');
  return text;
}

function stripJsonWrappers(text) {
  let cleaned = text.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  return cleaned.trim();
}

function parseFindings(rawText) {
  log('Parsing findings from API response...');

  let parsed;
  try {
    parsed = JSON.parse(stripJsonWrappers(rawText));
  } catch {
    console.error('[pr-review] Raw API response text:');
    console.error(rawText);
    fail('Failed to parse findings JSON from API response');
  }

  if (!Array.isArray(parsed)) {
    fail('Findings JSON must be an array');
  }

  for (const [index, item] of parsed.entries()) {
    if (!item || typeof item !== 'object') {
      fail(`Finding at index ${index} is not an object`);
    }

    if (!SEVERITIES.includes(item.severity)) {
      fail(
        `Finding at index ${index} has invalid severity "${item.severity}"`,
      );
    }

    if (typeof item.description !== 'string' || item.description.trim() === '') {
      fail(`Finding at index ${index} has an empty description`);
    }
  }

  const counts = { Blocker: 0, Major: 0, Minor: 0 };
  for (const item of parsed) {
    counts[item.severity] += 1;
  }

  log(
    `Parsed ${parsed.length} finding(s): ${counts.Blocker} Blocker(s), ${counts.Major} Major(s), ${counts.Minor} Minor(s)`,
  );

  return parsed;
}

function formatSeveritySection(title, findings) {
  if (findings.length === 0) {
    return '';
  }

  const items = findings
    .map((finding, index) => `${index + 1}. ${finding.description}`)
    .join('\n');

  return `### ${title}\n${items}\n`;
}

function formatComment(findings) {
  if (findings.length === 0) {
    return `## Automated PR review

Reviewed against the code-reviewer skill. Findings are advisory only.

**Summary:** No findings — the diff looks clean from a code-reviewer perspective.

---
*Generated by \`.github/scripts/pr-review.js\`*`;
  }

  const blockers = findings.filter((f) => f.severity === 'Blocker');
  const majors = findings.filter((f) => f.severity === 'Major');
  const minors = findings.filter((f) => f.severity === 'Minor');

  const sections = [
    formatSeveritySection('Blockers', blockers),
    formatSeveritySection('Majors', majors),
    formatSeveritySection('Minors', minors),
  ].filter((section) => section !== '');

  return `## Automated PR review

Reviewed against the code-reviewer skill. Findings are advisory only.

**Summary:** ${findings.length} finding(s) — ${blockers.length} Blocker(s), ${majors.length} Major(s), ${minors.length} Minor(s)

${sections.join('\n')}
---
*Generated by \`.github/scripts/pr-review.js\`*`;
}

async function postPrComment(owner, repo, prNumber, token, body) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;
  log(`Posting review comment to ${url}`);

  const response = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: {
        ...githubHeaders(token),
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    },
    'GitHub comment post',
  );

  const data = await response.json();
  log(`Comment posted: ${data.html_url}`);
}

async function main() {
  log(`Loading .env from ${envPath}`);

  const apiKey = requireEnv('ANTHROPIC_API_KEY');
  const token = requireEnv('GITHUB_TOKEN');
  const prNumber = parsePrNumber(requireEnv('PR_NUMBER'));
  const { owner, repo } = parseRepository(requireEnv('GITHUB_REPOSITORY'));

  log(`Reviewing PR #${prNumber} on ${owner}/${repo}`);

  const diff = await fetchPrDiff(owner, repo, prNumber, token);
  const skillContent = await readSkillContent();
  const rawFindings = await requestReview(skillContent, diff, apiKey);
  const findings = parseFindings(rawFindings);
  const commentBody = formatComment(findings);

  await postPrComment(owner, repo, prNumber, token, commentBody);
  log('PR review complete');
}

main().catch((error) => {
  console.error('[pr-review] Unexpected error:', error);
  process.exit(1);
});
