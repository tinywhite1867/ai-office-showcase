const SERVICE_BASE =
  document.documentElement?.dataset?.serviceBase
  || `${window.location.protocol}//${window.location.hostname}:8787`;

const steps = [
  {
    nav: "资料库",
    title: "导入一份制度资料",
    copy: "先把制度文件解析成可学习、可追溯的资料包。",
    points: ["查看文件解析状态", "确认知识切片数量", "进入后续学习链路"]
  },
  {
    nav: "知识卡片",
    title: "从制度里切出一个知识点",
    copy: "系统把长文拆成完整考点，保留摘要、要点、易错点和来源依据。",
    points: ["不是句子碎片，而是可学习单元", "每张卡片绑定原文依据", "可直接进入题库生成"]
  },
  {
    nav: "题库答案",
    title: "生成并审查一批题库",
    copy: "AI 生成后不直接入库，而是经过引用、唯一性、评分点和去重检查。",
    points: ["题干要有业务场景", "答案不能外露", "质量标签直接显示"]
  },
  {
    nav: "模拟考试",
    title: "像真实用户一样做一道题",
    copy: "参会人员可以点选答案，立即看到解析和依据。",
    points: ["题库优先抽未作答题", "答完立即看标准答案", "错题可继续复盘"]
  },
  {
    nav: "AI 学习搭子",
    title: "听卡片总结，也能纯粹闲聊",
    copy: "听搭子讲会总结当前知识卡片；放松闲聊会切到陪伴模式，不强行拉回学习。",
    points: ["卡片讲解是总结复盘", "闲聊不绑定当前制度", "语音逐句生成，可停止播放"]
  },
  {
    nav: "学习报告",
    title: "把学习结果沉淀下来",
    copy: "资料、题库、作答、错题和复盘记录形成可持续复用的学习资产。",
    points: ["掌握度趋势", "错题复盘", "跨端同步和后续扩展"]
  }
];

const fallbackData = {
  counts: { documents: 1, chunks: 8, cards: 8, questions: 24, attempts: 3, mistakes: 2 },
  document: { title: "某集团制度学习资料（示例）.pdf", type: "pdf", parseStatus: "ready" },
  card: {
    topic: "第九条：推荐评选和命名表彰程序",
    summary: "推荐评选要先制定方案并按程序报批，再由基层自下而上民主推荐，经党组织审核、公示后进入命名表彰。",
    citation: "示意资料 · 第九条",
    keyPoints: ["制定方案并按程序报批", "基层民主推荐、党组织审核与公示", "命名表彰前要保留完整流程依据"],
    traps: ["只看推荐结果，忽略前置程序和公示留痕"]
  },
  question: {
    type: "single",
    stem: "遇到制度事项办理题时，应该优先判断哪一类条件？",
    options: ["A. 文件标题", "B. 主体、触发条件和处理结论", "C. 页码顺序", "D. 附件数量"],
    standardAnswer: "B",
    standardAnswerText: "应优先判断主体、触发条件和处理结论，再回到原文依据核对。",
    validationStatus: "passed",
    generationSource: "ai_gateway",
    qualityChecks: {
      citationBound: true,
      evidenceSupported: true,
      uniqueChoice: true,
      stemHasContext: true,
      rubricComplete: true,
      duplicateRisk: "low"
    }
  }
};

const els = {
  caseTitle: document.querySelector("#case-title"),
  caseDocs: document.querySelector("#case-docs"),
  caseCards: document.querySelector("#case-cards"),
  caseQuestions: document.querySelector("#case-questions"),
  caseMistakes: document.querySelector("#case-mistakes"),
  gallery: document.querySelector("#gallery-grid"),
  screen: document.querySelector("#screen-content"),
  guideTitle: document.querySelector("#guide-title"),
  guideCopy: document.querySelector("#guide-copy"),
  guidePoints: document.querySelector("#guide-points"),
  frameTitle: document.querySelector("#frame-title"),
  frameStatus: document.querySelector("#frame-status"),
  next: document.querySelector("#next-step"),
  prev: document.querySelector("#prev-step")
};

let activeStep = 0;
let demoData = fallbackData;
let activeAudio = null;
let activeAudioUrl = "";
let activeAudioUrls = [];
let activePlaybackResolve = null;
let voiceRunId = 0;
let voiceTimers = [];
let revealObserver = null;

