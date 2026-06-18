import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  backoffMs,
  extractFilePath,
  formatComment,
  getRetryWaitMs,
  groupActionableByFilePath,
  mergeAdvisory,
  parseChangedFilePaths,
  parseFindings,
  splitActionableFindings,
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

  it('preserves a structured filePath when present', () => {
    const raw = JSON.stringify([
      {
        severity: 'Major',
        description: 'issue',
        filePath: 'client/src/foo.ts',
      },
    ]);

    const result = parseFindings(raw);

    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].filePath, 'client/src/foo.ts');
  });

  it('sets filePath to null when absent', () => {
    const raw = JSON.stringify([{ severity: 'Minor', description: 'nit' }]);

    const result = parseFindings(raw);

    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].filePath, null);
  });

  it('coerces whitespace-only filePath to null', () => {
    const raw = JSON.stringify([
      { severity: 'Minor', description: 'nit', filePath: '   ' },
    ]);

    const result = parseFindings(raw);

    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].filePath, null);
  });

  it("coerces literal string 'null' filePath to null", () => {
    const raw = JSON.stringify([
      { severity: 'Minor', description: 'nit', filePath: 'null' },
    ]);

    const result = parseFindings(raw);

    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].filePath, null);
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

describe('extractFilePath', () => {
  it('extracts a backtick-quoted path', () => {
    assert.equal(
      extractFilePath('`client/src/api.ts` has a bug'),
      'client/src/api.ts',
    );
  });

  it('extracts an unquoted path', () => {
    assert.equal(
      extractFilePath('Issue in client/src/foo.ts line 10'),
      'client/src/foo.ts',
    );
  });

  it('returns null when no path is present', () => {
    assert.equal(extractFilePath('Missing null check'), null);
  });

  it('returns null and rejects a path containing ".." components', () => {
    assert.equal(extractFilePath('Path `src/../etc/passwd`'), null);
  });

  it('handles dot-prefixed paths at arbitrary depth', () => {
    assert.equal(
      extractFilePath('`.github/workflows/pr-review.yml`'),
      '.github/workflows/pr-review.yml',
    );
  });
});

const MULTI_FILE_DIFF = [
  'diff --git a/client/src/a.ts b/client/src/a.ts',
  '--- a/client/src/a.ts',
  '+++ b/client/src/a.ts',
  'diff --git a/client/src/b.ts b/client/src/b.ts',
  '--- a/client/src/b.ts',
  '+++ b/client/src/b.ts',
].join('\n');

describe('parseChangedFilePaths', () => {
  it('extracts paths from +++ b/ lines', () => {
    const paths = parseChangedFilePaths(MULTI_FILE_DIFF);

    assert.equal(paths.size, 2);
    assert.ok(paths.has('client/src/a.ts'));
    assert.ok(paths.has('client/src/b.ts'));
  });

  it('extracts paths from diff --git lines when +++ is absent', () => {
    const paths = parseChangedFilePaths('diff --git a/foo.ts b/foo.ts\n');

    assert.equal(paths.size, 1);
    assert.ok(paths.has('foo.ts'));
  });

  it('skips /dev/null for deleted files', () => {
    const diff = ['--- a/removed.ts', '+++ /dev/null'].join('\n');
    const paths = parseChangedFilePaths(diff);

    assert.equal(paths.size, 0);
    assert.equal(paths.has('/dev/null'), false);
  });

  it('deduplicates when diff --git and +++ b/ reference the same file', () => {
    const diff = [
      'diff --git a/client/src/foo.ts b/client/src/foo.ts',
      '+++ b/client/src/foo.ts',
    ].join('\n');
    const paths = parseChangedFilePaths(diff);

    assert.equal(paths.size, 1);
    assert.ok(paths.has('client/src/foo.ts'));
  });

  it('returns an empty Set for an empty diff', () => {
    const paths = parseChangedFilePaths('');

    assert.equal(paths.size, 0);
  });
});

