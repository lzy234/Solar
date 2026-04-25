import { useEffect, useLayoutEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence, motion, type PanInfo } from 'motion/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Battery,
  Bot,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Gauge,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

type AlertLevel = 'critical' | 'warning' | 'info';
type AlertStatus = 'pending' | 'processing' | 'resolved';

interface AlertMetric {
  label: string;
  value: string;
  hint: string;
  tone: 'sky' | 'amber' | 'emerald' | 'rose';
}

interface AlertCause {
  title: string;
  confidence: string;
  detail: string;
}

interface AlertTimelineItem {
  time: string;
  title: string;
  detail: string;
  tone: 'critical' | 'normal' | 'positive';
}

interface SimilarTicket {
  id: string;
  title: string;
  hit: string;
  result: string;
}

interface AlertTrendPoint {
  time: string;
  current: number;
  peer: number;
}

interface AlertItem {
  id: number;
  title: string;
  station: string;
  device: string;
  level: AlertLevel;
  time: string;
  status: AlertStatus;
  description: string;
  aiSummary: string;
  suggestion: string;
  confidence: number;
  duration: string;
  estimatedLoss: string;
  pushStatus: string;
  metrics: AlertMetric[];
  causes: AlertCause[];
  actions: string[];
  timeline: AlertTimelineItem[];
  tickets: SimilarTicket[];
  trend: AlertTrendPoint[];
  relatedQuestions: string[];
}

interface StationPower {
  id: number;
  name: string;
  capacity: number;
  current: number;
  percentage: number;
  status: 'excellent' | 'good' | 'normal';
}

interface Message {
  id: number;
  type: 'ai' | 'user';
  title?: string;
  text: string;
  sections?: string[];
  tags?: string[];
  actionLabel?: string;
  actionQuestion?: string;
}

const weeklyGenerationData = [
  { day: '周一', value: 85 },
  { day: '周二', value: 92 },
  { day: '周三', value: 88 },
  { day: '周四', value: 96 },
  { day: '周五', value: 91 },
  { day: '周六', value: 98 },
  { day: '周日', value: 95 },
];

const capabilityCards = [
  {
    title: '告警流展示',
    description: '异常、建议动作、工单经验统一收在一个演示页里，方便客户理解处理闭环。',
    icon: AlertCircle,
    accent: 'from-amber-400 to-orange-500',
  },
  {
    title: 'AI 运维副驾',
    description: '把站点状态、实时问答、日报草稿和工单建议合到同一个对话流里。',
    icon: Bot,
    accent: 'from-sky-400 to-blue-600',
  },
  {
    title: '知识库辅助',
    description: '通过历史工单命中结果解释建议来源，即使现在不接后端也能清楚展示价值。',
    icon: ClipboardList,
    accent: 'from-emerald-400 to-green-600',
  },
];

