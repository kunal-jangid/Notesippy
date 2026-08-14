const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

// Read files
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

let targetVersion = process.argv[2];

if (!targetVersion) {
  // Auto-increment patch version (subversion)
  const currentVersion = packageJson.version || '1.0.0';
  const parts = currentVersion.split('.');
  if (parts.length === 3) {
    parts[2] = parseInt(parts[2], 10) + 1;
    targetVersion = parts.join('.');
  } else {
    targetVersion = currentVersion + '.1';
  }
}

// Update package.json
packageJson.version = targetVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

console.log(targetVersion);
