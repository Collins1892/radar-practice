import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { isSensitivePath } from './sensitive-paths.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');

describe('isSensitivePath', () => {
  it('blocks .github/ workflow paths', () => {
    assert.equal(isSensitivePath('.github/workflows/ci.yml'), true);
  });

  it('blocks root package.json only', () => {
    assert.equal(isSensitivePath('package.json'), true);
    assert.equal(isSensitivePath('client/package.json'), false);
  });

  it('blocks *.csproj and *.sln files', () => {
    assert.equal(isSensitivePath('ItemsApi/ItemsApi.csproj'), true);
    assert.equal(isSensitivePath('RadarPractice.sln'), true);
  });

  it('blocks EF Core migration files under Migrations/', () => {
    assert.equal(
      isSensitivePath('ItemsApi/Migrations/20260601041641_InitialCreate.cs'),
      true,
    );
  });

  it('blocks .env and .env.* files', () => {
    assert.equal(isSensitivePath('.env'), true);
    assert.equal(isSensitivePath('.env.local'), true);
  });

  it('blocks package-lock.json at any depth', () => {
    assert.equal(isSensitivePath('package-lock.json'), true);
    assert.equal(isSensitivePath('client/package-lock.json'), true);
  });

  it('blocks Dockerfile, .npmrc, and tsconfig.json by basename', () => {
    assert.equal(isSensitivePath('Dockerfile'), true);
    assert.equal(isSensitivePath('.npmrc'), true);
    assert.equal(isSensitivePath('client/tsconfig.json'), true);
  });

  it('does not block tsconfig variants or normal application code', () => {
    assert.equal(isSensitivePath('client/tsconfig.app.json'), false);
    assert.equal(isSensitivePath('client/tsconfig.node.json'), false);
    assert.equal(isSensitivePath('client/src/foo.ts'), false);
  });

  it('treats out-of-repo paths as sensitive when repoRoot is provided', () => {
    assert.equal(isSensitivePath('/etc/passwd', repoRoot), true);
  });
});
