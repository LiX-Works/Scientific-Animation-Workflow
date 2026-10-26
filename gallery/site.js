const translations = {
  navFilm: '影片', navProcess: '制作过程', navSource: '源码与文档',
  eyebrow: '科学解释 / 创作实践', title: 'AI 辅助的科学动画制作工作流',
  intro: '把科学概念变成动画解释。这里保存成片、可修改源码，以及连接二者的制作判断。',
  watch: '观看首部影片 ↗', readMethod: '了解工作流 →',
  step1: '厘清科学内容', step1p: '确定机制、受众和表达边界。',
  step2: '确定方向与审片', step2p: '形成视觉委托，检查具体画面和片段。',
  step3: '渲染与分享', step3p: '连接画面、声音与时间，保留修改入口。',
  caseLabel: '案例 01 / 器件物理', filmTitle: '电双层栅控',
  filmQuestion: '相同的沟道电荷变化。更低的栅压。为什么？',
  videoFallback: '浏览器不支持视频播放，请使用下方下载链接。',
  languageNote: '英文画面 · 可选英文字幕 · 配乐与音效（无旁白）',
  download: '下载 MP4 · 111.88 MB ↓',
  caseDescription: '从晶体管剖面进入三维器件和微观界面，再返回器件尺度，比较达到相同目标电荷所需的栅控电压。',
  caseScope: '解释性动画。几何、场线与粒子运动均为示意，不是器件数值仿真。',
  caseRead: '查看案例 ↗', caseRevisions: '了解迭代 ↗', caseRender: '重新生成 ↗',
  processLabel: '画面背后的选择', processTitle: '理解怎样形成这部作品',
  scienceTitle: '让比较有明确的物理含义',
  scienceText: '以相同的电荷变化为比较目标，区分较低外部栅压和弱局部电场，也区分栅极相关应力与源漏失效。',
  scienceLink: '科学范围 →', directionTitle: '把审片意见变成具体修改',
  directionText: '从具体问题入手：配色是否容易区分，结构是否遮挡，材质和阅读时间是否合适，镜头是否连续。每次修改都回应可观察的问题。',
  directionLink: '创作委托与审片 →', implementationTitle: '连接画面、声音与时间',
  implementationText: '本片使用时间驱动的 Three.js 场景、DOM 文字、事件驱动的声音合成和浏览器逐帧截图。源码与说明让结果能够继续修改。',
  implementationLink: '制作工作流 →', collectionLabel: '持续积累的案例',
  collectionTitle: '从一个案例开始，容纳更多科学问题。',
  collectionText: '后续作品可以解释不同科学原理、器件和应用。各案例保留自己的实现与制作记录，共用经验在实际制作中逐步积累。',
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