const alertsSeedData: AlertItem[] = [
  {
    id: 1,
    title: '3# 组串电流方差异常',
    station: '嘉定南翔电站',
    device: '逆变器 A / 3# 组串',
    level: 'critical',
    time: '10:23',
    status: 'pending',
    description: '系统检测到 3# 组串与同组并联组串的实时电流差异持续扩大，已超过预设阈值 27.4%。',
    aiSummary: 'AI 结合实时电流波动、辐照一致性和历史工单判断，这更像局部遮挡或接插件接触不良导致的发电衰减，而不是整机通信故障。',
    suggestion: '优先安排现场复核遮挡、接线端子和组件表面污染情况；若 20 分钟内无法恢复，升级为二线远程诊断。',
    confidence: 92,
    duration: '持续 26 分钟',
    estimatedLoss: '预计日损失 380 kWh',
    pushStatus: '飞书运维群已推送，等待现场确认',
    metrics: [
      { label: '电流偏差', value: '27.4%', hint: '超阈值 11.4%', tone: 'rose' },
      { label: '同排辐照一致性', value: '96%', hint: '排除天气影响', tone: 'emerald' },
      { label: '温升差', value: '+6.8°C', hint: '建议热像复核', tone: 'amber' },
      { label: '恢复概率', value: '43%', hint: '短时自恢复概率偏低', tone: 'sky' },
    ],
    causes: [
      {
        title: '局部遮挡或组件污染',
        confidence: '高概率',
        detail: '与近 30 天历史波形相比，本次异常与中午高辐照下的遮挡型波动高度相似。',
      },
      {
        title: '接插件松动',
        confidence: '中概率',
        detail: '温升差和电流突降同时出现，符合接触电阻上升特征，建议现场复核接线端子。',
      },
      {
        title: '单块组件衰减',
        confidence: '低概率',
        detail: '若清洁与接线均正常，再考虑组件老化或隐裂，需要二次检测确认。',
      },
    ],
    actions: [
      '10 分钟内到现场确认是否存在遮挡、污损或明显热斑。',
      '采集逆变器组串电流截图与组件热像图，作为后续工单附件。',
      '若异常持续超过 30 分钟，直接转派二线工程师并生成客户说明。',
    ],
    timeline: [
      {
        time: '10:23',
        title: '异常触发',
        detail: '方差分析首次超过阈值，自动生成高优先级告警。',
        tone: 'critical',
      },
      {
        time: '10:24',
        title: 'AI 初判完成',
        detail: '已命中 3 条相似工单，自动生成处理建议并推送飞书。',
        tone: 'normal',
      },
      {
        time: '10:31',
        title: '等待现场确认',
        detail: '尚未收到现场图片或复位反馈，建议继续跟踪。',
        tone: 'normal',
      },
    ],
    tickets: [
      {
        id: 'GD-2026-018',
        title: '嘉定 2# 组串午间遮挡异常',
        hit: '相似度 91%',
        result: '现场移除遮挡物后 12 分钟恢复，未更换部件。',
      },
      {
        id: 'GD-2025-114',
        title: '逆变器 A 端子接触不良',
        hit: '相似度 84%',
        result: '重新紧固接插件后恢复，建议保留热像记录。',
      },
    ],
    trend: [
      { time: '10:00', current: 8.9, peer: 9.0 },
      { time: '10:05', current: 8.7, peer: 8.9 },
      { time: '10:10', current: 8.2, peer: 8.8 },
      { time: '10:15', current: 7.5, peer: 8.8 },
      { time: '10:20', current: 6.9, peer: 8.7 },
      { time: '10:25', current: 6.4, peer: 8.7 },
      { time: '10:30', current: 6.2, peer: 8.6 },
    ],
    relatedQuestions: [
      '分析这条告警的原因',
      '给我一份现场处理步骤',
      '生成客户说明话术',
    ],
  },
  {
    id: 2,
    title: 'A2 通讯短时重连',
    station: '临港电站',
    device: '逆变器 A2',
    level: 'warning',
    time: '09:47',
    status: 'processing',
    description: '逆变器 A2 通讯模块在 09:47 出现 15 秒断连后自动恢复，设备功率曲线未见明显异常。',
    aiSummary: '当前更像链路抖动而不是设备硬故障。由于功率曲线连续，优先检查交换机端口和无线桥接稳定性即可。',
    suggestion: '保持观察并在例行巡检时复核通信链路；若 24 小时内重复出现 3 次以上，再升级处理。',
    confidence: 86,
    duration: '持续 15 秒',
    estimatedLoss: '暂未见明显发电损失',
    pushStatus: '已推送至企业微信，二线工程师处理中',
    metrics: [
      { label: '断连时长', value: '15s', hint: '已自动恢复', tone: 'sky' },
      { label: '功率波动', value: '0.8%', hint: '基本可忽略', tone: 'emerald' },
      { label: '重复次数', value: '2 次', hint: '近 7 天统计', tone: 'amber' },
      { label: '处置等级', value: 'L2', hint: '观察优先', tone: 'sky' },
    ],
    causes: [
      {
        title: '网络链路抖动',
        confidence: '高概率',
        detail: '断连时间短、功率曲线稳定，与交换机端口抖动或桥接不稳特征一致。',
      },
      {
        title: '逆变器通讯模块瞬时重启',
        confidence: '低概率',
        detail: '目前缺少重复证据，不建议立即更换硬件。',
      },
    ],
    actions: [
      '记录本次断连发生时间，纳入 24 小时通信巡检清单。',
      '检查现场交换机端口日志和桥接设备 RSSI 波动情况。',
      '如今日再次复发，自动生成二线诊断工单。',
    ],
    timeline: [
      {
        time: '09:47',
        title: '通讯短时断连',
        detail: 'A2 设备心跳丢失后 15 秒恢复，系统自动降级为观察类告警。',
        tone: 'critical',
      },
      {
        time: '09:48',
        title: 'AI 建议已生成',
        detail: '建议复核网络设备，不建议立即派人更换逆变器。',
        tone: 'normal',
      },
      {
        time: '10:02',
        title: '二线工程师接手',
        detail: '已标记处理中，等待链路日志回传。',
        tone: 'positive',
      },
    ],
    tickets: [
      {
        id: 'LG-2025-072',
        title: '临港 A1 通讯抖动',
        hit: '相似度 88%',
        result: '更换交换机端口后恢复，设备本体无故障。',
      },
    ],
    trend: [
      { time: '09:35', current: 7.2, peer: 7.1 },
      { time: '09:40', current: 7.4, peer: 7.3 },
      { time: '09:45', current: 7.5, peer: 7.4 },
      { time: '09:50', current: 7.5, peer: 7.4 },
      { time: '09:55', current: 7.6, peer: 7.5 },
      { time: '10:00', current: 7.7, peer: 7.6 },
      { time: '10:05', current: 7.8, peer: 7.7 },
    ],
    relatedQuestions: [
      '这条通讯告警要不要派人',
      '整理成运维日报描述',
      '输出二线排查建议',
    ],
  },
  {
    id: 3,
    title: '2# 汇流箱温度轻微抬升',
    station: '青浦电站',
    device: '2# 汇流箱',
    level: 'info',
    time: '08:58',
    status: 'resolved',
    description: '2# 汇流箱内部温度在早间启动阶段较昨日均值偏高 3.2°C，当前已回落。',
    aiSummary: '该异常已恢复，更像环境温度叠加早间启动负载造成的短时抬升。建议继续留档，不必作为客户高优先级问题呈现。',
    suggestion: '保留趋势记录，在下次检修时清洁风道并复核温感探头。',
    confidence: 78,
    duration: '持续 9 分钟',
    estimatedLoss: '无显著影响',
    pushStatus: '仅站内留档，无需外部通知',
    metrics: [
      { label: '温升偏差', value: '+3.2°C', hint: '已回落', tone: 'amber' },
      { label: '箱内负载', value: '62%', hint: '处于正常区间', tone: 'emerald' },
      { label: '告警等级', value: 'Info', hint: '不影响发电', tone: 'sky' },
      { label: '当前状态', value: '已恢复', hint: '保持留档', tone: 'emerald' },
    ],
    causes: [
      {
        title: '短时环境温升',
        confidence: '高概率',
        detail: '早间日照与箱体散热叠加导致短时抬升，目前已自然回落。',
      },
    ],
    actions: [
      '记录趋势曲线，作为后续箱体散热检查的参考。',
      '下次巡检时清洁风道并复核传感器稳定性。',
    ],
    timeline: [
      {
        time: '08:58',
        title: '温度抬升触发',
        detail: '系统自动记录为信息类告警。',
        tone: 'critical',
      },
      {
        time: '09:07',
        title: '温度回落',
        detail: '温度恢复至安全区间，自动标记为已解决。',
        tone: 'positive',
      },
    ],
    tickets: [],
    trend: [
      { time: '08:45', current: 31.2, peer: 30.9 },
      { time: '08:50', current: 32.8, peer: 31.0 },
      { time: '08:55', current: 34.4, peer: 31.1 },
      { time: '09:00', current: 34.0, peer: 31.2 },
      { time: '09:05', current: 32.5, peer: 31.1 },
      { time: '09:10', current: 31.6, peer: 31.0 },
    ],
    relatedQuestions: [
      '这条告警是否需要客户可见',
      '解释为什么已经恢复',
    ],
  },
];