const recordedVoiceAssets = {
  study: [
    "assets/audio/companion-study-1.mp3",
    "assets/audio/companion-study-2.mp3",
    "assets/audio/companion-study-3.mp3",
    "assets/audio/companion-study-4.mp3"
  ],
  chat: [
    "assets/audio/companion-chat-1.mp3",
    "assets/audio/companion-chat-2.mp3",
    "assets/audio/companion-chat-3.mp3",
    "assets/audio/companion-chat-4.mp3"
  ]
};

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanText(value = "", limit = 160) {
  return anonymizeText(String(value || ""))
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, limit);
}

const anonymizationRules = [
  [new RegExp("\\u676d\\u94a2\\u515a\\u53d1〔\\d{4}〕\\d+号", "g"), "某集团发〔示例〕XX号"],
  [new RegExp("\\u676d\\u94a2\\u53d1〔\\d{4}〕\\d+号", "g"), "某集团发〔示例〕XX号"],
  [new RegExp("\\u676d\\u5dde\\u94a2\\u94c1\\u96c6\\u56e2\\u6709\\u9650\\u516c\\u53f8", "g"), "某集团"],
  [new RegExp("\\u676d\\u94a2", "g"), "某集团"],
  [new RegExp("\\u5de5\\u4eba\\u5148\\u950b\\u53f7", "g"), "示例荣誉项目"],
  [new RegExp("\\u6d59\\u6c5f\\u7701", "g"), "省级"],
  [new RegExp("\\u4e2d\\u534e\\u4eba\\u6c11\\u5171\\u548c\\u56fd\\u5de5\\u4f1a\\u6cd5", "g"), "有关法律法规"],
  [/集团公司/g, "集团"],
  [/公司综合办公室/g, "综合办公室"]
];

function anonymizeText(value = "") {
  return anonymizationRules.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value || "")
  );
}

function demoDocumentTitle() {
  return "某集团制度学习资料（脱敏示例）.pdf";
}

function pointText(item = "") {
  const value = typeof item === "string"
    ? item
    : item?.point || item?.title || item?.text || item?.content || item?.summary || "";
  return cleanText(value, 76)
    .replace(/^(核心规则|规则拆解|关键词与记忆|记忆提示|易错点|考点)[:：]\s*/, "")
    .replace(/[。；;,.，、]+$/g, "");
}

function pickList(items = [], limit = 3) {
  return (Array.isArray(items) ? items : [])
    .map(pointText)
    .filter(Boolean)
    .slice(0, limit);
}

function showcaseEssayPrompt(card = {}) {
  const topic = cleanText(card.topic || fallbackData.card.topic, 38);
  return `某二级单位拟将一个班组作为年度示例荣誉项目推荐集体直接上报，材料中只有先进事迹和负责人签字，未见推荐评选通知、民主推荐记录、党组织审核意见和公示材料。请结合“${topic}”，论述综合办公室应如何判断该材料是否具备上报条件，并提出补正流程和留痕要求。`;
}

function firstQuestion(questions = [], card = {}, doc = {}) {
  return questions.find((item) => Array.isArray(item.options) && item.options.length && item.documentId === card.documentId)
    || questions.find((item) => Array.isArray(item.options) && item.options.length && item.documentId === doc.id)
    || questions.find((item) => Array.isArray(item.options) && item.options.length)
    || questions[0]
    || fallbackData.question;
}

function pickShowcaseCard(cards = [], doc = {}) {
  const preferred = cards.find((item) =>
    item.documentId === doc.id && /第九条|推荐评选和命名表彰程序/.test(`${item.topic || ""} ${item.summary || ""} ${item.fullText || ""}`)
  ) || cards.find((item) =>
    /第九条|推荐评选和命名表彰程序/.test(`${item.topic || ""} ${item.summary || ""} ${item.fullText || ""}`)
  );
  return preferred
    || cards.find((item) => item.documentId === doc.id && (item.topic || item.summary))
    || cards.find((item) => item.topic || item.summary)
    || fallbackData.card;
}

