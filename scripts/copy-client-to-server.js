#!/usr/bin/env node

import { readdir, stat, mkdir, copyFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceDir = join(__dirname, '..', 'client', 'dist');
const targetDir = join(__dirname, '..', 'server', 'public');

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function copyRecursive(src, dest) {
  const stats = await stat(src);
  
  if (stats.isDirectory()) {
    await ensureDir(dest);
    const entries = await readdir(src);
    
    for (const entry of entries) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);
      await copyRecursive(srcPath, destPath);
    }
  } else {
    await ensureDir(dirname(dest));
    await copyFile(src, dest);
  }
}

async function main() {
  try {
    console.log('Copying client build to server public directory...');
    
    // Check if source directory exists
    try {
      await stat(sourceDir);
    } catch (error) {
      console.log('Client dist directory not found, skipping copy.');
      return;
    }
    
    // Copy files
    await copyRecursive(sourceDir, targetDir);
    console.log('Successfully copied client build to server public directory.');
  } catch (error) {
    console.error('Error copying client build:', error.message);
    process.exit(1);
  }
}

main();