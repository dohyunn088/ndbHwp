const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const patchesDir = path.join(rootDir, 'patches');
const submoduleDir = path.join(rootDir, 'third_party', 'rhwp');

const patchMappings = [
  {
    src: 'border_rendering.rs',
    dest: path.join(submoduleDir, 'src', 'renderer', 'layout', 'border_rendering.rs')
  },
  {
    src: 'table_layout.rs',
    dest: path.join(submoduleDir, 'src', 'renderer', 'layout', 'table_layout.rs')
  },
  {
    src: 'input-handler-text.ts',
    dest: path.join(submoduleDir, 'rhwp-studio', 'src', 'engine', 'input-handler-text.ts')
  }
];

console.log('[apply-patches] Applying local patches to rhwp submodule...');

for (const mapping of patchMappings) {
  const patchSrcPath = path.join(patchesDir, mapping.src);
  if (fs.existsSync(patchSrcPath)) {
    // Ensure destination directory exists (though it should)
    const destDir = path.dirname(mapping.dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    // Copy the file
    fs.copyFileSync(patchSrcPath, mapping.dest);
    console.log(`[apply-patches] Patched: ${mapping.src} -> ${path.relative(rootDir, mapping.dest)}`);
  } else {
    console.error(`[apply-patches] Patch source not found: ${patchSrcPath}`);
  }
}

console.log('[apply-patches] All patches applied successfully.');
