import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  backoffMs,
  formatComment,
  getRetryWaitMs,
  parseFindings,
  stripJsonWrappers,
} from './pr-review.js';

describe('stripJsonWrappers', () => {
  it('strips ```json ... ``` fences and returns clean JSON', () => {
    const wrapped = '```json\n[{"severity":"Minor","description":"test"}]\n```';
    const expected = '[{"severity":"Minor","description":"test"}]';
    assert.equal(stripJsonWrappers(wrapped), expected);
  });

  it('strips ``` ... ``` fences (no language tag) and returns clean JSON', () => {
    const wrapped = '```\n[{"severity":"Major","description":"issue"}]\n```';
    const expected = '[{"severity":"Major","description":"issue"}]';
    assert.equal(stripJsonWrappers(wrapped), expected);
  });

  it('returns the string unchanged when no fences are present', () => {
    const raw = '[{"severity":"Blocker","description":"bug"}]';
    assert.equal(stripJsonWrappers(raw), raw);
  });

  it('trims leading and trailing whitespace', () => {
    const raw = '  [{"severity":"Minor","description":"nit"}]  ';
    const expected = '[{"severity":"Minor","description":"nit"}]';
    assert.equal(stripJsonWrappers(raw), expected);
  });
});

describe('parseFindings', () => {
  it('parses a valid findings array with Blocker, Major, and Minor severities', () => {
    const raw = JSON.stringify([
      { severity: 'Blocker', description: 'blocker issue' },
      { severity: 'Major', description: 'major issue' },
      { severity: 'Minor', description: 'minor issue' },
    ]);

    const result = parseFindings(raw);

    assert.equal(result.findings.length, 3);
    assert.equal(result.skippedCount, 0);
    assert.deepEqual(
      result.findings.map((finding) => finding.severity),
      ['Blocker', 'Major', 'Minor'],
    );
  });

  it('filters findings with unrecognised severities', () => {
    const raw = JSON.stringify([
      { severity: 'Major', description: 'valid finding' },
      { severity: 'Suggestion', description: 'should be skipped' },
      { severity: 'Minor', description: 'another valid finding' },
    ]);

    const result = parseFindings(raw);

    assert.equal(result.findings.length, 2);
    assert.equal(result.skippedCount, 1);
    assert.deepEqual(
      result.findings.map((finding) => finding.severity),
      ['Major', 'Minor'],
    );
  });
});

const BOT_MARKER = '<!-- pr-review-bot -->';

describe('formatComment', () => {
  it('formats findings grouped by severity', () => {
    const findings = [
      { severity: 'Blocker', description: 'critical issue' },
      { severity: 'Major', description: 'important issue' },
      { severity: 'Minor', description: 'small issue' },
    ];

    const comment = formatComment(findings);

    assert.ok(comment.includes(BOT_MARKER));
    assert.ok(
      comment.includes(
        '**Summary:** 3 finding(s) — 1 Blocker(s), 1 Major(s), 1 Minor(s)',
      ),
    );
    assert.ok(comment.includes('### Blockers'));
    assert.ok(comment.includes('### Majors'));
    assert.ok(comment.includes('### Minors'));
  });

  it('includes a skipped count note when skippedCount > 0', () => {
    const findings = [{ severity: 'Minor', description: 'accepted finding' }];
    const comment = formatComment(findings, 2);

    assert.ok(
      comment.includes(
        '**Note:** 2 finding(s) were skipped due to unrecognised severity.',
      ),
    );
  });

  it('posts a no-findings comment when the array is empty', () => {
    const comment = formatComment([]);

    assert.ok(comment.includes(BOT_MARKER));
    assert.ok(comment.includes('No findings'));
  });
});

describe('getRetryWaitMs', () => {
  it('uses Retry-After header when present', () => {
    const response = {
      headers: {
        get(name) {
          return name === 'Retry-After' ? '5' : null;
        },
      },
    };

    const result = getRetryWaitMs(response, 1);

    assert.equal(result.waitMs, 5000);
    assert.equal(result.reason, 'Retry-After: 5s');
  });

  it('falls back to backoffMs when Retry-After is absent', () => {
    const response = {
      headers: {
        get() {
          return null;
        },
      },
    };

    const result = getRetryWaitMs(response, 1);

    assert.ok(result.waitMs >= 2000 && result.waitMs <= 3000);
    assert.equal(result.reason, 'exponential backoff with jitter');
  });
});

describe('backoffMs', () => {
  it('increases delay exponentially per attempt', () => {
    const attempt1 = backoffMs(1);
    const attempt2 = backoffMs(2);
    const attempt3 = backoffMs(3);

    assert.ok(attempt1 >= 2000 && attempt1 <= 3000);
    assert.ok(attempt2 >= 4000 && attempt2 <= 5000);
    assert.ok(attempt3 >= 8000 && attempt3 <= 9000);
  });
});