function normalizeState(rawState = {}) {
  const documents = Array.isArray(rawState.documents) ? rawState.documents : [];
  const cards = Array.isArray(rawState.cards) ? rawState.cards : [];
  const questions = Array.isArray(rawState.questions) ? rawState.questions : [];
  const doc = documents.find((item) => item.parseStatus === "ready") || documents[0] || fallbackData.document;
  const card = pickShowcaseCard(cards, doc);
  const question = firstQuestion(questions, card, doc);

  return {
    counts: {
      documents: documents.length || fallbackData.counts.documents,
      chunks: rawState.chunks?.length || fallbackData.counts.chunks,
      cards: cards.length || fallbackData.counts.cards,
      questions: questions.length || fallbackData.counts.questions,
      attempts: rawState.attempts?.length || fallbackData.counts.attempts,
      mistakes: rawState.mistakes?.length || fallbackData.counts.mistakes
    },
    document: {
      title: demoDocumentTitle(),
      type: doc.type || "pdf",
      parseStatus: doc.parseStatus || "ready"
    },
    card: {
      topic: cleanText(card.topic || fallbackData.card.topic, 42),
      summary: cleanText(card.summary || card.fullText || fallbackData.card.summary, 160),
      citation: cleanText(card.citation || fallbackData.card.citation, 76),
      keyPoints: pickList(card.keyPoints, 3).length
        ? pickList(card.keyPoints, 3)
        : pickList(card.learningPoints, 3).length
          ? pickList(card.learningPoints, 3)
          : fallbackData.card.keyPoints,
      traps: pickList(card.traps, 2).length ? pickList(card.traps, 2) : fallbackData.card.traps
    },
    question: {
      type: question.type || fallbackData.question.type,
      stem: cleanText(question.stem || fallbackData.question.stem, 220),
      options: Array.isArray(question.options) && question.options.length ? question.options.map((item) => cleanText(item, 150)) : fallbackData.question.options,
      standardAnswer: cleanText(question.standardAnswer || fallbackData.question.standardAnswer, 8).slice(0, 1).toUpperCase(),
      standardAnswerText: cleanText(question.standardAnswerText || question.standardAnswer || fallbackData.question.standardAnswerText, 260),
      validationStatus: question.validationStatus || "passed",
      generationSource: question.generationSource || "ai_gateway",
      qualityChecks: question.qualityChecks || fallbackData.question.qualityChecks
    }
  };
}

async function loadDemoData() {
  try {
    const response = await fetch(`${SERVICE_BASE}/api/sync-state?userId=demo-user`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    demoData = normalizeState(result.state || result.snapshot || result.data || result);
  } catch {
    demoData = fallbackData;
  }
  renderCaseSummary();
  renderGallery();
  renderStep(activeStep);
}

function renderCaseSummary() {
  const { counts, document } = demoData;
  els.caseTitle.textContent = document.title;
  els.caseDocs.textContent = counts.documents;
  els.caseCards.textContent = counts.cards;
  els.caseQuestions.textContent = counts.questions;
  els.caseMistakes.textContent = counts.mistakes;
}

function renderGallery() {
  if (!els.gallery) return;
  const { counts, document, card, question } = demoData;
  els.gallery.innerHTML = `
    <article class="interface-shot wide">
      <div class="shot-top"><span>资料库</span><b>解析完成</b></div>
      <div class="shot-body library-shot">
        <div class="mini-doc"><strong>PDF</strong><span>${escapeHtml(document.title)}</span></div>
        <div class="mini-metrics">
          <article><b>${counts.chunks}</b><span>知识切片</span></article>
          <article><b>${counts.cards}</b><span>知识卡片</span></article>
          <article><b>${counts.questions}</b><span>AI 题目</span></article>
        </div>
      </div>
    </article>
    <article class="interface-shot">
      <div class="shot-top"><span>知识卡片</span><b>可追溯</b></div>
      <div class="shot-body">
        <h3>${escapeHtml(card.topic)}</h3>
        <p>${escapeHtml(card.summary)}</p>
        <div class="shot-tags"><span>摘要</span><span>要点</span><span>依据</span></div>
      </div>
    </article>
    <article class="interface-shot">
      <div class="shot-top"><span>题库质量</span><b>场景论述</b></div>
      <div class="shot-body">
        <p class="shot-question">${escapeHtml(showcaseEssayPrompt(card))}</p>
        <div class="shot-tags"><span>案例情境</span><span>依据支撑</span><span>评分点完整</span></div>
      </div>
    </article>
    <article class="interface-shot">
      <div class="shot-top"><span>模拟做题</span><b>即时解析</b></div>
      <div class="shot-body answer-shot">
        <div class="mini-option selected">A. 示例选项</div>
        <div class="mini-option correct">B. 标准答案</div>
        <p>答题后直接看到依据与标准答案。</p>
      </div>
    </article>
    <article class="interface-shot">
      <div class="shot-top"><span>AI 学习搭子</span><b>实时语音</b></div>
      <div class="shot-body chat-shot">
        <div class="bubble user">帮我总结一下这张卡片。</div>
        <div class="bubble ai">先讲制度范围、核心规则和易错边界。</div>
        <div class="mini-wave"><i></i><i></i><i></i><i></i><i></i></div>
      </div>
    </article>
    <article class="interface-shot">
      <div class="shot-top"><span>学习报告</span><b>沉淀</b></div>
      <div class="shot-body report-shot">
        <div class="mini-ring"><strong>72%</strong></div>
        <p>作答、错题、复盘记录进入持续学习资产。</p>
      </div>
    </article>
  `;
  observeRevealTargets(els.gallery);
}

function observeRevealTargets(root = document) {
  const targets = root.querySelectorAll("[data-reveal], .interface-shot");
  if (!targets.length) return;
  if (!("IntersectionObserver" in window)) {
    targets.forEach((node) => node.classList.add("in-view"));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
  }
  targets.forEach((node) => revealObserver.observe(node));
}

function initParticleField() {
  const canvas = document.querySelector("#particle-field");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  const particles = [];
  const config = { count: 54, maxDistance: 150 };
  let width = 0;
  let height = 0;
  let ratio = 1;

  function resize() {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function seed() {
    particles.length = 0;
    for (let index = 0; index < config.count; index += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.4 + 0.6
      });
    }
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    for (let a = 0; a < particles.length; a += 1) {
      const particle = particles[a];
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < -20 || particle.x > width + 20) particle.vx *= -1;
      if (particle.y < -20 || particle.y > height + 20) particle.vy *= -1;

      context.beginPath();
      context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      context.fillStyle = "rgba(72, 198, 182, 0.48)";
      context.fill();

      for (let b = a + 1; b < particles.length; b += 1) {
        const other = particles[b];
        const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
        if (distance > config.maxDistance) continue;
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(other.x, other.y);
        context.strokeStyle = `rgba(72, 198, 182, ${0.13 * (1 - distance / config.maxDistance)})`;
        context.lineWidth = 1;
        context.stroke();
      }
    }
    requestAnimationFrame(draw);
  }

  resize();
  seed();
  draw();
  window.addEventListener("resize", () => {
    resize();
    seed();
  });
}

