const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const appJsonPath = path.join(__dirname, '..', 'app.json');

// Read files
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

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

// Update app.json
if (appJson.expo) {
  appJson.expo.version = targetVersion;
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n', 'utf8');
}

console.log(targetVersion);
