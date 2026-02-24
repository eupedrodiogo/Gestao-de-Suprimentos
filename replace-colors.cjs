const fs = require('fs');
const path = require('path');

function replaceColors(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace slate and stone with brand
  content = content.replace(/slate-/g, 'brand-');
  content = content.replace(/stone-/g, 'brand-');
  
  // Replace specific accent colors with brand colors to match the earthy palette
  content = content.replace(/blue-900/g, 'brand-900');
  content = content.replace(/blue-800/g, 'brand-800');
  content = content.replace(/blue-700/g, 'brand-700');
  content = content.replace(/blue-600/g, 'brand-600');
  content = content.replace(/blue-500/g, 'brand-500');
  content = content.replace(/blue-400/g, 'brand-400');
  content = content.replace(/blue-300/g, 'brand-300');
  content = content.replace(/blue-200/g, 'brand-200');
  content = content.replace(/blue-100/g, 'brand-100');
  content = content.replace(/blue-50/g, 'brand-50');
  
  content = content.replace(/emerald-900/g, 'brand-900');
  content = content.replace(/emerald-800/g, 'brand-800');
  content = content.replace(/emerald-700/g, 'brand-700');
  content = content.replace(/emerald-600/g, 'brand-600');
  content = content.replace(/emerald-500/g, 'brand-500');
  content = content.replace(/emerald-400/g, 'brand-400');
  content = content.replace(/emerald-300/g, 'brand-300');
  content = content.replace(/emerald-200/g, 'brand-200');
  content = content.replace(/emerald-100/g, 'brand-100');
  content = content.replace(/emerald-50/g, 'brand-50');
  
  content = content.replace(/indigo-900/g, 'brand-800');
  content = content.replace(/indigo-800/g, 'brand-700');
  content = content.replace(/indigo-700/g, 'brand-600');
  content = content.replace(/indigo-600/g, 'brand-500');
  content = content.replace(/indigo-500/g, 'brand-400');
  content = content.replace(/indigo-400/g, 'brand-300');
  content = content.replace(/indigo-300/g, 'brand-200');
  content = content.replace(/indigo-200/g, 'brand-100');
  content = content.replace(/indigo-100/g, 'brand-50');
  content = content.replace(/indigo-50/g, 'brand-50');

  content = content.replace(/purple-900/g, 'brand-900');
  
  fs.writeFileSync(filePath, content);
}

const files = [
  'App.tsx',
  'index.html',
  ...fs.readdirSync('components').map(f => path.join('components', f))
];

files.forEach(f => replaceColors(f));
console.log('Colors replaced successfully!');
