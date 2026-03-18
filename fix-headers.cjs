const fs = require('fs');
const path = require('path');

const replacement1 = `headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` } : {})
        }`;
const regex1 = /headers:\s*\{\s*'Content-Type':\s*'application\/json',?\s*\}/g;

const replacement2 = `headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('token') ? { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` } : {})
            }`;
const regex2 = /headers:\s*\{\s*'Content-Type':\s*'application\/json',\s*\}/g;

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  content = content.replace(regex1, replacement1);
  content = content.replace(regex2, replacement2);
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
  }
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(path.join(dirPath, file));
    }
  }
}

processDirectory('src/services');
processFile('src/api/auth.ts');