describe('splitActionableFindings', () => {
  const changedFiles = new Set(['client/src/foo.ts', 'client/src/bar.ts']);

  it('sends Minor findings to advisory', () => {
    const finding = { severity: 'Minor', description: 'nit' };
    const { actionable, advisory } = splitActionableFindings(
      [finding],
      changedFiles,
    );

    assert.equal(actionable.length, 0);
    assert.deepEqual(advisory, [finding]);
  });

  it('sends actionable Blocker/Major findings with path in changedFiles to actionable', () => {
    const finding = {
      severity: 'Blocker',
      description: 'bug in `client/src/foo.ts`',
    };
    const { actionable, advisory } = splitActionableFindings(
      [finding],
      changedFiles,
    );

    assert.equal(advisory.length, 0);
    assert.equal(actionable.length, 1);
    assert.equal(actionable[0].filePath, 'client/src/foo.ts');
    assert.deepEqual(actionable[0].finding, finding);
  });

  it('demotes Blocker/Major when no path can be extracted', () => {
    const finding = { severity: 'Major', description: 'no file mentioned' };
    const { actionable, advisory } = splitActionableFindings(
      [finding],
      changedFiles,
    );

    assert.equal(actionable.length, 0);
    assert.deepEqual(advisory, [finding]);
  });

  it('demotes Blocker/Major when path is not in changedFiles', () => {
    const finding = {
      severity: 'Major',
      description: 'issue in `other/path.ts`',
    };
    const { actionable, advisory } = splitActionableFindings(
      [finding],
      changedFiles,
    );

    assert.equal(actionable.length, 0);
    assert.deepEqual(advisory, [finding]);
  });

  it('demotes Blocker/Major on sensitive paths under .github/', () => {
    const finding = {
      severity: 'Blocker',
      description: 'issue in `.github/workflows/ci.yml`',
    };
    const sensitiveChangedFiles = new Set(['.github/workflows/ci.yml']);
    const { actionable, advisory } = splitActionableFindings(
      [finding],
      sensitiveChangedFiles,
    );

    assert.equal(actionable.length, 0);
    assert.deepEqual(advisory, [finding]);
  });

  it('demotes Blocker/Major on sensitive paths such as .github/dependabot.yml', () => {
    const finding = {
      severity: 'Blocker',
      description: 'issue in `.github/dependabot.yml`',
    };
    const changedFiles = new Set(['.github/dependabot.yml']);
    const { actionable, advisory } = splitActionableFindings(
      [finding],
      changedFiles,
    );

    assert.equal(actionable.length, 0);
    assert.deepEqual(advisory, [finding]);
  });

  it('does not demote findings for client/package.json', () => {
    const finding = {
      severity: 'Major',
      description: 'bug in `client/package.json`',
    };
    const changedFiles = new Set(['client/package.json']);
    const { actionable, advisory } = splitActionableFindings(
      [finding],
      changedFiles,
    );

    assert.equal(advisory.length, 0);
    assert.equal(actionable.length, 1);
    assert.equal(actionable[0].filePath, 'client/package.json');
    assert.deepEqual(actionable[0].finding, finding);
  });

  it('uses a structured filePath directly without regex extraction', () => {
    const finding = {
      severity: 'Blocker',
      description: 'missing null check',
      filePath: 'client/src/foo.ts',
    };
    const { actionable, advisory } = splitActionableFindings(
      [finding],
      changedFiles,
    );

    assert.equal(actionable.length, 1);
    assert.equal(actionable[0].filePath, 'client/src/foo.ts');
    assert.equal(advisory.length, 0);
  });

  it('demotes Blocker/Major when structured filePath is not in changedFiles', () => {
    const finding = {
      severity: 'Blocker',
      description: 'missing null check',
      filePath: 'client/src/not-in-diff.ts',
    };
    const { actionable, advisory } = splitActionableFindings(
      [finding],
      changedFiles,
    );

    assert.equal(actionable.length, 0);
    assert.equal(advisory.length, 1);
    assert.deepEqual(advisory[0], finding);
  });

  it('prefers structured filePath over path in description', () => {
    const finding = {
      severity: 'Major',
      description: 'issue in `client/src/bar.ts`',
      filePath: 'client/src/foo.ts',
    };
    const { actionable, advisory } = splitActionableFindings(
      [finding],
      changedFiles,
    );

    assert.equal(actionable.length, 1);
    assert.equal(actionable[0].filePath, 'client/src/foo.ts');
    assert.equal(advisory.length, 0);
  });
});

describe('groupActionableByFilePath', () => {
  it('groups multiple findings by filePath into one array', () => {
    const actionable = [
      {
        finding: { severity: 'Blocker', description: 'first' },
        filePath: 'client/src/foo.ts',
      },
      {
        finding: { severity: 'Major', description: 'second' },
        filePath: 'client/src/foo.ts',
      },
    ];
    const groups = groupActionableByFilePath(actionable);

    assert.equal(groups.size, 1);
    assert.equal(groups.get('client/src/foo.ts').length, 2);
  });

  it('creates separate groups for different file paths', () => {
    const actionable = [
      {
        finding: { severity: 'Blocker', description: 'a' },
        filePath: 'client/src/foo.ts',
      },
      {
        finding: { severity: 'Major', description: 'b' },
        filePath: 'client/src/bar.ts',
      },
    ];
    const groups = groupActionableByFilePath(actionable);

    assert.equal(groups.size, 2);
    assert.equal(groups.get('client/src/foo.ts').length, 1);
    assert.equal(groups.get('client/src/bar.ts').length, 1);
  });

  it('preserves finding order within each file group', () => {
    const actionable = [
      {
        finding: { severity: 'Blocker', description: 'first on foo' },
        filePath: 'client/src/foo.ts',
      },
      {
        finding: { severity: 'Major', description: 'second on foo' },
        filePath: 'client/src/foo.ts',
      },
      {
        finding: { severity: 'Blocker', description: 'only on bar' },
        filePath: 'client/src/bar.ts',
      },
    ];
    const groups = groupActionableByFilePath(actionable);

    assert.deepEqual(
      groups.get('client/src/foo.ts').map((item) => item.finding.description),
      ['first on foo', 'second on foo'],
    );
    assert.deepEqual(
      groups.get('client/src/bar.ts').map((item) => item.finding.description),
      ['only on bar'],
    );
  });
});

describe('mergeAdvisory', () => {
  it('deduplicates findings by severity and description', () => {
    const finding = { severity: 'Major', description: 'dup' };
    const merged = mergeAdvisory([finding], [finding]);

    assert.equal(merged.length, 1);
    assert.deepEqual(merged[0], finding);
  });

  it('preserves existing accumulated findings when advisory is empty', () => {
    const accumulated = [{ severity: 'Minor', description: 'keep' }];
    const merged = mergeAdvisory(accumulated, []);

    assert.deepEqual(merged, accumulated);
  });

  it('appends new unique findings from advisory', () => {
    const advisory = [{ severity: 'Minor', description: 'new finding' }];
    const merged = mergeAdvisory([], advisory);

    assert.equal(merged.length, 1);
    assert.deepEqual(merged[0], advisory[0]);
  });
});
