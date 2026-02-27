const fs = require('fs');

const path = 'src/pages/admin/premium/banco-preguntas.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = {
    '┬┐': '¿',
    'ÔÇô': '–',
    'ÔÇö': '—'
};

for (const [bad, good] of Object.entries(replacements)) {
    content = content.split(bad).join(good);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done additional fixes');