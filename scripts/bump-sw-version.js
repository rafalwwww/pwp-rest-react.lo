#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Usage: node scripts/bump-sw-version.js [v1|v2|...]
// If no arg provided, generates timestamp-based version: vYYYYMMDDHHMMSS

function makeTimestampVersion() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  const v = `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
  return 'v' + v;
}

const args = process.argv.slice(2);
const dryIndex = args.indexOf('--dry-run');
const isDry = dryIndex !== -1;
if (isDry) args.splice(dryIndex, 1);
const versionArg = args[0];
const version = versionArg && versionArg.startsWith('v') ? versionArg : (versionArg ? 'v' + versionArg : makeTimestampVersion());

const swPath = path.join(__dirname, '..', 'public', 'sw.js');

if (!fs.existsSync(swPath)) {
  console.error('Service worker file not found at', swPath);
  process.exit(2);
}

let content = fs.readFileSync(swPath, 'utf8');

// Accept single or double quoted CACHE_VERSION value
const re = /const\s+CACHE_VERSION\s*=\s*['"][^'"]*['"];?/m;
if (!re.test(content)) {
  console.error('CACHE_VERSION constant not found in', swPath);
  process.exit(3);
}

const replacement = `const CACHE_VERSION = '${version}';`;
const newContent = content.replace(re, replacement);

if (isDry) {
  console.log('[dry run] Would bump CACHE_VERSION to', version, 'in', swPath);
  process.exit(0);
}

fs.writeFileSync(swPath, newContent, 'utf8');
console.log('Bumped CACHE_VERSION to', version, 'in', swPath);
process.exit(0);
