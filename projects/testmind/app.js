const scenarios = [
  {
    title: "制度学习准备",
    before: [
      "人工翻找制度原文，先判断哪一版、哪一章、哪一条可用。",
      "条款、附件和表格混在一起，新人需要依赖熟悉制度的同事解释。",
      "学习材料往往停留在原文摘录，难形成可复习的知识单元。"
    ],
    after: [
      "导入资料后先进入校对和入库，系统按完整条款整理考点。",
      "知识卡片直接呈现核心规则、易错边界、理解案例和原文引用。",
      "学习者先看知识点，再进入同考点练题，路径更清楚。"
    ]
  },
  {
    title: "考试培训出题",
    before: [
      "人工命题耗时，题目容易只问概念或“意义是什么”。",
      "选择、填空、简答、论述题型覆盖不均，难保证引用依据。",
      "题目重复、答案不唯一、表格题考不到关键字段关系。"
    ],
    after: [
      "正式题目由服务端真实 AI 生成，围绕具体条款、条件、组成和边界。",
      "审题模型检查引用、答案唯一性、题干场景和重复风险。",
      "题型不足时触发备用模型补位，保留质量标签便于复核。"
    ]
  },
  {
    title: "错题复盘巩固",
    before: [
      "错题只留下对错结果，难回到原文知识点。",
      "复盘依赖个人自觉，容易直接刷下一题，薄弱点没有补齐。",
      "主观题扣分原因不够结构化，难知道应该怎么改写。"
    ],
    after: [
      "答错后先回看知识点，显示标准答案、缺失点、错误表述和引用依据。",
      "同题型巩固和跨题型强化复用智能补题链路，优先未作答题。",
      "学习报告沉淀错题、掌握度和阶段检查，方便持续改进。"
    ]
  },
  {
    title: "移动端接续学习",
    before: [
      "电脑端整理资料，手机端难继续学习和复盘。",
      "拍照资料、刷题记录、错题状态容易分散在不同设备。",
      "语音学习和文字学习割裂，碎片时间利用率不高。"
    ],
    after: [
      "本机同步服务把资料、题库、作答、错题和进度同步到小程序。",
      "小程序支持拍照导入、卡片学习、刷题、题库答案、学习报告和复盘状态回写。",
      "Miles / Emily 学习搭子提供文字和语音陪学，播放可停止，Key 不进入小程序。"
    ]
  }
];

const scenarioCard = document.querySelector("#scenario-card");
const scenarioButtons = [...document.querySelectorAll("[data-scenario]")];

function renderScenario(index = 0) {
  const scenario = scenarios[index] || scenarios[0];
  scenarioCard.innerHTML = `
    <article class="scenario-pane before">
      <h3>${scenario.title} · 使用前</h3>
      <ul>${scenario.before.map((item) => `<li>${item}</li>`).join("")}</ul>
    </article>
    <article class="scenario-pane after">
      <h3>${scenario.title} · 使用后</h3>
      <ul>${scenario.after.map((item) => `<li>${item}</li>`).join("")}</ul>
    </article>
  `;
  scenarioButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.scenario) === index);
  });
}

scenarioButtons.forEach((button) => {
  button.addEventListener("click", () => renderScenario(Number(button.dataset.scenario || 0)));
});

renderScenario(0);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("in-view");
  });
}, { threshold: 0.16 });

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const navLinks = [...document.querySelectorAll(".page-nav a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const navObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
  });
}, {
  threshold: [0.22, 0.38, 0.54],
  rootMargin: "-80px 0px -45% 0px"
});

sections.forEach((section) => navObserver.observe(section));

const nodes = [...document.querySelectorAll(".node")];
let activeNodeIndex = 0;

setInterval(() => {
  if (!nodes.length) return;
  nodes[activeNodeIndex]?.classList.remove("is-active");
  activeNodeIndex = (activeNodeIndex + 1) % nodes.length;
  nodes[activeNodeIndex]?.classList.add("is-active");
}, 1400);
