const fs = require('fs');
const path = require('path');

const filesToProcess = [
  "c:/xampp/htdocs/final/frontend/hooks/adminStore.js",
  "c:/xampp/htdocs/final/frontend/app/auth/AuthPage.js",
  "c:/xampp/htdocs/final/frontend/app/admin/login/page.js",
  "c:/xampp/htdocs/final/frontend/app/components/SiteNavbar.js"
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace `fetch("/api` or `fetch(`/api` with `apiFetch("/api` or `apiFetch(`/api`
  content = content.replace(/fetch\((['"`])\/api/g, "apiFetch($1/api");
  
  // For endpoint variable in AuthPage: fetch(endpoint -> apiFetch(endpoint
  content = content.replace(/fetch\(endpoint/g, "apiFetch(endpoint");
  
  // Add import if apiFetch was inserted
  if (content.includes('apiFetch(') && !content.includes('import { apiFetch }')) {
    // find relative path to lib/apiFetch.js
    const dir = path.dirname(filePath);
    let relativePath = path.relative(dir, "c:/xampp/htdocs/final/frontend/lib/apiFetch.js");
    relativePath = relativePath.replace(/\\/g, '/'); // normalize for imports
    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }
    relativePath = relativePath.replace(/\.js$/, '');
    
    content = `import { apiFetch } from "${relativePath}";\n` + content;
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed: ${filePath}`);
}

filesToProcess.forEach(f => {
  if (fs.existsSync(f)) {
    processFile(f);
  } else {
    console.log(`Not found: ${f}`);
  }
});
