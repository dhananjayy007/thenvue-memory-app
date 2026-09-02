const fs = require('fs');
const path = require('path');

const files = [
  'components/auth/onboarding-modal.tsx',
  'components/landing/bento-features.tsx',
  'components/landing/demo-search-widget.tsx',
  'components/landing/hero.tsx',
  'components/landing/how-it-works.tsx',
  'components/memory/capture-modal.tsx',
  'components/memory/detail-modal.tsx',
  'components/views/home.tsx',
  'components/views/you.tsx'
];

files.forEach(f => {
  const filePath = path.join(__dirname, f);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('Sparkles')) {
    // Replace the import
    if (!content.includes('CustomBrainIcon')) {
      content = content.replace(/import \{([^}]*)\} from 'lucide-react'/, (match, p1) => {
        return `import {${p1}} from 'lucide-react'\nimport { CustomBrainIcon } from '@/components/icons/custom-brain-icon'`;
      });
    }
    
    // Replace the component tags
    content = content.replace(/<Sparkles/g, '<CustomBrainIcon');
    content = content.replace(/Sparkles,/g, ''); // Remove from lucide-react imports if it's there
    content = content.replace(/icon: Sparkles/g, 'icon: CustomBrainIcon');
    
    fs.writeFileSync(filePath, content, 'utf-8');
  }
});
console.log('Replaced Sparkles with CustomBrainIcon');
