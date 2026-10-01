#!/usr/bin/env node
// Renders assets/svg/*.svg to assets/generated/*.png (icon, adaptive icon, splash). Never fails the install.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'assets', 'generated');
fs.mkdirSync(OUT, { recursive: true });

try {
  const sharp = (await import('sharp')).default;
  for (const name of ['icon', 'adaptive-icon', 'splash']) {
    const svg = fs.readFileSync(path.join(ROOT, 'assets', 'svg', `${name}.svg`));
    await sharp(svg, { density: 300 }).resize(1024, 1024).png().toFile(path.join(OUT, `${name}.png`));
  }
  console.log('[build-assets] icons generated');
} catch (e) {
  console.warn('[build-assets] skipped:', e instanceof Error ? e.message : e);
}
