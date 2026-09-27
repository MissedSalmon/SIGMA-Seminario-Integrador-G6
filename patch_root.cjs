const fs = require('fs');
const pathRoot = 'package.json';
const pkgRoot = JSON.parse(fs.readFileSync(pathRoot, 'utf8'));
pkgRoot.overrides = pkgRoot.overrides || {};
pkgRoot.overrides['uuid'] = '^11.1.1';
fs.writeFileSync(pathRoot, JSON.stringify(pkgRoot, null, 2), 'utf8');

const pathFront = 'frontend/package.json';
const pkgFront = JSON.parse(fs.readFileSync(pathFront, 'utf8'));
pkgFront.dependencies['exceljs'] = '^4.4.0';
// Remove override from frontend as it's ignored in workspaces
if (pkgFront.overrides) delete pkgFront.overrides;
fs.writeFileSync(pathFront, JSON.stringify(pkgFront, null, 2), 'utf8');
