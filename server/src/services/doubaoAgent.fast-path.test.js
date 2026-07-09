import test from 'node:test';
import assert from 'node:assert/strict';
import { runCampusAgent } from './doubaoAgent.js';

function makeDraftClient(responseContent) {
  const calls = [];
  return {
    calls,
    client: {
      chat: {
        completions: {
          create: async (payload) => {
            calls.push(payload);
            return {
              choices: [
                {
                  message: {
                    content: responseContent,
                  },
                },
              ],
            };
          },
        },
      },
    },
    model: 'test-model',
  };
}

function noModel() {
  throw new Error('model disabled for test');
}

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
  const result = await runCampusAgent('我想发帖子，问问大家暑假都打算去哪儿玩', {
    getClient: noModel,
  });

  assert.deepEqual(result.usedTools, ['draft_post']);
  assert.match(result.reply, /标题：大家暑假都打算去哪儿玩？/);
  assert.doesNotMatch(result.reply, /大家发|问问大家发|问问大家子|子，问问|求助/);
  assert.doesNotMatch(result.reply, /优化流程|引导分流|学习和生活安排/);
});

test('runCampusAgent writes cafeteria complaints as rants instead of process suggestions', async () => {
  const result = await runCampusAgent('食堂的菜好难吃，我要发个帖子吐槽一下，请你帮我写写草稿', {
    getClient: noModel,
  });

  assert.deepEqual(result.usedTools, ['draft_post']);
  assert.match(result.reply, /吐槽|食堂/);
  assert.match(result.reply, /难吃|口味|菜/);
  assert.doesNotMatch(result.reply, /优化流程|引导分流|学习和生活安排/);
  assert.doesNotMatch(result.reply, /请你帮我写|我要发个帖子|吐槽一下.*吐槽一下/);
});

test('runCampusAgent treats emotional exam complaints as rants in fallback', async () => {
  const result = await runCampusAgent('这次的模拟考试好难啊，好崩溃，我想发帖吐槽一下', {
    getClient: noModel,
  });

  assert.deepEqual(result.usedTools, ['draft_post']);
  assert.match(result.reply, /模拟考试|考试/);
  assert.match(result.reply, /难|崩溃|吐槽/);
  assert.doesNotMatch(result.reply, /一点建议|优化流程|引导分流|学习和生活安排/);
  assert.doesNotMatch(result.reply, /哪道菜|窗口/);
  assert.doesNotMatch(result.reply, /被这次|好崩溃整崩溃/);
});

test('runCampusAgent uses one model call for draft posts when a model is available', async () => {
  const fake = makeDraftClient(
    JSON.stringify({
      intent: 'rant',
      title: '食堂的菜最近是不是有点难吃？',
      content: '最近感觉食堂有些菜味道不太稳定，想问问大家有没有同感，也欢迎推荐一下最近比较好吃的窗口。',
      tags: ['吐槽', '美食'],
    }),
  );

  const result = await runCampusAgent('食堂的菜好难吃，我要发个帖子吐槽一下，请你帮我写写草稿', {
    getClient: () => fake,
  });

  assert.equal(fake.calls.length, 1);
  assert.deepEqual(result.usedTools, ['draft_post']);
  assert.match(result.reply, /食堂的菜最近是不是有点难吃？/);
  assert.match(result.reply, /味道不太稳定/);
  assert.doesNotMatch(result.reply, /优化流程|引导分流|学习和生活安排/);
  assert.equal(fake.calls[0].tools, undefined);
  assert.match(fake.calls[0].messages.at(-1).content, /intent/);
  assert.match(fake.calls[0].messages.at(-1).content, /event/);
});

test('runCampusAgent lets the model semantically classify event drafts', async () => {
  const fake = makeDraftClient(
    JSON.stringify({
      intent: 'event',
      title: '运动会活动帖',
      content: '想和大家分享一下运动会相关信息，欢迎感兴趣的同学一起参加、加油或在评论里补充安排。',
      tags: ['活动'],
    }),
  );

  const result = await runCampusAgent('帮我写一个运动会的帖子', {
    getClient: () => fake,
  });

  assert.equal(fake.calls.length, 1);
  assert.deepEqual(result.usedTools, ['draft_post']);
  assert.match(result.reply, /运动会活动帖/);
  assert.match(result.reply, /参加|加油|活动/);
  assert.doesNotMatch(result.reply, /优化流程|引导分流|学习和生活安排|一点建议/);
  assert.equal(fake.calls[0].tools, undefined);
});
