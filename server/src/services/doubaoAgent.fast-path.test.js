import test from 'node:test';
import assert from 'node:assert/strict';
import { runCampusAgent } from './doubaoAgent.js';

test('runCampusAgent drafts simple forum posts without requiring model credentials', async () => {
  const previous = {
    ARK_API_KEY: process.env.ARK_API_KEY,
    ARK_BASE_URL: process.env.ARK_BASE_URL,
    ARK_MODEL_ID: process.env.ARK_MODEL_ID,
  };

  delete process.env.ARK_API_KEY;
  delete process.env.ARK_BASE_URL;
  delete process.env.ARK_MODEL_ID;

  try {
    const result = await runCampusAgent('我想在论坛发帖，问问大家假期打算如何度过');

    assert.deepEqual(result.usedTools, ['draft_post']);
    assert.match(result.reply, /大家假期都准备怎么过？/);
    assert.doesNotMatch(result.reply, /优化流程|引导分流|关于在论坛发帖/);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
