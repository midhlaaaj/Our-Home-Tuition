const fs = require('fs');
const svg = fs.readFileSync('C:/Users/midhl/Downloads/vectorized.svg', 'utf8');

// Strip XML declaration
let newSvg = svg.replace(/<\?xml.*?\?>\s*/, '');
// Add props and classes to the svg element
newSvg = newSvg.replace(/<svg\s+/, '<svg className="w-full h-full drop-shadow-2xl" preserveAspectRatio="xMidYMid meet" {...props} ');
// Remove xmlns if desired
newSvg = newSvg.replace(/\s*xmlns="[^"]+"/, '');

const tsxContent = `import React from 'react';

export const HeroIllustration = (props: React.SVGProps<SVGSVGElement>) => (
  ${newSvg}
);
`;

fs.writeFileSync('C:/Users/midhl/Downloads/Our Home Tuition/client/src/components/HeroIllustration.tsx', tsxContent);
console.log('Successfully written to HeroIllustration.tsx');
