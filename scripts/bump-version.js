#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Get current version
const currentVersion = packageJson.version;
console.log(`Current version: ${currentVersion}`);

// Parse version components
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Bump patch version
const newVersion = `${major}.${minor}.${patch + 1}`;
console.log(`New version: ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ Version bumped from ${currentVersion} to ${newVersion}`);

  // Note: Version is automatically updated in package.json
  // The dist/index.js file will be rebuilt on next build, so no need to manually update it
  console.log('✅ Version updated in package.json'); 