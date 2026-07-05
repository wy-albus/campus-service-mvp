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

test('runCampusAgent keeps travel interaction drafts natural', async () => {
  const result = await runCampusAgent('我想发帖子，问问大家暑假都打算去哪儿玩');

  assert.deepEqual(result.usedTools, ['draft_post']);
  assert.match(result.reply, /标题：大家暑假都打算去哪儿玩？/);
  assert.doesNotMatch(result.reply, /大家发|问问大家发|问问大家子|子，问问|求助/);
  assert.doesNotMatch(result.reply, /优化流程|引导分流|学习和生活安排/);
});

test('runCampusAgent writes cafeteria complaints as rants instead of process suggestions', async () => {
  const result = await runCampusAgent('食堂的菜好难吃，我要发个帖子吐槽一下，请你帮我写写草稿');

  assert.deepEqual(result.usedTools, ['draft_post']);
  assert.match(result.reply, /吐槽|食堂/);
  assert.match(result.reply, /难吃|口味|菜/);
  assert.doesNotMatch(result.reply, /优化流程|引导分流|学习和生活安排/);
  assert.doesNotMatch(result.reply, /请你帮我写|我要发个帖子|吐槽一下.*吐槽一下/);
});
