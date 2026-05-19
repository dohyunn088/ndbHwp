import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const expectedRhwpVersion = '0.7.11';
const expectedRhwpCommit = 'a9dcdee32b17a7f9a20c609a5ed547e62fb8ebae';

test('HOP keeps the rhwp renderer baseline aligned across submodule, WASM package, and native lockfile', async () => {
  const studioPackage = JSON.parse(
    await readFile(join(repoRoot, 'apps/studio-host/package.json'), 'utf8'),
  );
  assert.equal(studioPackage.dependencies['@rhwp/core'], expectedRhwpVersion);

  const pnpmLock = await readFile(join(repoRoot, 'pnpm-lock.yaml'), 'utf8');
  assert.match(pnpmLock, new RegExp(`@rhwp/core@${escapeRegExp(expectedRhwpVersion)}`));

  const cargoLock = await readFile(join(repoRoot, 'apps/desktop/src-tauri/Cargo.lock'), 'utf8');
  assert.match(
    cargoLock,
    new RegExp(`name = "rhwp"\\r?\\nversion = "${escapeRegExp(expectedRhwpVersion)}"`),
  );

  const upstreamDoc = await readFile(join(repoRoot, 'docs/architecture/UPSTREAM.md'), 'utf8');
  assert.match(upstreamDoc, new RegExp(escapeRegExp(expectedRhwpCommit)));
  assert.match(upstreamDoc, new RegExp(escapeRegExp(`v${expectedRhwpVersion}`)));

  const submoduleStatus = git(['submodule', 'status', 'third_party/rhwp']).stdout.trim();
  assert.match(submoduleStatus, new RegExp(`^[ +-]?${expectedRhwpCommit} third_party/rhwp\\b`));
});

test('HOP preserves upstream lineseg validation and auto-reflow on document load', async () => {
  const mainSource = await readFile(join(repoRoot, 'apps/studio-host/src/main.ts'), 'utf8');

  assert.match(mainSource, /showValidationModalIfNeeded/);
  assert.match(mainSource, /currentSourceFormat/);
  assert.match(mainSource, /sourceFormat\s*===\s*['"]hwpx['"]/);
  assert.match(mainSource, /wasm\.getValidationWarnings\(\)/);
  assert.match(mainSource, /wasm\.reflowLinesegs\(\)/);
  assert.match(mainSource, /canvasView\?\.loadDocument\(\)/);

  const validationStart = mainSource.indexOf('if (sourceFormat ===');
  assert.notEqual(validationStart, -1, 'validation block should call getValidationWarnings');
  const validationEnd = mainSource.indexOf('} catch (error)', validationStart);
  assert.ok(validationEnd > validationStart, 'validation block should be wrapped in its own catch');

  const validationBlock = mainSource.slice(validationStart, validationEnd);
  assert.match(validationBlock, /const report = wasm\.getValidationWarnings\(\)/);
});

test('HOP product info keeps the upstream rhwp version and adds HOP version separately', async () => {
  const viteConfig = await readFile(join(repoRoot, 'apps/studio-host/vite.config.ts'), 'utf8');
  const aboutDialog = await readFile(join(repoRoot, 'apps/studio-host/src/ui/about-dialog.ts'), 'utf8');

  assert.match(viteConfig, /__APP_VERSION__:\s*JSON\.stringify\(rhwpCorePackage\.version\)/);
  assert.match(viteConfig, /__HOP_VERSION__:\s*JSON\.stringify\(desktopConfig\.version\)/);
  assert.match(aboutDialog, /extends UpstreamAboutDialog/);
  assert.match(aboutDialog, /super\.createBody\(\)/);
  assert.match(aboutDialog, /(HOP|ndbHwp) \$\{__HOP_VERSION__\}/);
});

test('HOP keeps PDF export menu-only without a stale Ctrl+E label', async () => {
  const fileCommands = await readFile(join(repoRoot, 'apps/studio-host/src/command/commands/file.ts'), 'utf8');
  const indexHtml = await readFile(join(repoRoot, 'apps/studio-host/index.html'), 'utf8');
  const pdfMenuItem = indexHtml.match(/<div class="md-item disabled" data-cmd="file:export-pdf">[\s\S]*?<\/div>/);

  assert.doesNotMatch(fileCommands, /id:\s*['"]file:export-pdf['"][\s\S]*?shortcutLabel:/);
  assert.ok(pdfMenuItem, 'PDF export menu item should exist');
  assert.doesNotMatch(pdfMenuItem[0], /md-shortcut|Ctrl\+E|Cmd\+E/);
});

function git(args) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
    },
  });
  assert.equal(
    result.status,
    0,
    `git ${args.join(' ')} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  return result;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
