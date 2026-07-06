import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizePostQueryIntent } from './doubaoAgent.js';
import { formatPostQueryReply } from './agentTools.js';

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
