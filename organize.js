import fs from 'fs';
import path from 'path';

// 1. Target directories
const dirs = [
  'src',
  'src/components',
  'src/components/ui',
  'src/components/providers',
  'src/hooks',
  'src/lib',
  'src/pages'
];

dirs.forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Sets of known special components
const uiComponentNames = new Set([
  'button.tsx', 'card.tsx', 'dialog.tsx', 'input.tsx', 'badge.tsx', 'avatar.tsx', 'tabs.tsx',
  'select.tsx', 'sheet.tsx', 'table.tsx', 'dropdown-menu.tsx', 'toast.tsx', 'toaster.tsx',
  'use-toast.ts', 'tooltip.tsx', 'separator.tsx', 'popover.tsx', 'form.tsx', 'label.tsx',
  'checkbox.tsx', 'switch.tsx', 'scroll-area.tsx', 'skeleton.tsx', 'accordion.tsx',
  'alert-dialog.tsx', 'alert.tsx', 'aspect-ratio.tsx', 'breadcrumb.tsx', 'calendar.tsx',
  'carousel.tsx', 'chart.tsx', 'collapsible.tsx', 'command.tsx', 'context-menu.tsx',
  'drawer.tsx', 'hover-card.tsx', 'input-otp.tsx', 'menubar.tsx', 'navigation-menu.tsx',
  'pagination.tsx', 'progress.tsx', 'radio-group.tsx', 'resizable.tsx', 'sidebar.tsx',
  'slider.tsx', 'sonner.tsx', 'spinner.tsx', 'textarea.tsx', 'toggle-group.tsx', 'toggle.tsx'
]);

const providerNames = new Set([
  'default.tsx', 'theme.tsx', 'tenant.tsx', 'query-client.tsx', 'convex.tsx', 'auth.tsx'
]);

const excludeRootFiles = new Set([
  'vite.config.ts', 'generate-pages.js', 'organize.js', 'package.json', 'package-lock.json',
  'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'index.html', 'tailwind.config.js',
  'postcss.config.js', 'components.json', 'metadata.json', 'README.md', '.env', '.env.example',
  'setup-symlinks.js'
]);

function safeMove(src, dest) {
  if (!fs.existsSync(src)) return;
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.renameSync(src, dest);
}

// 2. Process root items
const rootItems = fs.readdirSync('.');

rootItems.forEach(item => {
  if (excludeRootFiles.has(item) || item.startsWith('.') || item === 'node_modules' || item === 'src') {
    return;
  }

  const stat = fs.statSync(item);
  if (stat.isDirectory()) return;

  if (item === 'main.tsx' || item === 'App.tsx' || item === 'index.css' || item === 'vite-env.d.ts') {
    safeMove(item, path.join('src', item));
  } else if (uiComponentNames.has(item)) {
    safeMove(item, path.join('src/components/ui', item));
  } else if (providerNames.has(item)) {
    safeMove(item, path.join('src/components/providers', item));
  } else if (item.startsWith('use-') || item.startsWith('use') || item.startsWith('user')) {
    safeMove(item, path.join('src/hooks', item));
  } else if (item.endsWith('.ts')) {
    safeMove(item, path.join('src/lib', item));
  } else if (item.endsWith('.tsx')) {
    safeMove(item, path.join('src/components', item));
  }
});

// Copy hooks into src/lib so _lib/use-* imports work without breaking
if (fs.existsSync('src/hooks')) {
  fs.readdirSync('src/hooks').forEach(f => {
    const srcPath = path.join('src/hooks', f);
    const destPath = path.join('src/lib', f);
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Copy auth.tsx to providers if needed
if (fs.existsSync('src/components/auth.tsx') && !fs.existsSync('src/components/providers/auth.tsx')) {
  fs.copyFileSync('src/components/auth.tsx', 'src/components/providers/auth.tsx');
}

console.log('Root files successfully organized into src/');
