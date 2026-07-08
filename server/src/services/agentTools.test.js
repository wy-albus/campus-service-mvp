import test from 'node:test';
import assert from 'node:assert/strict';
import { draftPost } from './agentTools.js';

test('draftPost keeps a casual holiday question as an interaction post', async () => {
  const result = await draftPost({
    topic: '问问大家假期怎么过',
    tone: '自然',
  });

  assert.match(result.title, /假期/);
  assert.doesNotMatch(result.title, /建议/);
  assert.match(result.content, /大家|同学/);
  assert.match(result.content, /怎么过|安排|计划/);
  assert.doesNotMatch(result.content, /优化流程|引导分流|提醒/);
});

test('draftPost removes posting command words before drafting an interaction post', async () => {
  const result = await draftPost({
    topic: '我想发帖，问问大家假期怎么过',
    tone: '自然',
  });

  assert.equal(result.title, '大家假期都准备怎么过？');
  assert.doesNotMatch(result.content, /我想发帖/);
  assert.doesNotMatch(result.content, /优化流程|引导分流/);
});

test('draftPost removes forum posting command words from interaction posts', async () => {
  const result = await draftPost({
    topic: '我想在论坛发帖，问问大家假期打算如何度过',
    tone: '自然',
  });

  assert.equal(result.title, '大家假期都准备怎么过？');
  assert.doesNotMatch(result.content, /我想|论坛|发帖/);
  assert.doesNotMatch(result.content, /优化流程|引导分流|影响.*学习和生活/);
});

test('draftPost writes event posts as activity invitations instead of suggestions', async () => {
  const result = await draftPost({
    topic: '帮我写一个运动会的帖子',
    tone: '自然',
  });

  assert.match(result.title, /运动会/);
  assert.match(result.content, /运动会/);
  assert.match(result.content, /参加|报名|分享|加油|活动/);
  assert.ok(result.tags.includes('活动'));
  assert.ok(!result.tags.includes('求助'));
  assert.doesNotMatch(result.title, /建议|帮我写/);
  assert.doesNotMatch(result.content, /优化流程|引导分流|学习和生活安排|帮我写/);
});
