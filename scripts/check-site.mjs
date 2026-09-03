import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const index = await readFile(resolve(root, 'index.html'), 'utf8');
const data = await readFile(resolve(root, 'assets/js/data.js'), 'utf8');
const app = await readFile(resolve(root, 'assets/js/app.js'), 'utf8');

for (const requiredPath of [
  'assets/css/styles.css',
  'assets/js/app.js',
  'assets/js/data.js',
  'assets/js/domain.js',
  'assets/images/maya-patel.png',
  'assets/images/jordan-williams.png',
  'assets/images/sofia-ramirez.png',
  'assets/images/ethan-lee.png',
]) {
  await access(resolve(root, requiredPath));
}

assert.match(index, /posthog\.init\('phc_txVivnwXGwZwbjotysrZw3zsvdWHRrWgLT78TbDYNrqK'/);
assert.match(index, /api_host: 'https:\/\/us\.i\.posthog\.com'/);
assert.match(index, /autocapture: false/);
assert.match(index, /person_profiles: 'identified_only'/);
assert.match(data, /availability:/);
assert.match(app, /tutor profile viewed/);
assert.match(app, /booking started/);
assert.match(app, /time selected/);
assert.match(app, /booking confirmed/);
assert.match(app, /booking exited/);
assert.match(app, /tutor filters applied/);
assert.doesNotMatch(index, />[^<]*(ChatGPT|GPT|artificial intelligence)[^<]*</i);

console.log('Site contract checks passed.');
