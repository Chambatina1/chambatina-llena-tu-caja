const fs = require('fs');
let content = fs.readFileSync('src/lib/products.ts', 'utf8');

const mapping = {
  'gv-rice-5lb': 'bag', 'gv-pinto-beans-2lb': 'bag', 'gv-black-beans-15oz': 'can',
  'gv-flour-5lb': 'bag', 'gv-cornmeal-2lb': 'bag', 'gv-spaghetti-16oz': 'bag',
  'gv-mac-cheese-5pk': 'box', 'gv-oatmeal-42oz': 'bag', 'gv-lentils-1lb': 'bag',
  'gv-garbanzos-1lb': 'bag',
  'gv-milk-powder-25oz': 'bag', 'gv-nido-12oz': 'can',
  'gv-shredded-cheese-8oz': 'pouch', 'gv-cream-cheese-8oz': 'box',
  'gv-vegetable-oil-48oz': 'bottle', 'gv-butter-1lb': 'bar',
  'gv-margarine-3lb': 'box', 'gv-peanut-butter-40oz': 'jar',
  'gv-sugar-4lb': 'bag', 'gv-honey-12oz': 'jar', 'gv-syrup-24oz': 'bottle',
  'gv-tuna-6pk': 'can', 'gv-chicken-broth-4pk': 'can',
  'gv-tomato-sauce-3pk': 'can', 'gv-corn-3pk': 'can', 'gv-tomato-paste-4pk': 'can',
  'gv-refried-beans-3pk': 'can', 'gv-jalapenos-2pk': 'jar',
  'gv-coffee-ground-30oz': 'bag', 'gv-instant-coffee-7oz': 'jar',
  'fv-coffee-cream-15oz': 'bottle', 'gv-cocoa-10oz': 'bag',
  'gv-corn-flakes-13oz': 'box', 'gv-pancake-mix-32oz': 'bag',
  'gv-granola-20oz': 'bag', 'gv-crackers-1lb': 'box',
  'gv-soap-3pk': 'bar', 'gv-toothpaste-1': 'box',
  'gv-shampoo-12oz': 'bottle', 'gv-deodorant-1': 'box', 'gv-body-wash-18oz': 'bottle',
  'gv-detergent-52oz': 'bottle', 'gv-dish-soap-14oz': 'bottle',
  'gv-tp-4pk': 'box', 'gv-bleach-1gal': 'bottle', 'gv-salt-26oz': 'jar',
  'gv-vinegar-1gal': 'bottle',
  'gv-condensed-milk-14oz': 'can', 'gv-evaporated-milk-12oz': 'can',
  'gv-parmesan-8oz': 'jar', 'gv-mozzarella-8oz': 'pouch',
  'gv-rice-2lb': 'bag', 'gv-elbow-pasta-16oz': 'bag', 'gv-pen pasta-16oz': 'bag',
  'gv-cornstarch-16oz': 'bag', 'gv-quinoa-12oz': 'bag', 'gv-gnocchi-16oz': 'bag',
  'gv-green-beans-3pk': 'can', 'gv-peas-3pk': 'can', 'gv-mixed-veg-3pk': 'can',
  'gv-chili-3pk': 'can', 'gv-tuna-oil-3pk': 'can', 'gv-potatoes-3pk': 'can',
  'gv-chicken-5oz': 'can',
  'gv-sunflower-seeds-8oz': 'bag', 'gv-peanuts-16oz': 'bag', 'gv-mixed-nuts-10oz': 'bag',
  'gv-raisins-15oz': 'bag', 'gv-almonds-6oz': 'bag', 'gv-pumpkin-seeds-5oz': 'bag',
  'gv-ketchup-20oz': 'bottle', 'gv-mayo-30oz': 'jar', 'gv-mustard-12oz': 'bottle',
  'gv-hot-sauce-5oz': 'bottle', 'gv-soy-sauce-10oz': 'bottle',
  'gv-sazon-4pk': 'box', 'gv-adobo-4pk': 'jar',
  'gv-garlic-powder-2oz': 'jar', 'gv-onion-powder-2oz': 'jar',
  'gv-black-pepper-1oz': 'jar', 'gv-oregano-1oz': 'jar', 'gv-comino-1oz': 'jar',
  'gv-nesquik-21oz': 'bag', 'gv-tea-bags-100': 'box',
};

let found = 0;
let notFound = [];

for (const [id, type] of Object.entries(mapping)) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp("(id: '" + escaped + "',[\\s\\S]*?description: '[^']*'\\.)", 'm');
  const match = content.match(pattern);
  if (match) {
    const descLine = match[1];
    const replacement = descLine + ",\n    packagingType: '" + type + "'";
    content = content.replace(pattern, replacement);
    found++;
  } else {
    notFound.push(id);
  }
}

fs.writeFileSync('src/lib/products.ts', content);
console.log('Found:', found, 'Not found:', notFound.join(', '));
