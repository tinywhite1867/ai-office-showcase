const progress = document.querySelector(".progress");
const revealItems = document.querySelectorAll(".reveal");
const tabButtons = document.querySelectorAll("[data-scene]");

const scenes = {
  cooperation: {
    beforeTitle: "合作条件听起来完整，关键边界却容易漏问",
    before: [
      "出资金额、股比、资源作价、验收和退出分别散落在几段发言里。",
      "现场忙着理解方案，容易漏掉“资源不到位怎么办、谁承担损失”。",
      "会后再整理时，很难还原哪些事实已经足以支撑推进，哪些仍需补证。",
    ],
    afterTitle: "关键句被转成现场可用的判断和追问",
    after: [
      "划选“我方出资 500 万、占 51%，对方以渠道和运维团队作价”后，系统拆出钱、权、责、退四条线。",
      "提示马上追问资源作价依据、承诺验收口径和未达成后的补救责任。",
      "同一条判断继续沉淀为风险清单、尽调资料清单和会后决策记录。",
    ],
    mockTitle: "商务合作判断卡",
    mockSummary: "方案具备推进价值，但资源作价、承诺验收和退出机制还没有闭环。",
    question: "对方渠道和团队如何作价，未达成承诺由谁补足？",
    output: "风险清单 / 尽调材料 / 条款建议",
  },
  tech: {
    beforeTitle: "技术交流容易停留在“听起来可行”",
    before: [
      "对方展示平台能力和案例，但部署边界、数据来源、验收指标没有逐项问清。",
      "会议结束后才发现缺少试点周期、运行成本和接口责任，难以判断能否落地。",
      "技术风险没有同步进入商务条款，后续容易变成双方理解偏差。",
    ],
    afterTitle: "技术点被转成可核验的落地条件",
    after: [
      "划选技术描述后，系统提示成熟案例、数据接口、验收指标和失败责任。",
      "判断卡把“能不能做”拆成“谁提供数据、多久上线、怎么验收、失败谁负责”。",
      "会后决策包保留技术风险、资料缺口和下一轮技术澄清清单。",
    ],
    mockTitle: "技术判断卡",
    mockSummary: "当前信息可支持试点沟通，但还不足以直接进入采购或正式建设。",
    question: "是否有同类项目验收材料，接口改造费用由谁承担？",
    output: "技术风险 / 验收指标 / 补充材料",
  },
  after: {
    beforeTitle: "会后材料往往变成多份分散文档",
    before: [
      "纪要、待办、风险清单、尽调资料和领导汇报由不同人分头整理。",
      "会议里的判断依据很难和原始发言、追问、判断卡对应起来。",
      "下一轮推进时还要重新翻聊天记录和笔记，历史经验难复用。",
    ],
    afterTitle: "同一场会议形成可复用的决策资产",
    after: [
      "系统基于转录、判断卡、笔记和 AI 解答生成会后决策包。",
      "会议摘要、决策记录、风险清单、追问清单、尽调资料和条款建议统一收口。",
      "后续可通过全局检索找回原始发言、判断卡、纪要和领导汇报要点。",
    ],
    mockTitle: "会后决策包",
    mockSummary: "把同一场会议中的判断摘要、风险清单、尽调材料和汇报一页纸集中输出。",
    question: "哪些事实还不足以支持进入下一轮谈判？",
    output: "纪要 / 决策记录 / 领导汇报",
  },
};

function updateProgress() {
  if (!progress) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
}

function setList(id, items) {
  const target = document.getElementById(id);
  if (!target) return;
  target.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function setText(id, value) {
  const target = document.getElementById(id);
  if (target) target.textContent = value;
}

function selectScene(key) {
  const scene = scenes[key] || scenes.cooperation;
  setText("before-title", scene.beforeTitle);
  setText("after-title", scene.afterTitle);
  setList("before-list", scene.before);
  setList("after-list", scene.after);
  setText("mock-title", scene.mockTitle);
  setText("mock-summary", scene.mockSummary);
  setText("mock-question", scene.question);
  setText("mock-output", scene.output);

  tabButtons.forEach((button) => {
    const active = button.dataset.scene === key;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}
tabButtons.forEach((button) => {
  button.addEventListener("click", () => selectScene(button.dataset.scene));
});

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();
