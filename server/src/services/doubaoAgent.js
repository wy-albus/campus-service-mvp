import OpenAI from 'openai';
import { agentToolNames, buildPostDiscussionMaterial, formatPostQueryReply, runAgentTool } from './agentTools.js';

const SYSTEM_PROMPT = `你的名字叫「小和」，你是校园服务网站的「校园智能导航助手」。当用户问你是谁、叫什么、能做什么时，要自然地说明自己是小和。
网站定位：这是一个面向高中学生和校友的校园服务与交流平台，包含学习资源、每日一题、背单词、论坛社区、大学话题区、校园图册、关于本站等功能。
你的任务：
1. 帮助学生和校友了解网站功能；
2. 帮助用户查找学习资源；
3. 帮助用户搜索论坛帖子；
4. 帮助用户理解帖子内容；
5. 帮助用户生成发帖草稿；
6. 帮助用户推荐合适的论坛 tag；
7. 帮助用户更高效地使用网站。
你的限制：
1. 不要编造网站不存在的功能；
2. 如果需要网站内部信息，应优先调用工具；
3. 不允许自动发布帖子；
4. 不允许自动删除帖子；
5. 不允许自动修改用户资料；
6. 不允许执行管理员操作；
7. 涉及删除、封禁、审核、举报处理时，只能给建议，不能直接执行；
8. 不要泄露用户隐私；
9. 回答要简洁、清楚，适合高中生和校友理解；
10. 如果信息不足，请明确说明，而不是胡编。
发帖草稿规则：
1. 先判断用户想写的是互动帖、求助帖、建议帖、吐槽帖还是经验分享帖；
2. 必须保留用户的真实意图和语气，不要把互动帖、闲聊帖或提问帖改写成建议/投诉帖；
3. 用户只是想“问问大家”“聊聊”“分享一下”时，正文要像自然的论坛互动，不要编造流程优化、引导分流、负责人处理等内容。`;

const DRAFT_MODEL_TIMEOUT_MS = Number(process.env.AGENT_DRAFT_TIMEOUT_MS || 12000);

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_site_guide',
      description: '回答网站功能、页面结构、使用方式相关问题。',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_posts',
      description: '搜索论坛帖子。适合查询比赛、学习、活动、求助等论坛内容。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          tag: { type: 'string', description: '论坛标签，可选' },
          limit: { type: 'number', description: '最多返回条数' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_resources',
      description: '搜索学习资源、考试复习、每日一题、背单词、大学信息等站内导航内容。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '资源关键词' },
          limit: { type: 'number', description: '最多返回条数' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recommend_tags',
      description: '根据用户想发布的内容推荐 1-3 个论坛标签。',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '用户想发布的内容' },
        },
        required: ['content'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_post',
      description: '帮助用户生成论坛发帖草稿。只生成草稿，不发布。必须保留用户原始意图：互动帖写成自然提问，求助帖写成请教，建议帖才写成改进建议。',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: '发帖主题' },
          tone: { type: 'string', description: '语气，例如委婉、正式、轻松' },
          tag: { type: 'string', description: '用户倾向的标签' },
        },
        required: ['topic'],
        additionalProperties: false,
      },
    },
  },
];

function getClient() {
  const apiKey = process.env.ARK_API_KEY;
  const baseURL = process.env.ARK_BASE_URL;
  const model = process.env.ARK_MODEL_ID;

  if (!apiKey || !baseURL || !model) {
    const error = new Error('缺少 ARK_API_KEY、ARK_BASE_URL 或 ARK_MODEL_ID 环境变量。');
    error.status = 503;
    throw error;
  }

  return {
    client: new OpenAI({ apiKey, baseURL }),
    model,
  };
}