function setActiveNav(name) {
  document.querySelectorAll(".app-nav").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewName === name);
  });
}

function updateGuide() {
  const step = steps[activeStep];
  els.guideTitle.textContent = step.title;
  els.guideCopy.textContent = step.copy;
  els.guidePoints.innerHTML = step.points.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  els.frameTitle.textContent = `知衡 TestMind Pro · ${step.nav}`;
  els.frameStatus.textContent = `案例步骤 ${activeStep + 1} / ${steps.length}`;
  els.prev.disabled = activeStep === 0;
  els.next.textContent = activeStep === steps.length - 1 ? "回到第一步" : "下一步体验";
  setActiveNav(step.nav);
  document.querySelectorAll(".journey-step").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.step) === activeStep);
  });
}

function renderStep(index) {
  activeStep = (index + steps.length) % steps.length;
  stopVoice("已停止播放。");
  updateGuide();
  const renderers = [
    renderLibraryScreen,
    renderKnowledgeScreen,
    renderQuestionBankScreen,
    renderPracticeScreen,
    renderCompanionScreen,
    renderReportScreen
  ];
  els.screen.innerHTML = renderers[activeStep]();
  bindScreenInteractions();
}

function renderHead(kicker, title, copy, badge) {
  return `
    <div class="screen-head">
      <div>
        <span class="screen-kicker">${escapeHtml(kicker)}</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(copy)}</p>
      </div>
      <span class="screen-badge">${escapeHtml(badge)}</span>
    </div>
  `;
}

function renderLibraryScreen() {
  const { counts, document } = demoData;
  return `
    ${renderHead("资料库", "把一份制度资料放进系统", "演示从一份已导入资料开始，先看系统如何解析、切分和准备后续学习。", "解析完成")}
    <div class="screen-grid three">
      <section class="screen-card doc-preview">
        <div class="doc-cover"><b>PDF</b><span>${escapeHtml(document.title)}</span></div>
        <div>
          <h3>当前制度学习包</h3>
          <p>${escapeHtml(document.title)}</p>
          <div class="metric-row">
            <article><b>${counts.chunks}</b><span>知识切片</span></article>
            <article><b>${counts.cards}</b><span>知识卡片</span></article>
            <article><b>${counts.questions}</b><span>AI 题目</span></article>
          </div>
        </div>
      </section>
      <section class="screen-card">
        <h3>系统实际处理过程</h3>
        <div class="pipeline">
          <div class="pipe-item"><b>1</b><div><strong>识别文件</strong><small>PDF / Word / Excel / OCR 均可进入同一学习链路</small></div><em>完成</em></div>
          <div class="pipe-item"><b>2</b><div><strong>切分正文</strong><small>剔除噪声，保留条款、表格和来源位置</small></div><em>完成</em></div>
          <div class="pipe-item"><b>3</b><div><strong>准备生成</strong><small>把资料转为知识卡片和题库可用的结构</small></div><em>就绪</em></div>
        </div>
      </section>
    </div>
  `;
}

