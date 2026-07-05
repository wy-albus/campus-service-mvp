import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('agent prompt tells the model to preserve post intent', async () => {
  const source = await fs.readFile(new URL('./doubaoAgent.js', import.meta.url), 'utf8');

  assert.match(source, /互动帖/);
  assert.match(source, /不要把.*改写成建议/);
});
