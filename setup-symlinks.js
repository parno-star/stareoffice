import fs from 'fs';
import path from 'path';

const srcLib = path.resolve('src/lib');
const srcComp = path.resolve('src/components');

function ensureSymlink(targetDir, linkPath) {
  try {
    if (fs.existsSync(linkPath) || fs.lstatSync(linkPath)) {
      return;
    }
  } catch (e) {}
  const dir = path.dirname(linkPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const relTarget = path.relative(dir, targetDir);
  fs.symlinkSync(relTarget, linkPath, 'dir');
  console.log(`Symlinked: ${linkPath} -> ${relTarget}`);
}

function processDir(dir) {
  const items = fs.readdirSync(dir);
  
  // Ensure _lib and _components in current dir
  ensureSymlink(srcLib, path.join(dir, '_lib'));
  ensureSymlink(srcComp, path.join(dir, '_components'));

  for (const item of items) {
    if (item.startsWith('_') || item === 'node_modules') continue;
    const full = path.join(dir, item);
    const stat = fs.lstatSync(full);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) {
      processDir(full);
    }
  }
}

processDir('src/pages');
processDir('src/components');

console.log('Symlinks created for all pages and components subdirectories.');
