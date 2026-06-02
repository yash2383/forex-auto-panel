const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('C:\\xampp\\htdocs\\final\\backend\\src', function(filePath) {
    if (!filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix imports
    content = content.replace(/import\s+{\s*(Request|Response|Request,\s*Response|Response,\s*Request)\s*}\s*from\s*'express';/g, "import type { $1 } from 'express';");
    content = content.replace(/import\s+{\s*Response\s*}\s*from\s*'express';/g, "import type { Response } from 'express';");
    content = content.replace(/import\s+{\s*Request\s*}\s*from\s*'express';/g, "import type { Request } from 'express';");

    // Fix implicit any in map/reduce/transaction
    content = content.replace(/\(\(t\)\s*=>/g, '((t: any) =>');
    content = content.replace(/\(\(p\)\s*=>/g, '((p: any) =>');
    content = content.replace(/\(\(w\)\s*=>/g, '((w: any) =>');
    content = content.replace(/\(\(sum,\s*t\)\s*=>/g, '((sum: number, t: any) =>');
    content = content.replace(/\(\(sum,\s*w\)\s*=>/g, '((sum: number, w: any) =>');
    content = content.replace(/\(async\s*\(tx\)\s*=>/g, '(async (tx: any) =>');
    content = content.replace(/\(async\s*\(prisma\)\s*=>/g, '(async (prisma: any) =>');

    // Fix number | undefined
    content = content.replace(/res\.status\(result\.status\)/g, 'res.status(result.status || 400)');
    content = content.replace(/res\.status\(error\.status\)/g, 'res.status(error.status || 500)');

    // Fix Prisma.Decimal -> imported from @prisma/client
    // We'll just replace `new Prisma.Decimal` with `new Prisma.Decimal` but ensure it imports Prisma correctly, 
    // or just change it to cast to any if Prisma doesn't have it on type
    content = content.replace(/new\s+Prisma\.Decimal\(/g, 'new (Prisma as any).Decimal(');

    // Any other implicit anys
    content = content.replace(/catch\s*\(\(error\)/g, 'catch ((error: any)');
    content = content.replace(/catch\s*\(error\)/g, 'catch (error: any)');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Fixed', filePath);
    }
});
