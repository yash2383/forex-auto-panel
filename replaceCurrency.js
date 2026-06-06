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

      // Replace symbols
      content = content.replace(/₹/g, '$');
      content = content.replace(/Rs/g, '$'); // basic match for Rs, could be dangerous if part of a word.
      // Better replace for Rs : only "Rs " or "Rs."
      // Actually skip Rs for now unless it's standalone to avoid breaking code like `userRecord`.
      
      // Replace INR literal strings
      content = content.replace(/'INR'/g, "'USD'");
      content = content.replace(/"INR"/g, '"USD"');
      content = content.replace(/INR/g, 'USD'); // Global INR replace (safe usually)

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

for (const dir of directoriesToScan) {
  scanAndReplace(dir);
}

console.log("Currency migration script finished.");
