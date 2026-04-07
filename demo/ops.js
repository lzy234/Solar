const opsData = {
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
  ]
};

const energyChart = document.getElementById("energyChart");
const alarmTable = document.getElementById("alarmTable");
const predictList = document.getElementById("predictList");
const opsLog = document.getElementById("opsLog");

function renderChart() {
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
  renderChart();
  renderAlarms();
  renderPredicts();
  bindEvents();
  appendLog("系统已启动，等待告警事件。");
}

init();
