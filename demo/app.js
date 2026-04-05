const stations = [
  { id: "S-01", name: "浦东临港电站", capacity: 8.4, energy: 31.2, power: 4.8, alarms: 6 },
  { id: "S-02", name: "嘉定南翔电站", capacity: 5.6, energy: 21.4, power: 3.3, alarms: 3 },
  { id: "S-03", name: "松江新桥电站", capacity: 12.1, energy: 40.7, power: 6.2, alarms: 8 }
];

const alarms = [
  {
    time: "19:02",
    station: "浦东临港电站",
    level: "critical",
    message: "逆变器组 #A2 离线超过 12 分钟",
    status: "已推送"
  },
  {
    time: "18:40",
    station: "松江新桥电站",
    level: "warning",
    message: "同区域对标偏差 11.2%",
    status: "待确认"
  },
  {
    time: "18:15",
    station: "嘉定南翔电站",
    level: "info",
    message: "今日发电量低于周均值 4.8%",
    status: "已记录"
  },
  {
    time: "17:55",
    station: "松江新桥电站",
    level: "critical",
    message: "疑似组件遮挡，功率突降 23%",
    status: "处理中"
  }
];

const anomalyCases = [
  {
    title: "脏污遮挡疑似",
    desc: "同阵列在同辐照度下产能偏差持续扩大，建议安排现场清洗巡检。",
    score: "风险评分 0.82"
  },
  {
    title: "组件退化趋势",
    desc: "近 30 天功率输出斜率下行，疑似老化或连接损耗，建议做 I-V 曲线复核。",
    score: "风险评分 0.67"
  },
  {
    title: "逆变器异常波动",
    desc: "逆变器日内频繁重启，存在短时离线风险，建议排查散热与并网参数。",
    score: "风险评分 0.75"
  }
];

const stationSwitch = document.getElementById("stationSwitch");
const capacityValue = document.getElementById("capacityValue");
const energyValue = document.getElementById("energyValue");
const powerValue = document.getElementById("powerValue");
const alarmValue = document.getElementById("alarmValue");
const alarmTable = document.getElementById("alarmTable");
const anomalyGrid = document.getElementById("anomalyGrid");
const pushLog = document.getElementById("pushLog");
const reportBox = document.getElementById("reportBox");

let currentStation = stations[0];
let currentLevel = "all";

function renderStationSwitch() {
  stationSwitch.innerHTML = "";
  stations.forEach((station) => {
    const btn = document.createElement("button");
    btn.className = "station-btn" + (station.id === currentStation.id ? " active" : "");
    btn.innerHTML = `${station.name}<br/><small>${station.id} · ${station.capacity}MW</small>`;
    btn.addEventListener("click", () => {
      currentStation = station;
      renderStationSwitch();
      renderKpis();
      addPush(`已切换到 ${station.name}，正在拉取统一视图数据...`);
    });
    stationSwitch.appendChild(btn);
  });
}

function renderKpis() {
  capacityValue.textContent = `${currentStation.capacity.toFixed(1)} MW`;
  energyValue.textContent = `${currentStation.energy.toFixed(1)} MWh`;
  powerValue.textContent = `${currentStation.power.toFixed(1)} MW`;
  alarmValue.textContent = `${currentStation.alarms} 条`;
  [capacityValue, energyValue, powerValue, alarmValue].forEach((el) => {
    el.classList.remove("fade-in");
    void el.offsetWidth;
    el.classList.add("fade-in");
  });
}

function renderAlarmTable() {
  const rows = alarms.filter((item) => currentLevel === "all" || item.level === currentLevel);
  alarmTable.innerHTML = rows
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

function renderAnomaly() {
  anomalyGrid.innerHTML = anomalyCases
    .map(
      (item) => `
      <article class="anomaly-item">
        <h4>${item.title}</h4>
        <p>${item.desc}</p>
        <p style="margin-top:8px;color:#7ce9c9;">${item.score}</p>
      </article>
    `
    )
    .join("");
}

function levelText(level) {
  if (level === "critical") return "严重";
  if (level === "warning") return "一般";
  return "提示";
}

function addPush(text) {
  const line = document.createElement("p");
  line.textContent = `[${new Date().toLocaleTimeString("zh-CN", { hour12: false })}] ${text}`;
  line.className = "fade-in";
  pushLog.prepend(line);
}

function bindToolbar() {
  const chips = [...document.querySelectorAll(".chip")];
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentLevel = chip.dataset.level;
      renderAlarmTable();
    });
  });
}

function bindActions() {
  const simulatePush = document.getElementById("simulatePush");
  const generateReport = document.getElementById("generateReport");

  simulatePush.addEventListener("click", () => {
    addPush("收到严重告警：松江新桥电站疑似遮挡。");
    setTimeout(() => addPush("规则命中：严重等级 + 连续15分钟。"), 500);
    setTimeout(() => addPush("OpenClaw 生成消息摘要并推送企业通讯工具。"), 1000);
    setTimeout(() => addPush("客户已签收，任务自动进入处理跟踪。"), 1500);
  });

  generateReport.addEventListener("click", () => {
    reportBox.textContent = "OpenClaw 正在汇总数据...";
    setTimeout(() => {
      reportBox.textContent = `【本周运营周报】\n1. 总发电量: 93.3 MWh（较上周 +6.8%）\n2. 严重告警: 2 条，均已推送并跟踪\n3. 异常摘要: 松江新桥电站存在遮挡风险，建议现场巡检\n4. 下周建议: 清洗计划 + 逆变器组A2复核`;
      addPush("OpenClaw 已输出本周周报并发送给客户经理。");
    }, 900);
  });
}

function init() {
  renderStationSwitch();
  renderKpis();
  renderAlarmTable();
  renderAnomaly();
  bindToolbar();
  bindActions();
  addPush("系统已启动（演示模式），等待业务事件。");
}

init();