const initialMessages: Message[] = [
  {
    id: 1,
    type: 'ai',
    title: 'OpenClaw 运维副驾已就绪',
    text: '当前为纯前端演示模式，已模拟接入多电站数据、告警流、工单经验与 AI 建议输出。',
    tags: ['多电站聚合', '前端 Demo', '无需后端'],
  },
  {
    id: 2,
    type: 'ai',
    title: '你可以直接这样问',
    text: '比如让我分析告警原因、生成日报摘要，或者把异常整理成工单步骤。',
    sections: ['分析嘉定南翔电站当前告警原因', '给我一份现场处理步骤', '生成今日运维日报摘要'],
  },
];

const quickPrompts = [
  '分析嘉定南翔电站当前告警原因',
  '给我一份现场处理步骤',
  '生成今日运维日报摘要',
  '整理一段客户说明话术',
];

const getStatusMeta = (status: AlertStatus) => {
  if (status === 'resolved') {
    return {
      label: '已解决',
      chip: 'bg-emerald-100 text-emerald-700',
      button: 'bg-emerald-500 hover:bg-emerald-600',
    };
  }

  if (status === 'processing') {
    return {
      label: '处理中',
      chip: 'bg-sky-100 text-sky-700',
      button: 'bg-sky-500 hover:bg-sky-600',
    };
  }

  return {
    label: '待处理',
    chip: 'bg-amber-100 text-amber-700',
    button: 'bg-amber-500 hover:bg-amber-600',
  };
};

const getLevelMeta = (level: AlertLevel) => {
  if (level === 'critical') {
    return {
      label: '高优先级',
      accent: 'from-rose-500 to-orange-500',
      chip: 'bg-rose-100 text-rose-700 border-rose-200',
      icon: AlertTriangle,
      border: 'border-rose-200',
    };
  }

  if (level === 'warning') {
    return {
      label: '需关注',
      accent: 'from-amber-400 to-orange-500',
      chip: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: AlertCircle,
      border: 'border-amber-200',
    };
  }

  return {
    label: '信息提示',
    accent: 'from-sky-400 to-blue-500',
    chip: 'bg-sky-100 text-sky-700 border-sky-200',
    icon: Activity,
    border: 'border-sky-200',
  };
};

const getMetricTone = (tone: AlertMetric['tone']) => {
  if (tone === 'rose') {
    return 'bg-rose-50 border-rose-100 text-rose-700';
  }

  if (tone === 'amber') {
    return 'bg-amber-50 border-amber-100 text-amber-700';
  }

  if (tone === 'emerald') {
    return 'bg-emerald-50 border-emerald-100 text-emerald-700';
  }

  return 'bg-sky-50 border-sky-100 text-sky-700';
};