function renderKnowledgeScreen() {
  const { card } = demoData;
  return `
    ${renderHead("知识卡片", "长制度被切成一个可学习的知识点", "这一屏让参会者看到：系统不是把文件原样展示，而是把资料整理成可学习、可复盘的卡片。", "当前知识点")}
    <section class="screen-card knowledge-card-demo">
      <div class="source-pill-row">
        <span>来源：${escapeHtml(card.citation)}</span>
        <span>AI 整理</span>
        <span>可进入题库</span>
      </div>
      <div class="knowledge-main">
        <h3>${escapeHtml(card.topic)}</h3>
        <p>${escapeHtml(card.summary)}</p>
      </div>
      <div class="screen-grid">
        <div>
          <h3>学习要点</h3>
          <ul class="point-list">${card.keyPoints.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>
        <div>
          <h3>易错提醒</h3>
          <ul class="point-list">${card.traps.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>
      </div>
    </section>
  `;
}

function qualityTags(checks = {}) {
  const tags = [
    ["citationBound", "引用绑定"],
    ["evidenceSupported", "依据支撑"],
    ["uniqueChoice", "唯一答案"],
    ["stemHasContext", "题干有场景"],
    ["blankAnswerHidden", "答案不外露"],
    ["rubricComplete", "评分点完整"],
    ["substantiveQuestionValue", "非低价值"],
    ["tableQuestionSemanticComplete", "表格语义完整"]
  ];
  return tags.map(([key, label]) => `<span>${checks[key] === false ? "待复核" : "通过"} · ${label}</span>`).join("");
}

function renderQuestionBankScreen() {
  const { counts, question } = demoData;
  return `
    ${renderHead("题库答案", "AI 生成后先过质量门，再进入题库", "这一屏突出题库质量，而不是简单展示“能出题”。", `${counts.questions} 道题`)}
    <div class="screen-grid three">
      <section class="screen-card question-card-large">
        <span class="screen-kicker">${escapeHtml(question.type)} · ${escapeHtml(question.generationSource)}</span>
        <p class="question-stem">${escapeHtml(question.stem)}</p>
        <div class="option-list">
          ${question.options.map((item) => `<div class="option-static">${escapeHtml(item)}</div>`).join("")}
        </div>
      </section>
      <section class="screen-card">
        <h3>入库前质量门</h3>
        <div class="gate-grid">${qualityTags(question.qualityChecks)}</div>
        <div class="answer-panel">
          <strong>审题状态：${escapeHtml(question.validationStatus)}</strong><br />
          只有通过引用、证据、唯一性和去重检查的题，才进入正式训练。
        </div>
      </section>
    </div>
  `;
}

function renderPracticeScreen() {
  const { question } = demoData;
  return `
    ${renderHead("模拟考试", "点选一个答案，体验即时解析", "这不是静态截图，参会者可以像真实用户一样完成一次作答。", "可交互")}
    <section class="screen-card question-card-large">
      <p class="question-stem">${escapeHtml(question.stem)}</p>
      <div class="option-list" id="practice-options">
        ${question.options.map((item, index) => {
          const letter = String.fromCharCode(65 + index);
          return `<button class="option-button" type="button" data-answer="${letter}">${escapeHtml(item)}</button>`;
        }).join("")}
      </div>
      <div class="answer-panel" id="answer-panel" hidden></div>
    </section>
  `;
}

