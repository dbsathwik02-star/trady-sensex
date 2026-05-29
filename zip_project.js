import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const sourceDir = '.';
const tempDir = './sensex-trader-temp';

// Helper to copy directory recursively excluding node_modules, git, and zip outputs
const copyDirRecursive = (src, dest) => {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'sensex-trader-temp' || entry.name === 'sensex-trader.zip' || entry.name === 'zip_project.js') {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

try {
  // 1. Clean previous temp dir if left over
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  // 2. Copy files to temp dir
  console.log('Copying project files excluding node_modules...');
  copyDirRecursive(sourceDir, tempDir);

  // 3. Compress using PowerShell Compress-Archive
  console.log('Compressing files into sensex-trader.zip...');
  execSync('powershell -Command "Compress-Archive -Path sensex-trader-temp/* -DestinationPath sensex-trader.zip -Force"');

  // 4. Clean up temp dir
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('Project ZIP created successfully!');
} catch (err) {
  console.error('Failed to create ZIP:', err.message);
}
