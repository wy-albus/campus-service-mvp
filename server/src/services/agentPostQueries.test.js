import test from 'node:test';
import assert from 'node:assert/strict';
import { runCampusAgent, summarizePostQueryIntent } from './doubaoAgent.js';
import { buildPostDiscussionMaterial, formatPostQueryReply } from './agentTools.js';

test('summarizePostQueryIntent detects tag count requests', () => {
  const intent = summarizePostQueryIntent('旅游类的帖子有多少');

  assert.equal(intent.type, 'count');
  assert.equal(intent.tag, '旅游');
  assert.equal(intent.query, '');
});

test('summarizePostQueryIntent detects semantic forum summary requests', () => {
  const intent = summarizePostQueryIntent('最近大家暑假都打算去哪里玩？');

  assert.equal(intent.type, 'summary');
  assert.equal(intent.tag, '旅游');
  assert.match(intent.query, /暑假|去哪|哪里|玩/);
});

test('formatPostQueryReply reports counts from database results', () => {
  const reply = formatPostQueryReply({
    type: 'count',
    tag: '旅游',
    total: 2,
    items: [],
    source: 'database',
  });

  assert.match(reply, /旅游/);
  assert.match(reply, /2\s*条/);
  assert.doesNotMatch(reply, /暂时没有找到/);
});

test('formatPostQueryReply summarizes matched forum posts', () => {
  const reply = formatPostQueryReply({
    type: 'summary',
    tag: '旅游',
    total: 2,
    source: 'database',
    items: [
      { title: '好想出去玩', tag: '旅游', summary: '暑假想去海边或者爬山。' },
      { title: '暑假去哪儿', tag: '旅游', summary: '大家推荐了成都和南京。' },
    ],
  });

  assert.match(reply, /找到\s*2\s*条/);
  assert.match(reply, /好想出去玩/);
  assert.match(reply, /暑假去哪儿/);
  assert.match(reply, /总结|大致/);
});

test('buildPostDiscussionMaterial includes post bodies and comments', () => {
  const material = buildPostDiscussionMaterial([
    {
      title: '暑假去哪儿',
      tag: '旅游',
      content: '我想去省外旅游。',
      summary: '我想去省外旅游。',
      comments: ['我准备在家复习。', '我想去成都玩几天。'],
    },
  ]);

  assert.match(material, /帖子 1/);
  assert.match(material, /我想去省外旅游/);
  assert.match(material, /我准备在家复习/);
  assert.match(material, /我想去成都玩几天/);
});

test('runCampusAgent summarizes forum trend questions with the model', async () => {
  const calls = [];
  const fake = {
    client: {
      chat: {
        completions: {
          create: async (payload) => {
            calls.push(payload);
            return {
              choices: [
                {
                  message: {
                    content: '目前看，样本不多，只能简单参考：有人准备在家复习，也有人提到想去省外旅游。',
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

  const result = await runCampusAgent('最近大家暑假都打算去哪里玩？', {
    getClient: () => fake,
    runTool: async () => ({
      source: 'database',
      total: 1,
      items: [
        {
          title: '暑假计划',
          tag: '旅游',
          content: '我想问问大家暑假去哪儿。',
          summary: '我想问问大家暑假去哪儿。',
          comments: ['我准备在家复习。', '我想去省外旅游。'],
        },
      ],
    }),
  });

  assert.deepEqual(result.usedTools, ['search_posts']);
  assert.equal(calls.length, 1);
  assert.match(calls[0].messages.at(-1).content, /我准备在家复习/);
  assert.match(calls[0].messages.at(-1).content, /我想去省外旅游/);
  assert.match(result.reply, /在家复习/);
  assert.match(result.reply, /省外旅游/);
  assert.doesNotMatch(result.reply, /1\. 暑假计划/);
});
