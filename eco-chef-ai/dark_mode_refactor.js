const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/app/(dashboard)');

const replacements = [
  { from: /bg-white/g, to: 'bg-zinc-900' },
  { from: /bg-slate-50/g, to: 'bg-zinc-950' },
  { from: /bg-slate-100/g, to: 'bg-zinc-800' },
  { from: /bg-slate-200/g, to: 'bg-zinc-700' },
  { from: /border-slate-200/g, to: 'border-zinc-800' },
  { from: /border-slate-300/g, to: 'border-zinc-700' },
  { from: /text-slate-900/g, to: 'text-white' },
  { from: /text-slate-800/g, to: 'text-zinc-100' },
  { from: /text-slate-700/g, to: 'text-zinc-200' },
  { from: /text-slate-600/g, to: 'text-zinc-300' },
  { from: /text-slate-500/g, to: 'text-zinc-400' },
  { from: /text-slate-400/g, to: 'text-zinc-500' },
  { from: /text-emerald-800/g, to: 'text-emerald-400' },
  { from: /text-emerald-700/g, to: 'text-emerald-300' },
  { from: /text-emerald-600/g, to: 'text-emerald-400' },
  { from: /bg-emerald-50/g, to: 'bg-emerald-500\/10' },
  { from: /border-emerald-100/g, to: 'border-emerald-500\/20' },
  { from: /text-red-800/g, to: 'text-red-400' },
  { from: /text-red-700/g, to: 'text-red-300' },
  { from: /text-red-600/g, to: 'text-red-400' },
  { from: /bg-red-50/g, to: 'bg-red-500\/10' },
  { from: /border-red-100/g, to: 'border-red-500\/20' },
  { from: /text-blue-700/g, to: 'text-blue-400' },
  { from: /bg-blue-50/g, to: 'bg-blue-500\/10' },
  { from: /border-blue-200/g, to: 'border-blue-500\/20' },
  { from: /text-amber-700/g, to: 'text-amber-400' },
  { from: /bg-amber-50/g, to: 'bg-amber-500\/10' },
  { from: /border-amber-200/g, to: 'border-amber-500\/20' }
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  
  // Custom fixes for hard to read inputs
  // Remove dark: classes since we are making everything permanently dark
  content = content.replace(/dark:[A-Za-z0-9-\[\]\/]+/g, '');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