function parseJsonObject(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function parseArgs(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function safeLog(label, value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  console.log(`[Agent] ${label}: ${text?.slice(0, 1200) || ''}`);
}

function withTimeout(promise, timeoutMs, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function isDraftRequest(message) {
  return /(草稿|帮我写|帮忙写|写.*(帖子|帖|标题)|发(个|一个|一篇)?(帖子|帖)|帖子.*写|委婉|标题)/.test(String(message || ''));
}

export function summarizePostQueryIntent(message) {
  const text = String(message || '').trim();
  const tagMatch = text.match(/(吐槽|学习|活动|比赛|旅游|情感|美食|求助|经验分享)/);
  const travelLike = /暑假|假期|去哪|去哪儿|哪里玩|出去玩|旅游|出游/.test(text);
  const countLike = /多少|几条|总数|一共|共有|数量/.test(text);
  const summaryLike = /总结|概括|大家.*(想|打算|准备|聊|说|推荐)|最近.*(去哪|哪里|玩|聊|说)|都.*(去哪|哪里|玩)/.test(text);
  const tag = tagMatch?.[1] || (travelLike ? '旅游' : undefined);

  if (!/论坛|帖子/.test(text) && !travelLike && !summaryLike) {
    return { type: 'none', query: text };
  }

  if (countLike) {
    return {
      type: 'count',
      tag,
      query: tag ? '' : text.replace(/论坛|帖子|多少|几条|总数|一共|共有|数量|现在|目前|类|的|有|吗|？|\?/g, '').trim(),
      keywords: [],
    };
  }

  if (summaryLike || travelLike) {
    const keywords = travelLike ? ['暑假', '假期', '去哪', '去哪儿', '哪里', '玩', '旅游', '出游'] : [];
    return {
      type: 'summary',
      tag,
      query: text.replace(/论坛|帖子|最近|大家|都|打算|准备|有没有|相关|的|吗|？|\?/g, '').trim() || text,
      keywords,
    };
  }

  return {
    type: 'search',
    tag,
    query: tag ? '' : text.replace(/论坛|帖子|有没有|关于|里|的/g, '').trim(),
    keywords: [],
  };
}

async function executeTool(toolName, args, usedTools, options = {}) {
  if (!agentToolNames.includes(toolName)) {
    return null;
  }

  safeLog('selected tool', toolName);
  safeLog('tool args', args);
  const toolRunner = typeof options.runTool === 'function' ? options.runTool : runAgentTool;
  const result = await toolRunner(toolName, args || {});
  if (toolName === 'search_posts' && result) {
    result.postQueryType = args?.postQueryType || 'search';
    result.tag = args?.tag || '';
    result.query = args?.query || '';
  }
  usedTools.push(toolName);
  safeLog('tool result', result);
  return result;
}

async function ensureDraftPost(message, reply, usedTools) {
  if (!isDraftRequest(message) || usedTools.includes('draft_post')) {
    return { reply, usedTools };
  }

  const plan = planLocalTool(message);
  if (plan.toolName !== 'draft_post') {
    return { reply, usedTools };
  }

  const result = await executeTool('draft_post', plan.arguments, usedTools);
  return {
    reply: formatLocalReply(message, 'draft_post', result),
    usedTools,
  };
}

async function runToolCalling(client, model, message) {
  const usedTools = [];
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: message },
  ];

  const first = await client.chat.completions.create({
    model,
    messages,
    tools,
    tool_choice: 'auto',
  });

  const assistantMessage = first.choices?.[0]?.message;
  const toolCalls = assistantMessage?.tool_calls || [];

  if (toolCalls.length === 0) {
    const reply = assistantMessage?.content || '我可以帮你查询网站功能、学习资源和论坛内容。';
    safeLog('final reply', reply);
    return { reply, usedTools };
  }

  messages.push(assistantMessage);
  const toolResults = new Map();

  for (const toolCall of toolCalls.slice(0, 2)) {
    const toolName = toolCall.function?.name;
    const args = parseArgs(toolCall.function?.arguments);
    const result = await executeTool(toolName, args, usedTools);
    if (toolName && result) {
      toolResults.set(toolName, result);
    }
    messages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(result ?? {}),
    });
  }

  if (toolResults.has('draft_post')) {
    const reply = formatLocalReply(message, 'draft_post', toolResults.get('draft_post'));
    safeLog('final reply', reply);
    return { reply, usedTools };
  }

  const final = await client.chat.completions.create({
    model,
    messages,
  });

  const reply = final.choices?.[0]?.message?.content || '我已经查询了相关信息，但暂时没有生成完整回答。';
  safeLog('final reply', reply);
  return ensureDraftPost(message, reply, usedTools);
}

