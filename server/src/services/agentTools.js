import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../db.js';

const POST_SEARCH_LIMIT = 8;

const allowedTags = ['吐槽', '学习', '活动', '比赛', '旅游', '情感', '美食', '求助', '经验分享'];

const mockPosts = [
  {
    id: 'mock-1',
    title: '运动会视频剪辑征集',
    tag: '活动',
    content: '欢迎大家投稿运动会精彩瞬间，可以用于后续活动回顾。',
    comments: ['可以剪开幕式和接力赛，素材会比较丰富。'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    title: '高三复习资料整理',
    tag: '学习',
    content: '这里整理了一些数学和英语复习资料，适合日常复习。',
    comments: ['数学资料很有用，适合假期在家复习。'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    title: '校园比赛经验分享',
    tag: '比赛',
    content: '分享一些参加校园比赛、准备材料和组队的经验。',
    comments: ['组队最好提前找好分工。'],
    createdAt: new Date().toISOString(),
  },
];

const builtInResources = [
  {
    name: '每日一题',
    type: '学习',
    description: '从题库中查看练习题，帮助学生进行日常复习。',
    url: '/',
  },
  {
    name: '背单词',
    type: '英语',
    description: '基于词库进行单词记忆训练。',
    url: '/',
  },
  {
    name: '国家智慧教育平台',
    type: '外部资源',
    description: '提供国家级公开学习资源入口。',
    url: 'https://www.smartedu.cn/',
  },
  {
    name: '考试复习资料',
    type: '学习',
    description: '查看考试安排、复习资料入口和备考相关内容。',
    url: '/',
  },
  {
    name: '大学信息',
    type: '升学',
    description: '帮助学生了解大学话题区、专业选择和校园经验。',
    url: '/',
  },
];

function clampLimit(limit, fallback = 5, max = 10) {
  const value = Number(limit);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value), 1), max);
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function makeSummary(content, maxLength = 90) {
  const text = String(content || '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function scoreText(item, query) {
  if (!query) return 1;
  const haystack = normalizeText(
    [item.name, item.title, item.type, item.category, item.description, item.content, ...(item.tags || [])].join(' '),
  );
  return haystack.includes(normalizeText(query)) ? 1 : 0;
}

async function readJsonFile(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  const raw = await fs.readFile(fullPath, 'utf8');
  return JSON.parse(raw);
}

async function loadStaticResources() {
  const resources = [];

  try {
    const resourceItems = await readJsonFile('src/data/resources.json');
    for (const item of resourceItems) {
      resources.push({
        name: item.title,
        type: item.category || '学习资源',
        description: item.description || '',
        url: item.url || '/',
        tags: item.tags || [],
      });
    }
  } catch {
    // Static frontend data is optional for the agent; built-ins cover the local demo.
  }

  try {
    const examItems = await readJsonFile('src/data/exams.json');
    for (const item of examItems) {
      resources.push({
        name: item.name,
        type: '考试安排',
        description: item.notice || item.origin || '考试安排与复习提醒。',
        url: '/',
        tags: ['考试', '复习'],
      });
    }
  } catch {
    // Same optional-data handling as above.
  }

  try {
    const universityItems = await readJsonFile('src/data/universities.json');
    for (const item of universityItems) {
      resources.push({
        name: item.name,
        type: '大学信息',
        description: item.description || `${item.city || ''}大学话题区。`,
        url: '/',
        tags: item.highlights || ['大学'],
      });
    }
  } catch {
    // Same optional-data handling as above.
  }

  return [...builtInResources, ...resources];
}

export async function getSiteGuide() {
  return {
    siteName: '校园服务网站',
    description: '面向高中学生与校友的校园服务与交流平台。',
    features: ['学习资源', '每日一题', '背单词', '论坛社区', '大学话题区', '校园图册', '关于本站'],
    limitations: ['暂不支持私信', '暂不支持关注好友', '暂不支持 AI 自动发布帖子', '暂不支持 AI 自动删除或审核帖子'],
  };
}

export async function searchPosts(args = {}) {
  const query = String(args.query || '').trim();
  const tag = String(args.tag || '').trim();
  const limit = clampLimit(args.limit, 5, POST_SEARCH_LIMIT);
  const keywords = Array.isArray(args.keywords) ? args.keywords.map((item) => String(item).trim()).filter(Boolean) : [];
  const searchTerms = keywords.length > 0 ? keywords : query ? [query] : [];

  try {
    const where = {
      isDeleted: false,
      ...(tag ? { tag } : {}),
      ...(searchTerms.length > 0
        ? {
            OR: searchTerms.flatMap((term) => [
              { title: { contains: term, mode: 'insensitive' } },
              { content: { contains: term, mode: 'insensitive' } },
              { tag: { contains: term, mode: 'insensitive' } },
            ]),
          }
        : {}),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          tag: true,
          createdAt: true,
          comments: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'asc' },
            take: 8,
            select: {
              content: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      source: 'database',
      total,
      items: posts.map((post) => ({
        id: post.id,
        title: post.title,
        tag: post.tag,
        content: post.content,
        summary: makeSummary(post.content),
        comments: post.comments.map((comment) => makeSummary(comment.content, 120)),
        createdAt: post.createdAt,
      })),
    };
  } catch (error) {
    console.warn('[Agent] search_posts database fallback:', error.message);
    const filtered = mockPosts
      .filter((post) => (!tag || post.tag === tag) && (searchTerms.length === 0 || searchTerms.some((term) => scoreText(post, term))))
      .slice(0, limit)
      .map((post) => ({
        id: post.id,
        title: post.title,
        tag: post.tag,
        content: post.content,
        summary: makeSummary(post.content),
        comments: (post.comments || []).map((comment) => makeSummary(comment, 120)),
        createdAt: post.createdAt,
      }));

    return {
      source: 'mock',
      note: '数据库暂时不可用，以下为演示数据。',
      total: filtered.length,
      items: filtered,
    };
  }
}

export function buildPostDiscussionMaterial(items = []) {
  return items
    .map((item, index) => {
      const comments = item.comments?.length ? item.comments.map((comment, commentIndex) => `  评论 ${commentIndex + 1}：${comment}`).join('\n') : '  暂无评论';
      return [`帖子 ${index + 1}：${item.title}`, `标签：${item.tag || '未分类'}`, `正文：${item.content || item.summary || ''}`, comments].join('\n');
    })
    .join('\n\n');
}

export function formatPostQueryReply(result = {}) {
  const total = Number(result.total || 0);
  const items = result.items || [];
  const scope = result.tag ? `${result.tag}类帖子` : result.query ? `和“${result.query}”相关的帖子` : '帖子';

  if (result.type === 'count') {
    return `论坛里目前有 ${total} 条${scope}。`;
  }

  if (items.length === 0) {
    return `我在论坛里暂时没有找到${scope}，可以换个关键词，或自己发布一篇求助/分享帖。`;
  }

  const list = items.map((item, index) => `${index + 1}. ${item.title} [${item.tag}]：${item.summary}`).join('\n');
  return `我在论坛里找到 ${total} 条${scope}。大致总结：大家主要在聊这些方向，可以点进帖子继续看细节。\n${list}`;
}

export async function searchResources(args = {}) {
  const query = String(args.query || '').trim();
  const limit = clampLimit(args.limit, 5, 10);
  const resources = await loadStaticResources();
  const matches = resources.filter((item) => scoreText(item, query)).slice(0, limit);
  const items = matches.length > 0 ? matches : resources.slice(0, limit);

  return {
    items: items.map((item) => ({
      name: item.name,
      type: item.type,
      description: item.description,
      url: item.url || '/',
    })),
  };
}

export async function recommendTags(args = {}) {
  const content = String(args.content || args.query || '').toLowerCase();
  const matches = [];

  const rules = [
    ['美食', ['食堂', '吃饭', '饭菜', '菜', '难吃', '窗口', '排队', '午餐', '晚餐']],
    ['吐槽', ['太慢', '不满', '吐槽', '难吃', '不好吃', '崩溃', '难受', '压力', '累', '烦', '离谱', '无语', '建议', '问题', '体验']],
    ['求助', ['求助', '怎么办', '请问', '帮我', '需要']],
    ['学习', ['学习', '复习', '作业', '考试', '资料', '题']],
    ['比赛', ['比赛', '竞赛', '组队', '报名', '获奖']],
    ['活动', ['活动', '运动会', '社团', '征集', '报名', '假期', '暑假']],
    ['旅游', ['旅游', '出行', '路线', '景点', '出去玩', '去哪', '去哪儿', '玩']],
    ['情感', ['情感', '心情', '压力', '朋友', '同学关系']],
    ['经验分享', ['经验', '分享', '方法', '攻略']],
  ];

  for (const [tag, keywords] of rules) {
    if (keywords.some((keyword) => content.includes(keyword))) {
      matches.push(tag);
    }
  }

  const tags = [...new Set(matches.filter((tag) => allowedTags.includes(tag)))].slice(0, 3);
  const finalTags = tags.length > 0 ? tags : ['求助'];

  return {
    tags: finalTags,
    reason: `内容和${finalTags.join('、')}相关，因此推荐这些标签。`,
  };
}

function getDraftIntent(topic, tone, tag) {
  const text = `${topic} ${tone} ${tag}`;
  if (/吐槽|难吃|不好吃|太慢|不满|崩溃|难受|压力|焦虑|累|烦|离谱|无语|不爽|破防/.test(text)) {
    return 'rant';
  }
  if (/问问|大家.*(怎么|有没有|准备|打算)|怎么过|安排|计划|聊聊|分享/.test(text)) {
    return 'interaction';
  }
  if (/运动会|社团|活动|报名|招募|征集|比赛|竞赛|志愿者|讲座|晚会|演出/.test(text)) {
    return 'event';
  }
  if (/求助|怎么办|请问|有没有人知道|帮忙/.test(text)) {
    return 'help';
  }
  return 'suggestion';
}

function cleanTopic(topic) {
  return topic
    .replace(/^(我想|想)?(在)?(论坛|社区)?(里)?(发帖|发一个帖子|发一篇帖子)[，,。 ]*/g, '')
    .replace(/^(我想|想|我要|要)?(在)?(论坛|社区)?(里)?(发帖子|发个帖子)[，,。 ]*/g, '')
    .replace(/^(请你)?帮我(写|写写|生成|起草)(一个|一篇|个|篇)?(关于|有关)?/g, '')
    .replace(/^(写|写写|生成|起草)(一个|一篇|个|篇)?(关于|有关)?/g, '')
    .replace(/(，|,|。)?请你?(帮我)?(写写|写|生成|起草)(一下)?(草稿|帖子|标题)?/g, '')
    .replace(/(，|,|。)?我要?(在)?(论坛|社区)?(里)?发(个|一个|一篇)?帖子?/g, '')
    .replace(/(，|,|。)?吐槽一下/g, '')
    .replace(/^(在)?(论坛|社区)(里)?[，,。 ]*/g, '')
    .replace(/^(想)?问问大家/, '')
    .replace(/^(关于|有关)/, '')
    .replace(/(的一点建议|的建议|帖子|发帖|草稿)$/g, '')
    .replace(/的$/, '')
    .trim();
}

function makeInteractionTitle(subject) {
  if (/暑假.*(去哪|去哪儿|哪里|玩)/.test(subject)) return '大家暑假都打算去哪儿玩？';
  if (/假期.*(怎么过|如何度过|安排|计划)/.test(subject)) return '大家假期都准备怎么过？';
  return subject.endsWith('吗') || subject.endsWith('？') ? subject : `${subject}？`;
}

function cleanRantSubject(subject) {
  return String(subject || '')
    .replace(/^这次的?/, '')
    .replace(/[，,。 ]*好?崩溃了?$/g, '')
    .replace(/[，,。 ]*真的?崩溃了?$/g, '')
    .trim();
}

function makeRantDraft(subject) {
  const coreSubject = cleanRantSubject(subject) || subject;

  if (/食堂|饭菜|菜|窗口|吃饭/.test(subject)) {
    return {
      title: subject.includes('食堂') ? '想吐槽一下食堂的菜' : `想吐槽一下：${subject}`,
      content: `最近真的有点想吐槽${subject}。不知道大家有没有类似感受，也欢迎在评论里说说具体是哪道菜、哪个窗口或者哪次体验比较明显。希望后面能越做越好。`,
    };
  }

  if (/考试|模拟考|模考|作业|复习|成绩|题/.test(subject)) {
    return {
      title: `想吐槽一下：${coreSubject}`,
      content: `这次${coreSubject}真的有点难到崩溃。不知道大家是不是也有类似感受，欢迎一起聊聊哪部分最难、怎么调整心态，或者有没有什么复盘方法。`,
    };
  }

  return {
    title: `想吐槽一下：${subject}`,
    content: `最近真的有点想吐槽${subject}。不知道大家有没有类似感受，欢迎在评论里一起聊聊具体情况，也可以互相支支招。`,
  };
}

export async function draftPost(args = {}) {
  const topic = String(args.topic || args.content || '校园问题').trim();
  const tone = String(args.tone || '委婉').trim();
  const tag = String(args.tag || '').trim();
  const intent = getDraftIntent(topic, tone, tag);
  const subject = cleanTopic(topic) || topic;
  const recommended = await recommendTags({ content: `${subject} ${tag}` });
  const tags = tag && allowedTags.includes(tag) ? [tag, ...recommended.tags.filter((item) => item !== tag)].slice(0, 3) : recommended.tags;

  if (intent === 'interaction') {
    return {
      title: makeInteractionTitle(subject),
      content: `想问问大家${subject}。有人已经安排好了吗？欢迎在评论里分享一下，也可以互相推荐好玩的地方、活动或者实用安排。`,
      tags,
      note: '这是 AI 生成的发帖草稿，不会自动发布；请你确认、修改后再手动发布。',
    };
  }

  if (intent === 'rant') {
    const draft = makeRantDraft(subject);
    return {
      title: draft.title,
      content: draft.content,
      tags,
      note: '这是 AI 生成的发帖草稿，不会自动发布；请你确认、修改后再手动发布。',
    };
  }

  if (intent === 'help') {
    return {
      title: `想请教一下：${subject}`,
      content: `想向大家请教一下${subject}。如果有同学了解相关经验、注意事项或解决办法，欢迎分享一下，先谢谢大家。`,
      tags,
      note: '这是 AI 生成的发帖草稿，不会自动发布；请你确认、修改后再手动发布。',
    };
  }

  if (intent === 'event') {
    return {
      title: `${subject}活动帖`,
      content: `想和大家分享一下${subject}相关的活动信息。对这个活动感兴趣的同学可以一起关注、报名或到现场加油，也欢迎在评论里补充时间安排、参与方式和注意事项。`,
      tags,
      note: '这是 AI 生成的发帖草稿，不会自动发布；请你确认、修改后再手动发布。',
    };
  }

  return {
    title: `关于${subject}的一点建议`,
    content:
      tone.includes('直接') || tone.includes('强硬')
        ? `最近关于${subject}的问题比较影响大家的体验，希望相关同学或负责老师可以关注并尽快优化。也欢迎大家补充具体情况，一起把问题说清楚。`
        : `最近我注意到${subject}可能会影响一些同学的学习和生活安排。想委婉地提个建议：如果后续能适当优化流程、增加提醒或引导分流，大家的体验应该会更顺畅。也欢迎有类似感受的同学一起补充。`,
    tags,
    note: '这是 AI 生成的发帖草稿，不会自动发布；请你确认、修改后再手动发布。',
  };
}

export async function runAgentTool(toolName, args) {
  switch (toolName) {
    case 'get_site_guide':
      return getSiteGuide(args);
    case 'search_posts':
      return searchPosts(args);
    case 'search_resources':
      return searchResources(args);
    case 'recommend_tags':
      return recommendTags(args);
    case 'draft_post':
      return draftPost(args);
    default:
      return null;
  }
}

export const agentToolNames = ['get_site_guide', 'search_posts', 'search_resources', 'recommend_tags', 'draft_post'];
