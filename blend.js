const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = 'components/landing-page';

console.log("Checking out from git to get original glows and glassmorphism...");
execSync('git checkout HEAD components/landing-page/', { stdio: 'inherit' });

console.log("Fixing overflow-hidden constraints...");
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace overflow-hidden on section and footer tags
    content = content.replace(/(<(?:section|footer)[^>]*className="[^"]*)( \boverflow-hidden\b|\boverflow-hidden\b )([^"]*"[^>]*>)/g, '$1$3');
    content = content.replace(/(<(?:section|footer)[^>]*className="[^"]*)(\boverflow-hidden\b)([^"]*"[^>]*>)/g, '$1$3');

    fs.writeFileSync(filePath, content, 'utf8');
}

console.log("Applying Sarvam Geometry (Radii, Shadows, Borders) without touching Glassmorphism...");
const geometryReplacements = [
    { regex: /rounded-\[3\.5rem\]/g, replacement: 'rounded-3xl' },
    { regex: /rounded-\[3rem\]/g, replacement: 'rounded-3xl' },
    { regex: /rounded-\[2\.8rem\]/g, replacement: 'rounded-3xl' },
    { regex: /rounded-\[2\.5rem\]/g, replacement: 'rounded-2xl' },
    { regex: /rounded-\[2\.2rem\]/g, replacement: 'rounded-2xl' },
    { regex: /rounded-\[2rem\]/g, replacement: 'rounded-2xl' },
    { regex: /shadow-2xl/g, replacement: 'shadow-md' },
    { regex: /shadow-\[0_8px_30px_rgb\(0,0,0,0\.04\)\]/g, replacement: 'shadow-sm' },
    { regex: /shadow-\[0_20px_60px_-15px_rgba\(0,0,0,0\.05\)\]/g, replacement: 'shadow-md shadow-black\/5' },
    { regex: /shadow-\[0_20px_60px_-15px_rgba\(0,0,0,0\.1\)\]/g, replacement: 'shadow-md shadow-black\/10' },
    { regex: /border-zinc-200\/80/g, replacement: 'border-zinc-200/50' },
    { regex: /border-zinc-200\/60/g, replacement: 'border-zinc-200/40' },
];

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    for (const { regex, replacement } of geometryReplacements) {
        content = content.replace(regex, replacement);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

console.log("Restoring Aurora Hero Section...");
// Copy the backup hero section (which has the Aurora design) over the file
fs.copyFileSync('/tmp/HeroSection.bak', path.join(dir, 'HeroSection.tsx'));

console.log('Done crafting the perfect blend!');
