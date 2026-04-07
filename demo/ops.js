const opsData = {
  kpis: [
    { label: "当前并网功率", value: "14.3 MW", trend: "+4.1%" },
    { label: "严重告警", value: "1 条", trend: "-1 条" },
    { label: "待处理工单", value: "3 个", trend: "持平" },
    { label: "预测风险项", value: "3 项", trend: "+1 项" }
  ],
  energy: [
    { day: "周一", actual: 84, expected: 88 },
    { day: "周二", actual: 90, expected: 92 },
    { day: "周三", actual: 87, expected: 91 },
    { day: "周四", actual: 95, expected: 94 },
    { day: "周五", actual: 92, expected: 96 },
    { day: "周六", actual: 89, expected: 93 },
    { day: "周日", actual: 97, expected: 98 }
  ],
  alarms: [
    {
      time: "09:20",
      station: "嘉定南翔电站",
      level: "warning",
      message: "组串 3 电流波动异常",
      status: "待现场确认"
    },
    {
      time: "08:52",
      station: "浦东临港电站",
      level: "critical",
      message: "逆变器 A2 温度过高",
      status: "处理中"
    },
    {
      time: "08:36",
      station: "松江新桥电站",
      level: "info",
      message: "发电效率低于预测 4.1%",
      status: "已记录"
    }
  ],
  predicts: [
    "浦东临港电站 14:00-16:00 可能出现逆变器过温风险（概率 72%）。",
    "嘉定南翔电站在大风时段有轻微波动风险（概率 58%）。",
    "松江新桥电站晚间云层变化可能引发短时功率回落（概率 41%）。"
  ],
  trend: [
    { time: "08:00", value: 5.2 },
    { time: "09:00", value: 8.4 },
    { time: "10:00", value: 10.8 },
    { time: "11:00", value: 13.1 },
    { time: "12:00", value: 14.5 },
    { time: "13:00", value: 14.1 },
    { time: "14:00", value: 13.2 },
    { time: "15:00", value: 11.6 },
    { time: "16:00", value: 9.3 }
  ]
};

const opsKpiGrid = document.getElementById("opsKpiGrid");
const energyChart = document.getElementById("energyChart");
const lineChart = document.getElementById("lineChart");
const alarmTable = document.getElementById("alarmTable");
const predictList = document.getElementById("predictList");
const opsLog = document.getElementById("opsLog");

function renderOpsKpis() {
  opsKpiGrid.innerHTML = opsData.kpis
    .map(
      (item) => `
      <article class="panel kpi-item ops-kpi">
        <p class="muted">${item.label}</p>
        <h3>${item.value}</h3>
        <p class="ops-trend">${item.trend}</p>
      </article>
    `
    )
    .join("");
}

function renderBarChart() {
  const maxValue = Math.max(...opsData.energy.map((item) => Math.max(item.actual, item.expected)));
  energyChart.innerHTML = opsData.energy
    .map((item) => {
      const actualHeight = Math.round((item.actual / maxValue) * 100);
      const expectedHeight = Math.round((item.expected / maxValue) * 100);
      return `
        <div class="bar-group">
          <div class="bars">
            <span class="bar expected" style="height:${expectedHeight}%" title="理论 ${item.expected}"></span>
            <span class="bar actual" style="height:${actualHeight}%" title="实际 ${item.actual}"></span>
          </div>
          <p>${item.day}</p>
        </div>
      `;
    })
    .join("");
}

function renderLineChart() {
  const width = 560;
  const height = 220;
  const paddingX = 28;
  const paddingY = 20;
  const maxValue = Math.max(...opsData.trend.map((item) => item.value));
  const minValue = Math.min(...opsData.trend.map((item) => item.value));
  const span = maxValue - minValue || 1;
  const stepX = (width - paddingX * 2) / (opsData.trend.length - 1);

  const points = opsData.trend
    .map((item, index) => {
      const x = paddingX + stepX * index;
      const y = height - paddingY - ((item.value - minValue) / span) * (height - paddingY * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const labels = opsData.trend
    .map(
      (item, index) => `<span style="left:${(index / (opsData.trend.length - 1)) * 100}%">${item.time}</span>`
    )
    .join("");

  const dots = opsData.trend
    .map((item, index) => {
      const x = paddingX + stepX * index;
      const y = height - paddingY - ((item.value - minValue) / span) * (height - paddingY * 2);
      return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.4"></circle>`;
    })
    .join("");

  lineChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="line-chart" preserveAspectRatio="none" aria-label="功率趋势折线图">
      <g class="grid-lines">
        <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}"></line>
        <line x1="${paddingX}" y1="${height * 0.65}" x2="${width - paddingX}" y2="${height * 0.65}"></line>
        <line x1="${paddingX}" y1="${height * 0.42}" x2="${width - paddingX}" y2="${height * 0.42}"></line>
        <line x1="${paddingX}" y1="${paddingY}" x2="${width - paddingX}" y2="${paddingY}"></line>
      </g>
      <polyline class="line-area" points="${points} ${width - paddingX},${height - paddingY} ${paddingX},${height - paddingY}"></polyline>
      <polyline class="line-path" points="${points}"></polyline>
      <g class="line-dots">${dots}</g>
    </svg>
    <div class="line-labels">${labels}</div>
  `;
}

function levelText(level) {
  if (level === "critical") return "严重";
  if (level === "warning") return "一般";
  return "提示";
}

function renderAlarms() {
  alarmTable.innerHTML = opsData.alarms
    .map(
      (item) => `
      <tr>
        <td>${item.time}</td>
        <td>${item.station}</td>
        <td><span class="tag ${item.level}">${levelText(item.level)}</span></td>
        <td>${item.message}</td>
        <td>${item.status}</td>
      </tr>
    `
    )
    .join("");
}

function renderPredicts() {
  predictList.innerHTML = opsData.predicts.map((item) => `<li>${item}</li>`).join("");
}

function appendLog(text) {
  const p = document.createElement("p");
  p.textContent = `[${new Date().toLocaleTimeString("zh-CN", { hour12: false })}] ${text}`;
  opsLog.prepend(p);
}

function bindEvents() {
  document.getElementById("simulateOps").addEventListener("click", () => {
    appendLog("收到告警：逆变器 A2 温度过高（严重）。");
    setTimeout(() => appendLog("规则引擎判定：触发自动派单并通知值班工程师。"), 450);
    setTimeout(() => appendLog("OpenClaw 生成处置建议并同步给客户经理。"), 900);
    setTimeout(() => appendLog("现场确认后温度恢复，告警状态改为已关闭。"), 1350);
  });
}

function init() {
  renderOpsKpis();
  renderBarChart();
  renderLineChart();
  renderAlarms();
  renderPredicts();
  bindEvents();
  appendLog("系统已启动，等待告警事件。");
}

init();
