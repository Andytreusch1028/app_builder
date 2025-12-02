#!/usr/bin/env node
/**
 * Copy public files to dist/public after TypeScript compilation
 * This ensures HTML, CSS, and other static files are always up-to-date
 */

import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcPublic = join(__dirname, '..', 'src', 'public');
const distPublic = join(__dirname, '..', 'dist', 'public');

// Ensure dist/public directory exists
mkdirSync(distPublic, { recursive: true });

// Copy all files from src/public to dist/public
function copyDirectory(src, dest) {
  const entries = readdirSync(src);

  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);

    if (stat.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
      console.log(`✅ Copied: ${entry}`);
    }
  }
}

console.log('📦 Copying public files to dist/public...\n');
copyDirectory(srcPublic, distPublic);
console.log('\n✅ Public files copied successfully!');

