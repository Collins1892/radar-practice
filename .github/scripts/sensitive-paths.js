import path from 'path';

const SENSITIVE_PATH_PREFIXES = ['.github/'];
const SENSITIVE_PATH_EXACT = new Set(['package.json']);
const SENSITIVE_PATH_SUFFIXES = ['.csproj', '.sln'];
const SENSITIVE_PATH_BASENAMES = new Set([
  'package-lock.json',
  'Dockerfile',
  '.npmrc',
  'tsconfig.json',
]);
const SENSITIVE_PATH_BASENAME_PREFIXES = ['.env'];
const MIGRATIONS_SEGMENT = '/Migrations/';
const HUSKY_SEGMENT = '/.husky/';

function normalizeRepoRelativePath(filePath, repoRoot) {
  if (repoRoot !== undefined && repoRoot !== null) {
    const rel = path.relative(repoRoot, path.resolve(repoRoot, filePath));
    return rel.split(path.sep).join('/');
  }
  return filePath.split(path.sep).join('/');
}

/**
 * Returns true when a path must not be auto-modified by agentic scripts.
 *
 * @param {string} filePath - Repo-relative path or absolute path when repoRoot is set
 * @param {string | null | undefined} [repoRoot] - Repository root for path resolution
 * @returns {boolean}
 */
function isSensitivePath(filePath, repoRoot) {
  const rel = normalizeRepoRelativePath(filePath, repoRoot);
  if (rel.startsWith('..')) {
    return true;
  }

  if (SENSITIVE_PATH_EXACT.has(rel)) {
    return true;
  }

  if (SENSITIVE_PATH_PREFIXES.some((prefix) => rel.startsWith(prefix))) {
    return true;
  }

  if (SENSITIVE_PATH_SUFFIXES.some((suffix) => rel.endsWith(suffix))) {
    return true;
  }

  if (rel.startsWith('Migrations/') || rel.includes(MIGRATIONS_SEGMENT)) {
    return true;
  }

  if (rel.startsWith('.husky/') || rel.includes(HUSKY_SEGMENT)) {
    return true;
  }

  const basename = path.basename(rel);
  if (SENSITIVE_PATH_BASENAMES.has(basename)) {
    return true;
  }

  if (
    SENSITIVE_PATH_BASENAME_PREFIXES.some((prefix) => basename.startsWith(prefix))
  ) {
    return true;
  }

  return false;
}

export { isSensitivePath };