const buildAiReply = (question: string, alert: AlertItem, alerts: AlertItem[]): Omit<Message, 'id'> => {
  const pendingCount = alerts.filter(item => item.status === 'pending').length;
  const criticalCount = alerts.filter(item => item.status === 'pending' && item.level === 'critical').length;

  if (/(日报|周报|月报|报告|摘要)/.test(question)) {
    return {
      type: 'ai',
      title: '今日运维摘要草稿',
      text: '我已经按客户更容易理解的方式，把当前电站状态、告警风险和下一步动作整合成一段摘要。',
      sections: [
        `发电概览：今日累计发电 94.7 MWh，综合完成率 97.8%，4 座电站整体运行平稳。`,
        `告警概览：当前 ${pendingCount} 条待处理告警，其中高优先级 ${criticalCount} 条，重点关注 ${alert.station} 的 ${alert.title}。`,
        `建议结论：先推动现场确认 ${alert.device}，同时继续观察临港电站通讯链路，已解决类异常仅做留档。`,
      ],
      tags: ['日报草稿', '适合客户演示', '纯前端模拟'],
      actionLabel: '继续生成工单摘要',
      actionQuestion: '给我一份现场处理步骤',
    };
  }

  if (/(客户|汇报|说明|话术)/.test(question)) {
    return {
      type: 'ai',
      title: '客户说明话术',
      text: '下面这段可以直接用于演示或同步客户，语气会比内部运维描述更克制。',
      sections: [
        `当前系统已识别到 ${alert.station}${alert.device} 的异常波动，并已自动推送给运维团队。`,
        `从现有数据看，问题更接近局部组件或接线侧异常，暂未发现整站级风险，平台已给出处置建议并跟踪恢复情况。`,
        `若现场复核确认需要进一步处理，系统可继续生成工单建议和日报摘要，方便您统一对外同步。`,
      ],
      tags: ['客户视角', '自动生成', '可复制演示'],
      actionLabel: '返回处理步骤',
      actionQuestion: '给我一份现场处理步骤',
    };
  }

  if (/(工单|步骤|排查|处理|派单|检修)/.test(question)) {
    return {
      type: 'ai',
      title: `${alert.title} 处理步骤`,
      text: '已结合历史工单命中结果整理成更适合运维执行的顺序。',
      sections: [
        `第一步：优先到 ${alert.device} 所在区域确认遮挡、组件污染和接插件松动，控制在 10 分钟内给出现场反馈。`,
        `第二步：补充逆变器电流截图、热像图或现场照片，作为工单附件，便于后续复盘。`,
        `第三步：若 ${alert.duration} 仍未恢复，则转派二线工程师，并附上“${alert.estimatedLoss}”作为优先级依据。`,
      ],
      tags: [`置信度 ${alert.confidence}%`, '历史工单辅助', '建议转工单'],
      actionLabel: '生成客户说明',
      actionQuestion: '整理一段客户说明话术',
    };
  }

  if (/(告警|原因|分析|异常)/.test(question)) {
    return {
      type: 'ai',
      title: `${alert.station} 告警分析`,
      text: alert.aiSummary,
      sections: [
        `异常特征：${alert.description}`,
        `风险判断：${alert.duration}，${alert.estimatedLoss}，当前推送状态为“${alert.pushStatus}”。`,
        `优先建议：${alert.actions[0]} ${alert.actions[1]}`,
      ],
      tags: [`命中工单 ${Math.max(alert.tickets.length, 1)} 条`, 'RAG 演示', 'AI 建议'],
      actionLabel: '生成处理步骤',
      actionQuestion: '给我一份现场处理步骤',
    };
  }

  return {
    type: 'ai',
    title: '当前运维总览',
    text: '基于当前模拟数据，整站运行总体稳定，但仍建议优先跟进高优先级异常。',
    sections: [
      '今日累计发电 94.7 MWh，实时功率 14.3 MW，综合健康分 98。',
      `当前仍有 ${pendingCount} 条待处理告警，最高优先级为 ${alert.station} 的 ${alert.title}。`,
      '如果你希望，我可以继续把它整理成日报、工单摘要或客户说明。',
    ],
    tags: ['多站点视角', '实时摘要'],
    actionLabel: '生成今日日报',
    actionQuestion: '生成今日运维日报摘要',
  };
};

const matchAlertByQuestion = (question: string, alerts: AlertItem[], fallback: AlertItem) => {
  const hit = alerts.find(alert =>
    question.includes(alert.station.replace('电站', '')) ||
    question.includes(alert.station) ||
    question.includes(alert.device) ||
    question.includes(alert.title.replace(/\s/g, ''))
  );

  return hit ?? fallback;
};

