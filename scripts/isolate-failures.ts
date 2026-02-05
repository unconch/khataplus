
import fs from 'fs';
import path from 'path';

const OCR_OUTPUT = 'ocr_data.json';
const OUTPUT_DIR = 'failed_slips';
const SOURCE_DIR = path.join(process.cwd(), 'temp_slips');

function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    });
    return fileList;
}

function main() {
    if (!fs.existsSync(OCR_OUTPUT)) {
        console.error(`${OCR_OUTPUT} not found.`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(OCR_OUTPUT, 'utf-8');
    const ocrData = JSON.parse(rawData);

    if (fs.existsSync(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(OUTPUT_DIR);

    const allFiles = getAllFiles(SOURCE_DIR);

    let count = 0;
    ocrData.failures.forEach((fail: any) => {
        const basename = fail.file;
        // Find full path
        const fullPath = allFiles.find(p => path.basename(p) === basename);
        if (fullPath) {
            const dest = path.join(OUTPUT_DIR, basename);
            fs.copyFileSync(fullPath, dest);
            count++;
        } else {
            console.warn(`Could not find source for ${basename}`);
        }
    });

    console.log(`Copied ${count} failed slips to ${OUTPUT_DIR}/`);

    // Also handle duplicates?
    // User specifically asked for "photos u have doubt in".
    // I'll create a separate folder for duplicates just in case
    const DUPE_DIR = 'duplicate_slips';
    if (fs.existsSync(DUPE_DIR)) {
        fs.rmSync(DUPE_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(DUPE_DIR);

    let dupeCount = 0;
    ocrData.duplicates.forEach((set: any) => {
        // Create subfolder for each date?
        const dateDir = path.join(DUPE_DIR, set.date);
        if (!fs.existsSync(dateDir)) fs.mkdirSync(dateDir);

        set.files.forEach((f: string) => {
            const fullPath = allFiles.find(p => path.basename(p) === f);
            if (fullPath) {
                fs.copyFileSync(fullPath, path.join(dateDir, f));
                dupeCount++;
            }
        });
    });
    console.log(`Copied ${dupeCount} duplicate slips to ${DUPE_DIR}/ (organized by date)`);
}

main();
