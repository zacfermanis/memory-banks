const { TemplateRenderer } = require('./dist/services/templateRenderer');

async function debugLoop() {
  const renderer = new TemplateRenderer();
  
  // Test the complex loop from the performance test
  const template = '{% for item in items %}\n' +
    'Item {{loop.index}}: {{item.name}} - {{item.description}}\n' +
    'Price: ${{item.price}}\n' +
    'Category: {{item.category}}\n' +
    'Tags: {% for tag in item.tags %}{{tag}}{% if not loop.last %}, {% endif %}{% endfor %}\n' +
    '\n' +
    '{% endfor %}';

  const variables = {
    items: [
      { 
        name: 'Product 0',
        description: 'Description for product 0',
        price: '10.00',
        category: 'Category 0',
        tags: ['tag0', 'tag1', 'tag2']
      },
      { 
        name: 'Product 1',
        description: 'Description for product 1',
        price: '20.00',
        category: 'Category 1',
        tags: ['tag3', 'tag4', 'tag5']
      }
    ]
  };
  
  console.log('Complex Template:', template);
  console.log('Variables:', JSON.stringify(variables, null, 2));
  
  // Debug the regex matching
  const forLoopRegex = /{%\s*for\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)\s*%}([\s\S]*?){%\s*endfor\s*%}/gs;
  let match;
  while ((match = forLoopRegex.exec(template)) !== null) {
    console.log('Regex match found:');
    console.log('  Full match:', match[0]);
    console.log('  Item var:', match[1]);
    console.log('  Collection path:', match[2]);
    console.log('  Loop content:', match[3]);
    console.log('  Loop content length:', match[3].length);
    
    // Check if there are nested loops in the content
    const nestedLoopRegex = /{%\s*for\s+(\w+)\s+in\s+(\w+(?:\.\w+)*)\s*%}/g;
    const nestedMatches = match[3].match(nestedLoopRegex);
    if (nestedMatches) {
      console.log('  Nested loops found:', nestedMatches);
    }
  }
  
  const result = await renderer.renderTemplate(template, variables);
  console.log('Complex Result:', result.content);
  console.log('Complex Result length:', result.content.length);
  console.log('Contains Product 1:', result.content.includes('Product 1'));
  console.log('Contains nested loop syntax:', result.content.includes('{% for tag in item.tags %}'));
}

debugLoop().catch(console.error); 