function companionTurns(mode = "study") {
  if (mode === "chat") {
    return [
      { role: "user", voiceRole: "miles", label: "我", voiceName: "用户声", text: "Emily，先不学习了，我有点累，想随便聊两句。" },
      { role: "ai", voiceRole: "emily", label: "E", voiceName: "Emily", text: "可以，先把学习放一边。你不用解释原因，我陪你缓一会儿。" },
      { role: "user", voiceRole: "miles", label: "我", voiceName: "用户声", text: "今天脑子转不动，有点烦，好像什么都学不进去。" },
      { role: "ai", voiceRole: "emily", label: "E", voiceName: "Emily", text: "那我们就不学东西。你先喝口水，眼睛离开屏幕十秒。等会儿想聊什么都行，哪怕只是吐槽今天也可以。" }
    ];
  }
  return [
    { role: "user", voiceRole: "miles", label: "我", voiceName: "用户声", text: "Emily，帮我讲一下当前这张卡片：“第九条：推荐评选和命名表彰程序”，先给我总结它在制度里讲什么。" },
    { role: "ai", voiceRole: "emily", label: "E", voiceName: "Emily", text: "好，这张卡片讲的是推荐评选不能直接跳到结果，必须先有方案、报批和通知，把评选范围、条件、程序说清楚。" },
    { role: "ai", voiceRole: "emily", label: "E", voiceName: "Emily", text: "第二步是基层推荐：要自下而上民主推荐，所在单位党组织审核，再把推荐集体公示。这样材料才有来源，也有责任链条。" },
    { role: "ai", voiceRole: "emily", label: "E", voiceName: "Emily", text: "容易错在只看先进事迹，忽略流程证据。遇到直接上报的材料，要先补齐通知、推荐记录、审核意见和公示留痕，再进入表彰程序。" }
  ];
}

function renderDialogue(turns) {
  return turns.map((turn, index) => `
    <article class="dialogue-line ${turn.role === "user" ? "user-line" : "ai-line"}${index === 1 ? " active" : ""}" data-turn-index="${index}">
      <span>${escapeHtml(turn.label)}</span>
      <div>
        <small>${escapeHtml(turn.voiceName || (turn.role === "user" ? "用户声" : "Emily"))}</small>
        <p>${escapeHtml(turn.text)}</p>
      </div>
    </article>
  `).join("");
}

function renderCompanionScreen() {
  const { card } = demoData;
  return `
    ${renderHead("AI 学习搭子", "听搭子讲，是总结当前卡片；闲聊，就是先放松", "展示与实际系统一致：听搭子讲会总结当前知识卡片，放松闲聊会切到陪伴模式，不强行拉回学习。", "总结 / 闲聊")}
    <div class="companion-layout">
      <section class="screen-card">
        <div class="source-pill-row">
          <span>当前知识点：${escapeHtml(card.topic)}</span>
          <span>Emily · 文静学姐</span>
        </div>
        <div class="dialogue-stack not-playing" id="voice-dialogue">
          ${renderDialogue(companionTurns("study"))}
        </div>
        <div class="audio-console">
          <div class="waveform" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>
          <div class="audio-actions">
            <button class="screen-button primary" type="button" data-voice-mode="study">听搭子讲</button>
            <button class="screen-button" type="button" data-voice-mode="chat">闲聊</button>
            <button class="screen-button" type="button" id="stop-voice">停止播放</button>
          </div>
          <p id="voice-status">选择“听搭子讲”或“闲聊”，点击即播放演示音频。</p>
        </div>
      </section>
      <section class="screen-card">
        <h3>这一步展示什么</h3>
        <div class="model-chain">
          <article><b>当前卡片总结</b><span>讲清这条制度内容、核心规则和易错边界。</span></article>
          <article><b>纯粹放松闲聊</b><span>不绑定当前卡片，不强行回到学习任务。</span></article>
          <article><b>预录双声播放</b><span>用户声和 Emily 已提前生成，现场点击后直接播放。</span></article>
        </div>
      </section>
    </div>
  `;
}

function renderReportScreen() {
  const { counts } = demoData;
  return `
    ${renderHead("学习报告", "最终沉淀为可复用的学习资产", "一次学习不是到做完题结束，而是把资料、考点、题库、错题和报告留在系统里。", "闭环完成")}
    <div class="report-grid">
      <section class="screen-card">
        <h3>综合掌握度</h3>
        <div class="progress-ring"><div><strong>72%</strong></div></div>
        <div class="metric-row">
          <article><b>${counts.attempts}</b><span>作答记录</span></article>
          <article><b>${counts.mistakes}</b><span>错题待复盘</span></article>
          <article><b>${counts.questions}</b><span>可练题库</span></article>
        </div>
      </section>
      <section class="screen-card">
        <h3>系统沉淀链路</h3>
        <div class="timeline">
          <article><b>1</b><div><span>资料可追溯</span><small>每个知识点保留来源依据。</small></div></article>
          <article><b>2</b><div><span>题目可复用</span><small>质量通过题进入正式题库。</small></div></article>
          <article><b>3</b><div><span>错题可强化</span><small>错因、评分点和搭子复盘进入下一轮学习。</small></div></article>
          <article><b>4</b><div><span>经验可沉淀</span><small>适合岗位培训、新人上手和制度学习。</small></div></article>
        </div>
      </section>
    </div>
  `;
}

