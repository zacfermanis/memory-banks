#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Get current version
const currentVersion = packageJson.version;
console.log(`Current version: ${currentVersion}`);

// Check if this version is already tagged
try {
  execSync(`git tag -l "v${currentVersion}"`, { stdio: 'pipe' });
  console.log(`✅ Version v${currentVersion} is already tagged`);
} catch (error) {
  // Version not tagged, create tag
  console.log(`📦 Creating Git tag for version v${currentVersion}...`);
  execSync(`git tag -a "v${currentVersion}" -m "Release version ${currentVersion}"`);
  console.log(`✅ Created Git tag v${currentVersion}`);
}

// Show all tags
console.log('\n📋 All version tags:');
try {
  const tags = execSync('git tag --sort=-version:refname', { encoding: 'utf8' });
  console.log(tags.trim());
} catch (error) {
  console.log('No tags found');
}

console.log('\n💡 To push tags to remote: git push --tags'); 