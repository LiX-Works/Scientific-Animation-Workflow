const translations = {
  navFilm: '影片', navProcess: '方法', navSource: '源码与文档',
  eyebrow: '器件物理 / AI 工具 / 代码驱动的影片', title: '讲清一个东西如何工作的短片',
  intro: '每部影片只讲一个机制，写明它主张什么、不主张什么，并探索一种制作技术。成片、源码和方法一起公开。',
  watch: '观看影片 ↗', readMethod: '了解工作流 →',
  step1: '机制与边界', step1p: '写清因果链，以及它成立的条件。',
  step2: '让画面承担论证', step2p: '每个特效都对应一件正在发生的事。',
  step3: '时间是唯一输入', step3p: '每一帧、每个声音节点都由时间算出，因此可以复现，也便于修改。',
  caseLabel: '案例 01 / 器件物理', filmTitle: '电双层栅控',
  filmQuestion: '相同的沟道电荷变化。更低的栅压。为什么？',
  videoFallback: '浏览器不支持视频播放，请使用下方下载链接。',
  languageNote: '英文画面 · 可选英文字幕 · 配乐与音效（无旁白）',
  download: '下载 MP4 · 111.88 MB ↓',
  caseDescription: '沿同一个器件，从晶体管剖面进入三维电解质界面再返回。固定目标电荷后，比较的就只有栅极耦合。',
  caseScope: '解释已有物理知识的动画。几何、场线与粒子运动均为示意。较低的外部电压仍可对应很强的局部电场。',
  caseRead: '阅读案例 ↗', caseLimits: '科学范围 ↗', caseRender: '重新生成 ↗',
  case2Label: '案例 02 / AI 工具', case2Title: 'MCP, Explained in Motion',
  case2Question: 'AI 模型只能写文字，它怎么操作一个程序？',
  case2Language: '英文字幕 · ElevenLabs AI 配音 · 使用 Claude Code 和 Remotion 制作',
  case2Download: '下载高清版 · 143.13 MB ↓',
  case2Description: '跟着一次请求，从程序窗口穿过它的几层再回来。模型始终碰不到软件：它只读文字、写文字。控制来自程序自身的接口，MCP 把这些接口包装成工具。',
  case2Scope: '解释性影片。分层是示意，工具名、论文和报错都是举例。协议步骤已对照 MCP 2026-07-28 版规范核对。',
  case2Method: '制作方法 ↗', case2Limits: '准确性与局限 ↗',
  processLabel: '影片背后', processTitle: '画面背后的理由',
  scienceTitle: '让比较有明确的物理含义',
  scienceText: '以相同的电荷变化为比较目标，区分较低外部栅压和弱局部电场，也区分栅极相关应力与源漏失效。',
  scienceLink: '科学范围 →', directionTitle: '把机制和标准分开',
  directionText: '控制来自程序自身的接口和包在外面的代码，MCP 统一的是这种能力的提供方式。影片先展示分层，等循环讲清楚后，再说标准的价值。',
  directionLink: 'MCP 是什么，不是什么 →', implementationTitle: '画面和声音共用一个时钟',
  implementationText: 'EDL 影片用映射到播放时间的故事时间轴。MCP 影片用 AI 配音的逐词时间戳，改一句旁白，后面的节点全部跟着移动。两者的画面和声音都读同一组事件。',
  implementationLink: '共用工作流 →', collectionLabel: '持续积累的案例',
  collectionTitle: '目前两个案例，还能容纳更多问题。',
  collectionText: '各案例保留自己的实现和边界。后续影片可以探索其他原理、器件和工具，每部各有一种技术。',
  collectionLink: '案例结构 →',
  credit: 'Scientific Animation Workflow contributors · 代码：MIT · 原创媒体与文字：CC BY 4.0',
  creditsLink: '来源与署名'
};

const elements = [...document.querySelectorAll('[data-i18n]')];
const english = new Map(elements.map(el => [el, el.innerHTML]));
const player = document.querySelector('#film-player');
const button = document.querySelector('#language');
let language = 'en';
let release;

function updateReleaseLabels() {
  if (!release) return;
  const video = release.video;
  const minutes = Math.floor(video.duration_seconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(video.duration_seconds % 60).toString().padStart(2, '0');
  document.querySelector('#film-meta').textContent = `${minutes}:${seconds} · ${video.height}p · ${video.fps} fps`;
  const download = document.querySelector('.download');
  download.href = `media/${encodeURIComponent(video.filename)}`;
  download.download = video.filename;
  const size = (video.bytes / 1_000_000).toFixed(2);
  download.textContent = `${language === 'en' ? 'Download MP4' : '下载 MP4'} · ${size} MB ↓`;
}

button.addEventListener('click', () => {
  language = language === 'en' ? 'zh' : 'en';
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  for (const el of elements) {
    if (language === 'en') el.innerHTML = english.get(el);
    else el.textContent = translations[el.dataset.i18n] || el.textContent;
  }
  button.textContent = language === 'en' ? '中文' : 'EN';
  button.setAttribute('aria-label', language === 'en' ? 'Switch language to Chinese' : '切换到英文');
  document.querySelector('nav').setAttribute('aria-label', language === 'en' ? 'Main navigation' : '主导航');
  updateReleaseLabels();
  // Interface language and the viewer's caption choice are independent.
});

// release.json is shared with the release workflow and the staging tool.
fetch('../films/edl-gating/release.json')
  .then(response => {
    if (!response.ok) throw new Error(`Release metadata: HTTP ${response.status}`);
    return response.json();
  })
  .then(metadata => {
    release = metadata;
    const source = player.querySelector('source');
    const path = `media/${encodeURIComponent(release.video.filename)}`;
    if (source.getAttribute('src') !== path) {
      source.src = path;
      player.load();
    }
    updateReleaseLabels();
  })
  .catch(error => console.warn('Using the release information embedded in the page.', error));
