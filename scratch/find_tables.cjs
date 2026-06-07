const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const tableMap = {};

walkDir('./src', function(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = /\.from\(\s*["']([^"']+)["']/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const table = match[1];
        if (!tableMap[table]) tableMap[table] = new Set();
        // Convert to forward slashes for output readability
        tableMap[table].add(filePath.replace(/\\/g, '/'));
    }
});

for (const [table, files] of Object.entries(tableMap)) {
    console.log(`Table: ${table}`);
    for (const file of Array.from(files).sort()) {
        console.log(`  - ${file}`);
    }
}
