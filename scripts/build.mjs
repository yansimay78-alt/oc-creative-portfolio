import {readFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import ts from 'typescript';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const name of ['hero-carousel','carousel-motion','carousel-ornaments']){
 const source=await readFile(path.join(root,'src',name+'.ts'),'utf8');
 const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}});
 await writeFile(path.join(root,'dist',name+'.js'),result.outputText);
}
const html=await readFile(path.join(root,'dist/index.html'),'utf8');
const routes=['gallery',...(await readdir(path.join(root,'dist/projects'))).map(name=>'projects/'+name)];
for(const route of routes){
 const prefix='../'.repeat(route.split('/').length);
 const page=html.replace(/(src|href)="((?:assets\/|vendor\/|style\.css|app\.js)[^"]*)"/g,(_,attr,url)=>`${attr}="${prefix}${url}"`);
 await writeFile(path.join(root,'dist',route,'index.html'),page);
}
console.log('Updated carousel modules and independent page entries.');