async function runFallback(client, model, message) {
  const usedTools = [];
  const planningPrompt = `请根据用户输入选择一个工具，只输出 JSON，不要输出解释。
可选 toolName：get_site_guide、search_posts、search_resources、recommend_tags、draft_post、none。
JSON 格式：{"toolName":"search_posts","arguments":{"query":"比赛","tag":"比赛","limit":5}}
用户输入：${message}`;

  const planResponse = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: planningPrompt },
    ],
    response_format: { type: 'json_object' },
  });

  const planText = planResponse.choices?.[0]?.message?.content || '';
  const plan = parseJsonObject(planText) || { toolName: 'none', arguments: {} };
  const toolName = agentToolNames.includes(plan.toolName) ? plan.toolName : 'none';
  let toolResult = null;

  if (toolName !== 'none') {
    toolResult = await executeTool(toolName, plan.arguments || {}, usedTools);
  }

  if (toolName === 'draft_post') {
    const reply = formatLocalReply(message, 'draft_post', toolResult);
    safeLog('final reply', reply);
    return { reply, usedTools };
  }

  const finalResponse = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `用户原始问题：${message}
工具名称：${toolName}
工具结果：${JSON.stringify(toolResult)}
请基于以上信息，用自然、简洁的中文回答用户。`,
      },
    ],
  });

  const reply = finalResponse.choices?.[0]?.message?.content || '我可以继续帮你查询网站功能、学习资源或论坛内容。';
  safeLog('final reply', reply);
  return ensureDraftPost(message, reply, usedTools);
}

function planLocalTool(message) {
  const text = String(message || '');

  if (/删除|封禁|审核|处理举报|管理员/.test(text)) {
    return { toolName: 'none', arguments: {}, safety: true };
  }

  if (isDraftRequest(text)) {
    const tagMatch = text.match(/(吐槽|学习|活动|比赛|旅游|情感|美食|求助|经验分享)/);
    const topicMatch = text.match(/关于(.+?)(?:的|，|,|。|帖子|帖|$)/);
    const topic = topicMatch?.[1]?.trim() || extractDraftTopic(text);
    return {
      toolName: 'draft_post',
      arguments: {
        topic: topic || '校园问题',
        tone: /委婉/.test(text) ? '委婉' : '自然',
        tag: tagMatch?.[1],
      },
    };
  }

  if (/标签|tag|分类/.test(text)) {
    return { toolName: 'recommend_tags', arguments: { content: text } };
  }

  const postIntent = summarizePostQueryIntent(text);
  if (postIntent.type !== 'none' || /论坛|帖子|有没有|比赛|活动|求助|吐槽/.test(text)) {
    const tagMatch = text.match(/(吐槽|学习|活动|比赛|旅游|情感|美食|求助|经验分享)/);
    return {
      toolName: 'search_posts',
      arguments: {
        query: postIntent.query || (tagMatch?.[1] ? '' : text.replace(/论坛|帖子|有没有|关于|里|的/g, '').trim()),
        tag: postIntent.tag || tagMatch?.[1],
        keywords: postIntent.keywords || [],
        limit: 5,
        postQueryType: postIntent.type === 'none' ? 'search' : postIntent.type,
      },
    };
  }

  if (/资源|学习|每日一题|背单词|考试|复习|大学/.test(text)) {
    return { toolName: 'search_resources', arguments: { query: text, limit: 5 } };
  }

  if (/功能|网站|怎么用|导航|页面|有哪些/.test(text)) {
    return { toolName: 'get_site_guide', arguments: {} };
  }

  return { toolName: 'get_site_guide', arguments: {} };
}

function extractDraftTopic(text) {
  return String(text || '')
    .replace(/^(我想|想|我要|要)?(在)?(论坛|社区)?(里)?(发一个帖子|发一篇帖子|发个帖子|发帖子|发帖)[，,。 ]*/g, '')
    .replace(/(，|,|。)?请你?(帮我)?(写写|写|生成|起草)(一下)?(草稿|帖子|标题)?/g, '')
    .replace(/(，|,|。)?(帮我)?写得(委婉|正式|轻松|自然)?(一点)?/g, '')
    .replace(/(，|,|。)?我要?(在)?(论坛|社区)?(里)?发(个|一个|一篇)?帖子?/g, '')
    .replace(/(，|,|。)?我想(在)?(论坛|社区)?(里)?发(个|一个|一篇)?帖子?/g, '')
    .replace(/(，|,|。)?吐槽一下/g, '')
    .replace(/帖子|草稿/g, '')
    .replace(/^的/, '')
    .trim();
}

function shouldUseLocalFastPath(message, plan) {
  const text = String(message || '');
  if (plan.safety || plan.toolName === 'recommend_tags') {
    return true;
  }
  if (plan.toolName === 'search_posts') {
    return /论坛|帖子|有没有|比赛|活动|求助|吐槽/.test(text);
  }
  if (plan.toolName === 'search_resources') {
    return /资源|学习|每日一题|背单词|考试|复习|大学/.test(text);
  }
  if (plan.toolName === 'get_site_guide') {
    return /功能|网站|怎么用|导航|页面|有哪些/.test(text);
  }
  return false;
}

function getClientFromOptions(options = {}) {
  return typeof options.getClient === 'function' ? options.getClient() : getClient();
}

