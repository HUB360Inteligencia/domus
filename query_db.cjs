const fs = require('fs');
const path = require('path');

const typesPath = path.join(__dirname, 'src', 'integrations', 'supabase', 'types.ts');
const content = fs.readFileSync(typesPath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('app_role')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
