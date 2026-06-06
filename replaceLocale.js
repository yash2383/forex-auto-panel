const fs = require('fs');
const path = require('path');

const directoriesToScan = [
  'd:/tradebot/frontend/app',
  'd:/tradebot/frontend/components',
  'd:/tradebot/frontend/hooks',
  'd:/tradebot/frontend/lib',
  'd:/tradebot/frontend/scripts',
  'd:/tradebot/backend/src',
  'd:/tradebot/backend/scripts',
  'd:/tradebot/backend/prisma'
];

function scanAndReplace(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanAndReplace(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      content = content.replace(/'en-IN'/g, "'en-US'");
      content = content.replace(/"en-IN"/g, '"en-US"');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated locale in: ${fullPath}`);
      }
    }
  }
}

for (const dir of directoriesToScan) {
  scanAndReplace(dir);
}

console.log("Locale migration script finished.");
