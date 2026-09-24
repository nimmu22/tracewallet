// Compile test fixtures with the existing TypeScript dependency, without a runtime loader.
import ts from 'typescript';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=resolve('work/accuracy');
for(const name of ['tests/accuracy.test.ts','services/validation.ts','services/evm.ts','services/types.ts','services/http.ts']){
 const output=resolve(root,name.replace(/\.ts$/,'.js'));
 mkdirSync(dirname(output),{recursive:true});
 const result=ts.transpileModule(readFileSync(name,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}});
 writeFileSync(output,result.outputText);
}
writeFileSync(resolve(root,'package.json'),JSON.stringify({type:'commonjs'}));
const result=spawnSync(process.execPath,['--test',resolve(root,'tests/accuracy.test.js')],{stdio:'inherit'});
process.exitCode=result.status??1;