export default function App() {
  const [currentView, setCurrentView] = useState(0);
  const [viewportResetKey, setViewportResetKey] = useState(0);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [pendingReplyCount, setPendingReplyCount] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);
  const [showAlertDetail, setShowAlertDetail] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState(alertsSeedData[0].id);
  const [alerts, setAlerts] = useState<AlertItem[]>(alertsSeedData);
  const viewportRef = useRef<HTMLDivElement>(null);
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const nextMessageIdRef = useRef(3);
  const indicatorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const swipeStateRef = useRef({
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    isTracking: false,
    ignore: false,
  });

  const selectedAlert = alerts.find(alert => alert.id === selectedAlertId) ?? alerts[0];
  const pendingAlerts = alerts.filter(alert => alert.status === 'pending');
  const processingAlerts = alerts.filter(alert => alert.status === 'processing');
  const resolvedAlerts = alerts.filter(alert => alert.status === 'resolved');
  const isTyping = pendingReplyCount > 0;

  const scrollMessagesToBottom = (behavior: ScrollBehavior = 'auto') => {
    const viewport = messagesViewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior,
    });
  };

  useEffect(() => {
    if (currentView !== 1) {
      return;
    }

    scrollMessagesToBottom(messages.length > initialMessages.length ? 'smooth' : 'auto');
  }, [currentView, messages]);

  useEffect(() => {
    return () => {
      if (indicatorTimeout.current) {
        clearTimeout(indicatorTimeout.current);
      }

      replyTimeoutsRef.current.forEach(clearTimeout);
      replyTimeoutsRef.current = [];
    };
  }, []);

  const showIndicatorTemporarily = () => {
    setShowIndicator(true);
    if (indicatorTimeout.current) {
      clearTimeout(indicatorTimeout.current);
    }
    indicatorTimeout.current = setTimeout(() => setShowIndicator(false), 2000);
  };

  const switchView = (nextView: number) => {
    setCurrentView(nextView);
    showIndicatorTemporarily();
  };

  const resetSwipeState = () => {
    swipeStateRef.current = {
      startX: 0,
      startY: 0,
      deltaX: 0,
      deltaY: 0,
      isTracking: false,
      ignore: false,
    };
  };

  const forceViewportToDashboard = () => {
    viewportRef.current?.style.setProperty('transform', 'translateX(0px)');
  };

  const resetNativeViewport = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollLeft = 0;
    document.documentElement.scrollTop = 0;
    document.body.scrollLeft = 0;
    document.body.scrollTop = 0;
  };

  const applyDashboardState = () => {
    resetSwipeState();
    setCurrentView(0);
    setShowAlertDetail(false);
    setViewportResetKey(prev => prev + 1);
  };

  const resetToDashboard = (forceSync = false) => {
    if (forceSync) {
      flushSync(() => {
        applyDashboardState();
      });
    } else {
      applyDashboardState();
    }

    resetNativeViewport();
    forceViewportToDashboard();

    requestAnimationFrame(() => {
      resetNativeViewport();
      forceViewportToDashboard();
    });
  };

  useLayoutEffect(() => {
    resetToDashboard();
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const handlePageShow = () => {
      resetToDashboard(true);
    };

    const handlePageHide = () => {
      resetToDashboard(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        resetToDashboard(true);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const shouldIgnoreSwipeTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) {
      return false;
    }

    return Boolean(
      target.closest('input, textarea, button, a, [role="button"], [data-swipe-ignore="true"]')
    );
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x < -threshold && currentView === 0) {
      switchView(1);
    } else if (info.offset.x > threshold && currentView === 1) {
      switchView(0);
    } else {
      showIndicatorTemporarily();
    }
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (showAlertDetail) {
      resetSwipeState();
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    swipeStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      isTracking: true,
      ignore: shouldIgnoreSwipeTarget(event.target),
    };
  };

  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!swipeStateRef.current.isTracking || swipeStateRef.current.ignore) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - swipeStateRef.current.startX;
    const deltaY = touch.clientY - swipeStateRef.current.startY;

    swipeStateRef.current.deltaX = deltaX;
    swipeStateRef.current.deltaY = deltaY;

    if (Math.abs(deltaX) > 24 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    const { deltaX, deltaY, isTracking, ignore } = swipeStateRef.current;
    resetSwipeState();

    if (!isTracking || ignore) {
      return;
    }

    if (Math.abs(deltaX) < 72 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) {
      return;
    }

    if (deltaX < 0 && currentView === 0) {
      switchView(1);
    } else if (deltaX > 0 && currentView === 1) {
      switchView(0);
    } else {
      showIndicatorTemporarily();
    }
  };

  const enqueueQuestion = (question: string) => {
    const text = question.trim();
    if (!text) {
      return;
    }

    const focusAlert = matchAlertByQuestion(text, alerts, selectedAlert);
    const userMessageId = nextMessageIdRef.current++;
    const replyMessageId = nextMessageIdRef.current++;

    setMessages(prev => [...prev, { id: userMessageId, type: 'user', text }]);
    setInputValue('');
    setPendingReplyCount(prev => prev + 1);

    const replyTimeout = setTimeout(() => {
      setPendingReplyCount(prev => Math.max(prev - 1, 0));
      const reply = buildAiReply(text, focusAlert, alerts);
      setMessages(prev => [...prev, { id: replyMessageId, ...reply }]);
      replyTimeoutsRef.current = replyTimeoutsRef.current.filter(timeout => timeout !== replyTimeout);
    }, 900);

    replyTimeoutsRef.current.push(replyTimeout);
  };

  const handleSend = () => {
    enqueueQuestion(inputValue);
  };

  const handleMessageAction = (message: Message) => {
    if (!message.actionQuestion) {
      return;
    }

    enqueueQuestion(message.actionQuestion);
  };

  const openAlertDetail = (alertId: number) => {
    setSelectedAlertId(alertId);
    setShowAlertDetail(true);
  };

  const handleAlertStatus = (alertId: number, newStatus: AlertStatus) => {
    setAlerts(prev => prev.map(alert => (alert.id === alertId ? { ...alert, status: newStatus } : alert)));
  };

  const syncAlertToCopilot = (alert: AlertItem, question?: string) => {
    setShowAlertDetail(false);
    switchView(1);
    enqueueQuestion(question ?? `分析${alert.station}${alert.title}的原因和处理步骤`);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_38%),linear-gradient(180deg,_#f7fbff_0%,_#eef5ff_48%,_#f8fafc_100%)]">
      <motion.div
        key={viewportResetKey}
        ref={viewportRef}
        className="flex h-full"
        initial={false}
        animate={{ x: `-${currentView * 100}vw` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resetSwipeState}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="min-w-screen h-full overflow-y-auto px-5 pb-24 pt-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.28em] text-sky-600">Solar Ops Demo</p>
                <h1 className="text-3xl font-black tracking-tight text-slate-950">多站点运维看板</h1>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white/85 px-3 py-2 shadow-sm backdrop-blur">
                <p className="text-[11px] font-semibold text-slate-500">2026.04.25</p>
                <p className="text-[11px] text-slate-400">客户演示模式</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-slate-950 px-5 py-5 text-white shadow-2xl shadow-sky-200/40">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.35),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(52,211,153,0.26),_transparent_30%)]" />
              <div className="relative">
                <div className="mb-4 flex items-center gap-2 text-xs text-sky-100">
                  <Sparkles className="h-4 w-4" />
                  OpenClaw Agent 正在监听异常告警流与用户提问
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                    <p className="text-[11px] text-sky-100/80">接入电站</p>
                    <p className="mt-1 text-2xl font-black">4</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                    <p className="text-[11px] text-sky-100/80">活跃告警</p>
                    <p className="mt-1 text-2xl font-black">{pendingAlerts.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                    <p className="text-[11px] text-sky-100/80">AI 建议命中</p>
                    <p className="mt-1 text-2xl font-black">92%</p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-white/8 p-3 text-sm text-slate-100/90">
                  系统已把“异常检测 + 工单经验 + 对话问答”串成前端 demo，便于向客户直接展示闭环能力。
                </div>
              </div>
            </div>
          </motion.div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-200/60"
            >
              <TrendingUp className="mb-2 h-5 w-5 text-sky-500" />
              <p className="mb-2 text-xs font-medium text-slate-500">今日发电量</p>
              <p className="text-3xl font-black text-slate-950">94.7</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">完成率 97.8%</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-200/60"
            >
              <Zap className="mb-2 h-5 w-5 text-violet-500" />
              <p className="mb-2 text-xs font-medium text-slate-500">实时功率</p>
              <p className="text-3xl font-black text-slate-950">14.3</p>
              <p className="mt-1 text-xs font-semibold text-violet-600">MW</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-slate-200/60"
            >
              <Activity className="mb-2 h-5 w-5 text-emerald-500" />
              <p className="mb-2 text-xs font-medium text-slate-500">健康得分</p>
              <p className="text-3xl font-black text-emerald-500">98</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">运行稳定</p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openAlertDetail(selectedAlert.id)}
              className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-[linear-gradient(145deg,_rgba(255,251,235,1),_rgba(255,247,237,1))] p-5 text-left shadow-lg shadow-amber-100/70"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-200/50 blur-2xl" />
              <div className="relative">
                <AlertCircle className="mb-2 h-5 w-5 text-amber-500" />
                <p className="mb-2 text-xs font-medium text-slate-500">待处理告警</p>
                <p className="text-3xl font-black text-amber-500">{pendingAlerts.length}</p>
                <p className="mt-1 text-xs font-semibold text-amber-700">点击查看告警详情</p>
              </div>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-6 rounded-[30px] border border-white/70 bg-white/92 p-6 shadow-xl shadow-slate-200/60"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">近 7 日发电趋势</h2>
              <span className="text-xs text-slate-400">客户汇报常用视图</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyGenerationData}>
                <defs>
                  <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.34} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  fill="url(#weeklyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">关键告警卡片</h2>
              <button
                type="button"
                onClick={() => openAlertDetail(selectedAlert.id)}
                className="text-xs font-semibold text-sky-600"
              >
                进入告警详情
              </button>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, index) => {
                const levelMeta = getLevelMeta(alert.level);
                const statusMeta = getStatusMeta(alert.status);
                const LevelIcon = levelMeta.icon;

                return (
                  <motion.button
                    key={alert.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + index * 0.06 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => openAlertDetail(alert.id)}
                    className={`w-full rounded-[26px] border bg-white/92 p-5 text-left shadow-lg ${levelMeta.border}`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${levelMeta.accent} text-white shadow-lg`}>
                          <LevelIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-900">{alert.title}</p>
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${levelMeta.chip}`}>
                              {levelMeta.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {alert.station}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              今日 {alert.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.chip}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    <p className="mb-3 text-sm leading-relaxed text-slate-600">{alert.aiSummary}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>AI 置信度 {alert.confidence}%</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-sky-600">
                        查看详情
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-6"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">AI 在这个 demo 里能展示什么</h2>
              <button
                type="button"
                onClick={() => switchView(1)}
                className="text-xs font-semibold text-sky-600"
              >
                去看 AI 对话
              </button>
            </div>
            <div className="grid gap-3">
              {capabilityCards.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="rounded-[26px] border border-white/70 bg-white/90 p-4 shadow-lg shadow-slate-200/60"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{item.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mb-10 mt-10 flex flex-col items-center gap-2 text-xs text-slate-400"
          >
            <span>左滑进入 AI 对话页</span>
            <motion.div animate={{ x: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </motion.div>
          </motion.div>
        </div>

        <div className="min-w-screen flex h-full flex-col bg-[linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(255,255,255,1)_18%,_rgba(248,250,252,1)_100%)]">
          <div className="border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                  <Bot className="h-3.5 w-3.5" />
                  OpenClaw 运维副驾
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">AI 对话页</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  把实时状态、异常诊断、日报草稿和工单建议放进一个对话流里做客户演示。
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAlertDetail(selectedAlert.id)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
              >
                看告警详情
              </button>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-400">活跃告警</p>
                <p className="text-sm font-black text-amber-600">{pendingAlerts.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-400">默认关注</p>
                <p className="text-sm font-black text-slate-900">{selectedAlert.station}</p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1" data-swipe-ignore="true">
              {quickPrompts.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => enqueueQuestion(prompt)}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={messagesViewportRef}
            className="flex-1 overflow-y-auto px-4 py-5"
            style={{ touchAction: 'pan-y' }}
          >
            <div className="mb-4 rounded-[28px] border border-sky-100 bg-[linear-gradient(145deg,_rgba(239,246,255,0.95),_rgba(255,255,255,0.98))] p-4 shadow-lg shadow-sky-100/70">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                当前上下文
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-white/85 p-3">
                  <p className="text-slate-400">优先告警</p>
                  <p className="mt-1 font-semibold text-slate-900">{selectedAlert.title}</p>
                </div>
                <div className="rounded-2xl bg-white/85 p-3">
                  <p className="text-slate-400">工单命中</p>
                  <p className="mt-1 font-semibold text-slate-900">{Math.max(selectedAlert.tickets.length, 1)} 条</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <AnimatePresence>
                {messages.map(message => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, scale: 0.96, y: 18 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-[26px] px-4 py-4 shadow-lg ${
                        message.type === 'user'
                          ? 'rounded-br-md bg-[linear-gradient(145deg,_#0ea5e9,_#2563eb)] text-white shadow-sky-500/30'
                          : 'rounded-bl-md border border-white/70 bg-white text-slate-800 shadow-slate-200/70'
                      }`}
                    >
                      {message.type === 'ai' && message.title ? (
                        <div className="mb-2 flex items-start gap-2">
                          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{message.title}</p>
                            <p className="text-[11px] text-slate-400">AI 生成建议</p>
                          </div>
                        </div>
                      ) : null}
                      <p className={`text-sm leading-relaxed ${message.type === 'user' ? 'text-white' : 'text-slate-700'}`}>
                        {message.text}
                      </p>
                      {message.sections?.length ? (
                        <div className="mt-3 space-y-2">
                          {message.sections.map(section => (
                            <div key={section} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                              {section}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {message.tags?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.tags.map(tag => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {message.type === 'ai' && message.actionLabel && message.actionQuestion ? (
                        <button
                          type="button"
                          onClick={() => handleMessageAction(message)}
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                        >
                          {message.actionLabel}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="rounded-[24px] rounded-bl-md border border-white/70 bg-white px-4 py-3 shadow-lg shadow-slate-200/70">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                      AI 正在生成建议
                    </div>
                    <div className="flex gap-1">
                      {[0, 0.2, 0.4].map(delay => (
                        <motion.div
                          key={delay}
                          className="h-2 w-2 rounded-full bg-sky-400"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                          transition={{ repeat: Infinity, duration: 1.1, delay }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-slate-200/80 bg-white px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner shadow-slate-100">
                <input
                  type="text"
                  value={inputValue}
                  onChange={event => setInputValue(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="例如：分析嘉定南翔电站当前告警原因"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleSend}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(145deg,_#0ea5e9,_#2563eb)] text-white shadow-lg shadow-sky-500/40"
              >
                <Send className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showIndicator ? 1 : 0 }}
        className="pointer-events-none fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 gap-2"
      >
        {[0, 1].map(index => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentView === index ? 'w-7 bg-sky-500' : 'w-1.5 bg-slate-300'
            }`}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {showAlertDetail ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAlertDetail(false)}
              className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 top-10 z-[70] overflow-hidden rounded-t-[34px] bg-[linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(255,255,255,1)_24%,_rgba(248,250,252,1)_100%)] shadow-2xl"
            >
              <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/92 px-5 py-4 backdrop-blur">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-500">Alert Detail</p>
                    <h2 className="text-2xl font-black tracking-tight text-slate-950">告警详情页</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {pendingAlerts.length} 条待处理 · {processingAlerts.length} 条处理中 · {resolvedAlerts.length} 条已解决
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setShowAlertDetail(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1" data-swipe-ignore="true">
                  {alerts.map(alert => {
                    const levelMeta = getLevelMeta(alert.level);
                    const statusMeta = getStatusMeta(alert.status);
                    const isActive = alert.id === selectedAlert.id;

                    return (
                      <button
                        key={alert.id}
                        type="button"
                        onClick={() => setSelectedAlertId(alert.id)}
                        className={`min-w-[220px] rounded-[24px] border p-3 text-left shadow-sm transition-all ${
                          isActive
                            ? 'border-slate-900 bg-slate-950 text-white'
                            : `bg-white ${levelMeta.border} text-slate-900`
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            isActive ? 'bg-white/10 text-slate-100' : statusMeta.chip
                          }`}>
                            {statusMeta.label}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            isActive ? 'bg-white/10 text-slate-100' : levelMeta.chip
                          }`}>
                            {levelMeta.label}
                          </span>
                        </div>
                        <p className={`font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>{alert.title}</p>
                        <p className={`mt-1 text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                          {alert.station} · {alert.time}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-full overflow-y-auto px-5 pb-36 pt-4">
                <div className="mb-4 rounded-[30px] border border-white/70 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-300/40">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getLevelMeta(selectedAlert.level).chip}`}>
                          {getLevelMeta(selectedAlert.level).label}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90">
                          AI 置信度 {selectedAlert.confidence}%
                        </span>
                      </div>
                      <h3 className="text-2xl font-black tracking-tight">{selectedAlert.title}</h3>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-200">{selectedAlert.aiSummary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => syncAlertToCopilot(selectedAlert)}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900"
                    >
                      去 AI 中继续追问
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-[11px] text-slate-300">异常时长</p>
                      <p className="mt-1 text-lg font-black">{selectedAlert.duration}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-[11px] text-slate-300">损失评估</p>
                      <p className="mt-1 text-lg font-black">{selectedAlert.estimatedLoss}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white/10 p-3 text-sm text-slate-100">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Push Status</p>
                    <p className="mt-1">{selectedAlert.pushStatus}</p>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  {selectedAlert.metrics.map(metric => (
                    <div
                      key={metric.label}
                      className={`rounded-[24px] border p-4 shadow-sm ${getMetricTone(metric.tone)}`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{metric.label}</p>
                      <p className="mt-2 text-2xl font-black">{metric.value}</p>
                      <p className="mt-1 text-xs opacity-80">{metric.hint}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-4 rounded-[30px] border border-white/70 bg-white/92 p-5 shadow-xl shadow-slate-200/60">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">异常趋势对比</h3>
                    <span className="text-xs text-slate-400">当前组串 vs 同组基线</span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={selectedAlert.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '16px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
                        }}
                      />
                      <Line type="monotone" dataKey="current" stroke="#f97316" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="peer" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mb-4 rounded-[30px] border border-white/70 bg-white/92 p-5 shadow-xl shadow-slate-200/60">
                  <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Sparkles className="h-4 w-4 text-sky-500" />
                    AI 诊断与建议动作
                  </div>
                  <div className="space-y-3">
                    {selectedAlert.causes.map(cause => (
                      <div key={cause.title} className="rounded-[24px] border border-slate-100 bg-slate-50/90 p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">{cause.title}</p>
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white">
                            {cause.confidence}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600">{cause.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-800">
                      <CheckCircle className="h-4 w-4" />
                      推荐动作
                    </div>
                    <div className="space-y-2">
                      {selectedAlert.actions.map(action => (
                        <div key={action} className="flex items-start gap-2 text-sm text-emerald-900">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-4 rounded-[30px] border border-white/70 bg-white/92 p-5 shadow-xl shadow-slate-200/60">
                  <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Clock className="h-4 w-4 text-sky-500" />
                    处置时间线
                  </div>
                  <div className="space-y-4">
                    {selectedAlert.timeline.map(item => (
                      <div key={`${item.time}-${item.title}`} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`mt-1 h-2.5 w-2.5 rounded-full ${
                              item.tone === 'critical'
                                ? 'bg-rose-500'
                                : item.tone === 'positive'
                                ? 'bg-emerald-500'
                                : 'bg-sky-500'
                            }`}
                          />
                          <span className="mt-1 h-full w-px bg-slate-200 last:hidden" />
                        </div>
                        <div className="flex-1 rounded-[22px] bg-slate-50/90 px-4 py-3">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">{item.title}</p>
                            <span className="text-xs font-semibold text-slate-400">{item.time}</span>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-600">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4 rounded-[30px] border border-white/70 bg-white/92 p-5 shadow-xl shadow-slate-200/60">
                  <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <ClipboardList className="h-4 w-4 text-violet-500" />
                    历史工单命中
                  </div>
                  {selectedAlert.tickets.length ? (
                    <div className="space-y-3">
                      {selectedAlert.tickets.map(ticket => (
                        <div key={ticket.id} className="rounded-[24px] border border-slate-100 bg-slate-50/90 p-4">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">{ticket.title}</p>
                            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                              {ticket.hit}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-400">{ticket.id}</p>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">{ticket.result}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-500">
                      当前未命中高价值历史工单，仅建议继续留档观察。
                    </div>
                  )}
                </div>

                <div className="mb-4 rounded-[30px] border border-white/70 bg-white/92 p-5 shadow-xl shadow-slate-200/60">
                  <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <FileText className="h-4 w-4 text-sky-500" />
                    推荐追问
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAlert.relatedQuestions.map(question => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => syncAlertToCopilot(selectedAlert, question)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-slate-200/80 bg-white/92 px-5 py-4 backdrop-blur">
                  <div className="flex gap-3">
                    {selectedAlert.status !== 'processing' ? (
                      <button
                        type="button"
                        onClick={() => handleAlertStatus(selectedAlert.id, 'processing')}
                        className="flex-1 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200"
                      >
                        标记处理中
                      </button>
                    ) : null}
                    {selectedAlert.status !== 'resolved' ? (
                      <button
                        type="button"
                        onClick={() => handleAlertStatus(selectedAlert.id, 'resolved')}
                        className="flex-1 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200"
                      >
                        标记已解决
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => syncAlertToCopilot(selectedAlert)}
                      className="flex-1 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300"
                    >
                      同步到 AI 对话
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-sm rounded-2xl border border-white/70 bg-white/70 px-4 py-3 shadow-lg backdrop-blur">
        <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
          <div>
            <Sun className="mx-auto mb-1 h-4 w-4 text-sky-500" />
            <p className="font-semibold text-slate-500">功率</p>
            <p className="font-black text-slate-900">14.3</p>
          </div>
          <div>
            <Battery className="mx-auto mb-1 h-4 w-4 text-emerald-500" />
            <p className="font-semibold text-slate-500">效率</p>
            <p className="font-black text-slate-900">97.4%</p>
          </div>
          <div>
            <Gauge className="mx-auto mb-1 h-4 w-4 text-violet-500" />
            <p className="font-semibold text-slate-500">负载</p>
            <p className="font-black text-slate-900">76%</p>
          </div>
          <div>
            <Activity className="mx-auto mb-1 h-4 w-4 text-amber-500" />
            <p className="font-semibold text-slate-500">告警</p>
            <p className="font-black text-slate-900">{pendingAlerts.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
