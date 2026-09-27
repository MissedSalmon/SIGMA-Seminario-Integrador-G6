const fs = require('fs');
const path = 'frontend/package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.overrides = pkg.overrides || {};
pkg.overrides['uuid'] = '^11.1.1';
fs.writeFileSync(path, JSON.stringify(pkg, null, 2), 'utf8');