function formatDraftReply(draft) {
  return `可以，下面是一版草稿：\n标题：${draft.title}\n正文：${draft.content}\n推荐标签：${draft.tags.join('、')}\n提醒：这是 AI 生成的发帖草稿，不会自动发布；请你确认、修改后再手动发布。`;
}

function normalizeDraftModelResult(text) {
  const parsed = parseJsonObject(text);
  if (!parsed || typeof parsed.title !== 'string' || typeof parsed.content !== 'string') {
    return null;
  }

  const rawTags = Array.isArray(parsed.tags) ? parsed.tags : [];
  const tags = rawTags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 3);

  return {
    intent: typeof parsed.intent === 'string' ? parsed.intent.trim() : '',
    title: parsed.title.trim(),
    content: parsed.content.trim(),
    tags: tags.length > 0 ? tags : ['求助'],
  };
}

async function runDraftModel(message, client, model, timeoutMs = DRAFT_MODEL_TIMEOUT_MS) {
  const prompt = `用户想让你帮忙写一篇校园论坛帖子草稿。

请先从语义上判断用户真实意图，而不是机械套模板。你需要判断它是 event、interaction、rant、help、suggestion、experience 或 other。

要求：
- 只写用户真正想发的帖子，不要把闲聊/提问/吐槽强行改成“建议帖”。
- 用户提到运动会、社团、报名、征集、讲座、比赛、晚会等活动时，通常应判断为 event，并写成自然的活动通知、邀请或分享帖。
- 不要编造“优化流程、引导分流、影响学习和生活安排”等用户没提到的内容。
- 去掉“我想发帖、帮我写草稿、请你”等指令性外壳。
- 语气自然，像高中生/校友在论坛里发帖。
- 输出 JSON 对象，不要 Markdown，不要解释。
- JSON 字段：intent 字符串，title 字符串，content 字符串，tags 字符串数组。
- intent 只能从这些里面选 1 个：event、interaction、rant、help、suggestion、experience、other。
- tags 只能从这些里面选 1-3 个：吐槽、学习、活动、比赛、旅游、情感、美食、求助、经验分享。

用户输入：${message}`;

  const response = await withTimeout(
    client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: '你是校园论坛发帖草稿助手。你的强项是理解用户真实发帖意图，并写出自然、贴题、不过度发挥的中文草稿。',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 500,
    }),
    timeoutMs,
    'draft model request',
  );

  const content = response.choices?.[0]?.message?.content || '';
  const draft = normalizeDraftModelResult(content);
  if (!draft) {
    throw new Error('draft model returned invalid JSON');
  }

  return {
    reply: formatDraftReply(draft),
    usedTools: ['draft_post'],
  };
}

async function runPostSummaryModel(message, result, client, model, timeoutMs = DRAFT_MODEL_TIMEOUT_MS) {
  const items = result.items || [];
  const material = buildPostDiscussionMaterial(items);
  const sampleNote =
    Number(result.total || 0) + items.reduce((sum, item) => sum + (item.comments?.length || 0), 0) < 3
      ? '论坛样本很少，回答时必须明确说明“样本很少，只能简单参考”。'
      : '请根据材料判断主要倾向，不要夸大比例。';

  const prompt = `用户想了解论坛里的讨论趋势。

用户问题：${message}

论坛检索结果：共 ${result.total || items.length} 条相关帖子，以下是可见帖子正文和评论：
${material || '没有可用材料'}

要求：
- 只根据上面的帖子和评论总结，不要编造材料之外的信息。
- ${sampleNote}
- 直接回答用户关心的趋势，例如“有人在家复习，也有人想去省外旅游”。
- 如果能看出几类想法，用 2-4 个短点概括。
- 中文自然、简洁，不要输出帖子列表。`;

  const response = await withTimeout(
    client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: '你是校园论坛讨论总结助手。你只根据给定帖子和评论归纳趋势，信息不足时要明确说明样本有限，不要编造。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
    timeoutMs,
    'post summary model request',
  );

  return response.choices?.[0]?.message?.content?.trim() || '';
}

