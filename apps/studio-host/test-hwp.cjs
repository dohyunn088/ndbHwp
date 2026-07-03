const fs = require('fs');
const rhwp = require('@rhwp/core/rhwp.js');

async function main() {
  await rhwp.default();
  console.log('rhwp loaded');
  const bytes = fs.readFileSync('../../sample/외래대장안내문.hwp');
  const doc = new rhwp.HwpDocument(bytes);
  doc.convertToEditable();
  
  const infoStr = doc.getDocumentInfo();
  const info = JSON.parse(infoStr);
  console.log('Page count:', info.pageCount);
  
  // Try to find a way to list tables and paragraphs to fix them
  // Print available methods
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(doc)));
}

main().catch(console.error);
