import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('startup controls referenced by the app exist in the HTML',()=>{
 const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const ids=new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]));
 const references=[...app.matchAll(/\$\(["']#([^"']+)["']\)/g)].map(m=>m[1]);
 for(const id of references)assert.ok(ids.has(id),'Missing startup element: '+id);
});
