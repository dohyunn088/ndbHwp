import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const rhwpCorePath = require.resolve('@rhwp/core/rhwp.js', { paths: [resolve('./apps/studio-host')] });

import(rhwpCorePath).then((rhwp) => {
    const bytes = readFileSync('./sample/외래대장안내문.hwp');
    console.log('rhwp loaded, exports:', Object.keys(rhwp));
    
    // We don't know the exact API, let's print it
    if (rhwp.Document) {
        console.log('Document class exists');
    }
}).catch(err => {
    console.error('Failed to load rhwp core:', err);
});
