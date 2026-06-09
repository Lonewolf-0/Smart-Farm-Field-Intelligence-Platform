import fs from 'fs';
import path from 'path';

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    var filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile() && filepath.endsWith('.tsx')) {
      callback(filepath);
    }
  });
}

const dir = process.argv[2];

walkSync(dir, (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let newContent = content.replace(/cyan-/g, 'emerald-');
  newContent = newContent.replace(/#38bdf8/g, '#34d399'); // cyan-400 to emerald-400
  if (content !== newContent) {
    fs.writeFileSync(filepath, newContent, 'utf8');
    console.log('Updated', filepath);
  }
});
