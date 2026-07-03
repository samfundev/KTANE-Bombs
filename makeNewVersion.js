// makeNewVersion.js
import path from "path";
import { fileURLToPath } from "url";
import { readFile, writeFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE = path.join(__dirname, "package.json");
const INDEXHTML = path.join(__dirname, 'src', 'app.html');

export async function updateVersion() {
    // Compute new patch number
    const epochSeconds = Math.floor(Date.now() / 1000);
    const roundedEpoch = Math.floor(epochSeconds / 100) * 100;

    // Update package.json
    const pkgRaw = await readFile(PACKAGE, 'utf8');
    const pkg = JSON.parse(pkgRaw);

    if (!pkg.version || typeof pkg.version !== 'string') {
        throw new Error('package.json version field missing or invalid');
    }

    const parts = pkg.version.split('.');
    parts[2] = String(roundedEpoch);
    const newVersion = parts.slice(0, 3).join('.');
    pkg.version = newVersion;

    await writeFile(PACKAGE, JSON.stringify(pkg, null, 2) + '\n');

    // Update app.html
    const indexRaw = await readFile(INDEXHTML, 'utf8');

    const updatedIndex = indexRaw.replace(
        /<!--\s*Version\s+[\d.]+\s*-->/,
        `<!-- Version ${newVersion} -->`
    );

    await writeFile(INDEXHTML, updatedIndex);

    return newVersion;
}

async function main() {
    let newVersion = await updateVersion().catch(err => console.error(err));
    console.log(`\nVersion updated to ${newVersion}\n`);
}

main().catch(err => console.error(err));