function bindScreenInteractions() {
  document.querySelectorAll(".option-button").forEach((button) => {
    button.addEventListener("click", () => answerQuestion(button.dataset.answer));
  });
  document.querySelectorAll("[data-voice-mode]").forEach((button) => {
    button.addEventListener("click", () => playVoice(button.dataset.voiceMode, button));
  });
  document.querySelector("#stop-voice")?.addEventListener("click", () => stopVoice("已停止播放。"));
}

function answerQuestion(answer) {
  const { question } = demoData;
  document.querySelectorAll(".option-button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.answer === answer);
    button.classList.toggle("correct", button.dataset.answer === question.standardAnswer);
  });
  const panel = document.querySelector("#answer-panel");
  if (!panel) return;
  const correct = answer === question.standardAnswer;
  panel.hidden = false;
  panel.innerHTML = `
    <strong>${correct ? "答对了" : `这次选择了 ${escapeHtml(answer)}，标准答案是 ${escapeHtml(question.standardAnswer)}`}</strong><br />
    ${escapeHtml(question.standardAnswerText)}
  `;
}

function clearVoiceTimers() {
  voiceTimers.forEach((timer) => window.clearTimeout(timer));
  voiceTimers = [];
}

function setActiveTurn(index) {
  document.querySelectorAll("[data-turn-index]").forEach((line) => {
    line.classList.toggle("active", Number(line.dataset.turnIndex) === index);
  });
}

function scheduleTurns(turns) {
  clearVoiceTimers();
  let delay = 0;
  turns.forEach((turn, index) => {
    voiceTimers.push(window.setTimeout(() => setActiveTurn(index), delay));
    delay += turn.role === "ai" ? Math.max(2200, Math.min(6800, turn.text.length * 130)) : 900;
  });
}

function stopVoice(status = "") {
  voiceRunId += 1;
  clearVoiceTimers();
  if (activeAudio) activeAudio.pause();
  if (activePlaybackResolve) {
    const resolve = activePlaybackResolve;
    activePlaybackResolve = null;
    resolve();
  }
  activeAudio = null;
  if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
  activeAudioUrls.forEach((url) => URL.revokeObjectURL(url));
  activeAudioUrl = "";
  activeAudioUrls = [];
  document.querySelector("#voice-dialogue")?.classList.add("not-playing");
  document.querySelectorAll("[data-voice-mode]").forEach((button) => { button.disabled = false; });
  const statusNode = document.querySelector("#voice-status");
  if (statusNode && status) statusNode.textContent = status;
}

