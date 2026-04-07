const userData = {
  summaryPool: [
    "三座电站整体运行稳定，今日累计发电 94.7 MWh，较昨日提升 5.2%。",
    "今日收益预估 7.8 万元，主要增长来自松江新桥电站的出力恢复。",
    "当前无需要人工紧急介入的重大风险，建议按计划执行逆变器巡检。"
  ],
  kpis: [
    { label: "今日发电量", value: "94.7 MWh", trend: "+5.2% 较昨日", tone: "up" },
    { label: "今日收益", value: "7.8 万元", trend: "+3.4% 较昨日", tone: "up" },
    { label: "可用率", value: "98.6%", trend: "-0.2% 轻微波动", tone: "flat" },
    { label: "待处理告警", value: "2 条", trend: "-1 条 较昨日", tone: "down" }
  ],
  stationHealth: [
    { name: "浦东临港电站", status: "健康", detail: "逆变器在线率 100%，清洁度正常", score: 96 },
    { name: "嘉定南翔电站", status: "关注", detail: "午后出力低于理论值 6.3%", score: 82 },
    { name: "松江新桥电站", status: "健康", detail: "遮挡异常已处置，功率恢复", score: 93 }
  ],
  actions: [
    "建议在明日 09:00 安排嘉定南翔电站现场巡检。",
    "本周四前完成浦东临港电站逆变器 A2 复核。",
    "继续观察松江新桥电站未来 48 小时功率波动。"
  ],
  report: [
    "【本周运营周报】",
    "1. 总发电量：661.2 MWh，环比 +4.7%",
    "2. 收益表现：54.3 万元，环比 +3.9%",
    "3. 告警情况：严重告警 2 条，均已闭环",
    "4. 风险提示：嘉定南翔电站存在轻微出力偏差，建议现场排查",
    "5. 下周计划：清洗计划 + 逆变器专项巡检"
  ].join("\n")
};

const assistantSummary = document.getElementById("assistantSummary");
const kpiGrid = document.getElementById("kpiGrid");
const healthList = document.getElementById("healthList");
const actionList = document.getElementById("actionList");
const weeklyReport = document.getElementById("weeklyReport");
const reportTime = document.getElementById("reportTime");

function pickSummary() {
  const idx = Math.floor(Math.random() * userData.summaryPool.length);
  assistantSummary.classList.remove("lift-in");
  void assistantSummary.offsetWidth;
  assistantSummary.textContent = userData.summaryPool[idx];
  assistantSummary.classList.add("lift-in");
}

function renderKpis() {
  kpiGrid.innerHTML = userData.kpis
    .map(
      (item) => `
      <article class="panel kpi-item">
        <p class="muted">${item.label}</p>
        <h3>${item.value}</h3>
        <p class="kpi-trend ${item.tone}">${item.trend}</p>
      </article>
    `
    )
    .join("");
}

function renderHealth() {
  healthList.innerHTML = userData.stationHealth
    .map(
      (item) => `
      <div class="station-item">
        <div class="station-head">
          <strong>${item.name}</strong>
          <span class="status ${item.status === "健康" ? "good" : "warn"}">${item.status}</span>
        </div>
        <p class="muted">${item.detail}</p>
        <div class="meter">
          <span class="meter-fill" style="width:${item.score}%"></span>
        </div>
      </div>
    `
    )
    .join("");
}

function renderActions() {
  actionList.innerHTML = userData.actions
    .map(
      (item) => `
      <li>
        <span class="action-dot"></span>
        <span>${item}</span>
      </li>
    `
    )
    .join("");
}

function bindEvents() {
  document.getElementById("refreshSummary").addEventListener("click", pickSummary);
  document.getElementById("generateReport").addEventListener("click", () => {
    weeklyReport.textContent = "OpenClaw 正在汇总数据...";
    setTimeout(() => {
      weeklyReport.textContent = userData.report;
      reportTime.textContent = `最近生成时间：${new Date().toLocaleString("zh-CN", { hour12: false })}`;
    }, 700);
  });
}

function init() {
  pickSummary();
  renderKpis();
  renderHealth();
  renderActions();
  bindEvents();
}

init();