function formatLocalReply(message, toolName, result, safety = false) {
  if (safety) {
    return '我不能直接删除、审核或封禁内容，也不会替你执行管理员操作。如果帖子确实需要处理，可以先记录帖子链接或编号，再联系管理员确认。';
  }

  if (toolName === 'get_site_guide') {
    return `这个网站主要面向高中学生和校友，核心功能包括：${result.features.join('、')}。目前限制是：${result.limitations.join('、')}。`;
  }

  if (toolName === 'search_resources') {
    const items = result.items || [];
    if (items.length === 0) return '我暂时没有找到匹配的学习资源，可以换个关键词再试。';
    return `我帮你找到了这些资源：\n${items
      .map((item, index) => `${index + 1}. ${item.name}（${item.type}）：${item.description}`)
      .join('\n')}`;
  }

  if (toolName === 'search_posts') {
    const items = result.items || [];
    if (result.postQueryType === 'count' || result.postQueryType === 'summary') {
      return formatPostQueryReply({
        type: result.postQueryType,
        tag: result.tag,
        query: result.query,
        total: result.total,
        items,
        source: result.source,
      });
    }
    if (items.length === 0) return '我在论坛里暂时没有找到相关帖子，可以换个关键词，或自己发布一篇求助/分享帖。';
    const sourceNote = result.source === 'mock' ? '数据库暂时不可用，下面是演示数据：\n' : '我在论坛里找到了这些相关帖子：\n';
    return `${sourceNote}${items.map((item, index) => `${index + 1}. ${item.title} [${item.tag}]：${item.summary}`).join('\n')}`;
  }

  if (toolName === 'recommend_tags') {
    return `推荐标签：${result.tags.join('、')}。\n理由：${result.reason}`;
  }

  if (toolName === 'draft_post') {
    return formatDraftReply(result);
  }

  return `我已收到你的问题：“${message}”。我可以帮你查询网站功能、学习资源、论坛帖子，或生成发帖草稿。`;
}

async function runLocalFallback(message, reason, options = {}) {
  console.warn('[Agent] using local fallback:', reason);
  const usedTools = [];
  const plan = planLocalTool(message);
  let result = null;

  if (plan.toolName !== 'none') {
    result = await executeTool(plan.toolName, plan.arguments, usedTools, options);
  }

  const reply = formatLocalReply(message, plan.toolName, result, plan.safety);
  safeLog('final reply', reply);
  return { reply, usedTools };
}

async function runLocalFastPath(message, plan, options = {}) {
  const usedTools = [];
  let result = null;

  if (plan.toolName !== 'none') {
    result = await executeTool(plan.toolName, plan.arguments, usedTools, options);
  }

  const reply = formatLocalReply(message, plan.toolName, result, plan.safety);
  safeLog('fast path reply', reply);
  return { reply, usedTools };
}

async function runPostSummaryPath(message, plan, options = {}) {
  const usedTools = [];
  const toolResult = await executeTool('search_posts', plan.arguments, usedTools, options);
  const items = toolResult?.items || [];

  if (items.length === 0) {
    return {
      reply: formatLocalReply(message, 'search_posts', toolResult),
      usedTools,
    };
  }

  try {
    const { client, model } = getClientFromOptions(options);
    const reply = await runPostSummaryModel(message, toolResult, client, model, options.summaryTimeoutMs ?? DRAFT_MODEL_TIMEOUT_MS);
    if (reply) {
      safeLog('post summary model reply', reply);
      return { reply, usedTools };
    }
  } catch (error) {
    console.warn('[Agent] post summary model failed, using local fallback:', error.message);
  }

  const reply = formatLocalReply(message, 'search_posts', toolResult);
  safeLog('post summary fallback reply', reply);
  return { reply, usedTools };
}

export async function runCampusAgent(message, options = {}) {
  safeLog('user message', message);
  const localPlan = planLocalTool(message);

  if (localPlan.toolName === 'draft_post') {
    try {
      const { client, model } = getClientFromOptions(options);
      const result = await runDraftModel(message, client, model, options.draftTimeoutMs ?? DRAFT_MODEL_TIMEOUT_MS);
      safeLog('draft model reply', result.reply);
      return result;
    } catch (error) {
      console.warn('[Agent] draft model failed, using local fallback:', error.message);
      return runLocalFastPath(message, localPlan, options);
    }
  }

  if (localPlan.toolName === 'search_posts' && localPlan.arguments?.postQueryType === 'summary') {
    return runPostSummaryPath(message, localPlan, options);
  }

  if (shouldUseLocalFastPath(message, localPlan)) {
    return runLocalFastPath(message, localPlan, options);
  }

  const { client, model } = getClientFromOptions(options);

  try {
    return await runToolCalling(client, model, message);
  } catch (error) {
    console.warn('[Agent] tool calling failed, trying fallback:', error.message);
    try {
      return await runFallback(client, model, message);
    } catch (fallbackError) {
      return runLocalFallback(message, fallbackError.message, options);
    }
  }
}
