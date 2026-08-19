import fs from 'fs';
import path from 'path';

const appContent = fs.readFileSync('src/App.tsx', 'utf8');
const lines = appContent.split('\n');
const pageImports = [];

lines.forEach(line => {
  const match = line.match(/import\s+([A-Za-z0-9_]+)\s+from\s+["'](\.\/pages\/[^"']+)["'];/);
  if (match) {
    pageImports.push({ name: match[1], path: match[2] });
  }
});

const compFiles = fs.readdirSync('src/components');
const exportMap = {};
compFiles.forEach(f => {
  if (!f.endsWith('.tsx') && !f.endsWith('.ts')) return;
  const content = fs.readFileSync(path.join('src/components', f), 'utf8');
  const match = content.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
  if (match) {
    exportMap[match[1]] = f;
  }
});

pageImports.forEach(imp => {
  const relPath = imp.path.replace('./pages/', '');
  const fullPath = path.join('src/pages', relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const compFile = exportMap[imp.name];
  if (compFile) {
    const depth = relPath.split('/').length - 1;
    const prefix = depth > 0 ? '../'.repeat(depth) + '../components/' : '../components/';
    const content = 'export { default } from "' + prefix + compFile.replace(/\.tsx?$/, '') + '";\n';
    fs.writeFileSync(fullPath, content);
    console.log('Re-exported:', imp.name, '->', compFile, 'at', fullPath);
  } else {
    const title = imp.name.replace(/Page$/, '').replace(/([A-Z])/g, ' $1').trim();
    const content = `import React from "react";

export default function ${imp.name}() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">${title}</h1>
      </div>
      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-muted-foreground">Welcome to ${title}.</p>
      </div>
    </div>
  );
}
`;
    fs.writeFileSync(fullPath, content);
    console.log('Created page:', imp.name, 'at', fullPath);
  }
});

console.log('All page files generated successfully!');
