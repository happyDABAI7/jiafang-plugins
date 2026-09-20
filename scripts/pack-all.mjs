// 把 5 个插件各 npm pack 一次，产物收集到 release/
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const plugins = ['jiafang-vision', 'jiafang-extract', 'jiafang-nl2sql', 'jiafang-asr', 'jiafang-persona'];
const release = join(root, 'release');
mkdirSync(release, { recursive: true });

for (const p of plugins) {
  const out = execSync('npm pack --pack-destination ../release', {
    cwd: join(root, p),
    encoding: 'utf-8',
  }).trim().split(/\r?\n/).pop();
  console.log('packed', out);
}
console.log('done ->', release);