function decodeAudioBase64(audioBase64, mimeType = "audio/mpeg") {
  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

function buildVoiceInstruction(turn = {}, mode = "study") {
  if (turn.voiceRole === "miles") {
    return "这是一段双人学习对话中的用户提问。请用自然、年轻男性口吻，说得像真人在向学习搭子提问；语气可以有一点疑惑，不要播音腔，不要朗读腔。";
  }
  return mode === "chat"
    ? "你是 Emily，温柔学姐型学习搭子。请用自然聊天语气回应用户，有停顿和安抚感，不要像播稿。"
    : "你是 Emily，温柔但清晰的学习搭子。请像在一对一总结当前知识卡片，讲清制度内容、核心规则和易错边界，不要像讲题或机械朗读。";
}

async function synthesizeVoice(text, scene, turn = {}, mode = "study") {
  const companionRole = turn.voiceRole || (turn.role === "user" ? "miles" : "emily");
  const response = await fetch(`${SERVICE_BASE}/api/voice/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: cleanText(text, 900),
      scene,
      companionRole,
      responseFormat: "mp3",
      sampleRate: 24000,
      speedRatio: companionRole === "miles" ? 1.06 : (scene === "encourage" ? 1 : 1.03),
      instruction: buildVoiceInstruction({ ...turn, voiceRole: companionRole }, mode)
    })
  });
  const result = await response.json();
  if (!response.ok || result.ok === false || !result.audioBase64) throw new Error(result.error || `HTTP ${response.status}`);
  return decodeAudioBase64(result.audioBase64, result.mimeType || "audio/mpeg");
}

function playAudioUrl(url, runId) {
  return new Promise((resolve, reject) => {
    if (runId !== voiceRunId) {
      resolve();
      return;
    }
    const audio = new Audio(url);
    activeAudio = audio;
    let settled = false;
    const cleanup = () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      if (activeAudio === audio) activeAudio = null;
      if (activePlaybackResolve === finish) activePlaybackResolve = null;
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const onEnded = () => finish();
    const onError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("音频播放失败，请确认浏览器允许播放。"));
    };
    activePlaybackResolve = finish;
    audio.addEventListener("ended", onEnded, { once: true });
    audio.addEventListener("error", onError, { once: true });
    audio.play().catch((error) => {
      cleanup();
      reject(error);
    });
  });
}

function preloadRecordedVoices() {
  Object.values(recordedVoiceAssets).flat().forEach((src) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.load();
  });
}

function recordedVoiceQueue(mode = "study", turns = []) {
  const assets = recordedVoiceAssets[mode] || [];
  if (assets.length !== turns.length) return [];
  return turns.map((turn, index) => ({ ...turn, index, url: assets[index], recorded: true }));
}

async function playRecordedVoice(mode, turns, runId, status) {
  const queue = recordedVoiceQueue(mode, turns);
  if (!queue.length) return false;
  document.querySelector("#voice-dialogue")?.classList.remove("not-playing");
  if (status) status.textContent = mode === "chat" ? "正在播放预录闲聊对话..." : "正在播放预录卡片讲解...";
  for (const item of queue) {
    if (runId !== voiceRunId) return true;
    setActiveTurn(item.index);
    if (status) status.textContent = `正在播放：${item.voiceName || "对话"} · 第 ${item.index + 1}/${turns.length} 句`;
    await playAudioUrl(item.url, runId);
  }
  return true;
}

async function playVoice(mode, trigger) {
  const turns = companionTurns(mode);
  const dialogue = document.querySelector("#voice-dialogue");
  const status = document.querySelector("#voice-status");
  stopVoice();
  const runId = voiceRunId + 1;
  voiceRunId = runId;
  if (dialogue) dialogue.innerHTML = renderDialogue(turns);
  document.querySelectorAll("[data-voice-mode]").forEach((button) => { button.disabled = true; });
  if (trigger) trigger.disabled = true;
  if (status) status.textContent = "正在准备播放演示音频...";

  try {
    if (await playRecordedVoice(mode, turns, runId, status)) {
      if (runId === voiceRunId) stopVoice("预录演示音频播放完成，可以继续体验下一步。");
      return;
    }
  } catch (error) {
    if (status) status.textContent = "预录音频暂不可用，正在切换实时合成...";
  }

  try {
    if (status) status.textContent = `正在实时生成${mode === "chat" ? "闲聊双声对话" : "卡片总结语音"}...`;
    const scene = mode === "chat" ? "encourage" : "study_point_review";
    const audioQueue = [];
    for (let index = 0; index < turns.length; index += 1) {
      const turn = turns[index];
      if (runId !== voiceRunId) return;
      if (status) status.textContent = `正在生成第 ${index + 1}/${turns.length} 句：${turn.voiceName || (turn.role === "user" ? "用户声" : "Emily")}...`;
      const url = await synthesizeVoice(turn.text, scene, turn, mode);
      if (runId !== voiceRunId) {
        URL.revokeObjectURL(url);
        return;
      }
      activeAudioUrls.push(url);
      audioQueue.push({ ...turn, index, url });
    }
    dialogue?.classList.remove("not-playing");
    for (const item of audioQueue) {
      if (runId !== voiceRunId) return;
      setActiveTurn(item.index);
      if (status) status.textContent = `正在播放：${item.voiceName || "对话"} · 第 ${item.index + 1}/${turns.length} 句`;
      await playAudioUrl(item.url, runId);
    }
    if (runId === voiceRunId) stopVoice("双声对话播放完成，可以继续体验下一步。");
  } catch (error) {
    stopVoice(`实时语音生成失败：${error.message}`);
  }
}

document.querySelectorAll(".journey-step").forEach((button) => {
  button.addEventListener("click", () => renderStep(Number(button.dataset.step)));
});

els.next.addEventListener("click", () => renderStep(activeStep + 1));
els.prev.addEventListener("click", () => renderStep(Math.max(0, activeStep - 1)));

observeRevealTargets();
initParticleField();
preloadRecordedVoices();
loadDemoData();
