import { useState, useRef, useEffect, type TouchEvent as ReactTouchEvent } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Send, Activity, AlertCircle, Zap, TrendingUp, X, ChevronRight, Clock, MapPin, CheckCircle, AlertTriangle, Sun, Battery, Gauge } from 'lucide-react';

const chartData = [
  { id: 1, day: '周一', value: 85 },
  { id: 2, day: '周二', value: 92 },
  { id: 3, day: '周三', value: 88 },
  { id: 4, day: '周四', value: 96 },
  { id: 5, day: '周五', value: 91 },
  { id: 6, day: '周六', value: 98 },
  { id: 7, day: '周日', value: 95 },
];

interface Alert {
  id: number;
  title: string;
  station: string;
  device: string;
  level: 'warning' | 'critical' | 'info';
  time: string;
  status: 'pending' | 'processing' | 'resolved';
  description: string;
  suggestion: string;
}

const alertsData: Alert[] = [
  {
    id: 1,
    title: '组串 3 电流轻微波动',
    station: '嘉定南翔电站',
    device: '组串 #3',
    level: 'warning',
    time: '10:23',
    status: 'pending',
    description: '检测到组串3电流输出存在轻微波动,波动范围在±5%以内。初步判断可能由局部阴影遮挡引起。',
    suggestion: '建议派遣技术人员现场检查是否存在遮挡物,并检测组件表面清洁度。当前波动在安全范围内,可继续观察。',
  },
  {
    id: 2,
    title: '逆变器 A2 通信短暂重连',
    station: '临港电站',
    device: '逆变器 A2',
    level: 'warning',
    time: '09:47',
    status: 'pending',
    description: '逆变器A2通信模块在09:47出现短暂断连,持续时间约15秒后自动恢复。设备运行参数正常。',
    suggestion: '已自动恢复,建议在下次巡检时检查通信线缆连接情况和网络设备稳定性。',
  },
];

interface StationPower {
  id: number;
  name: string;
  capacity: number;
  current: number;
  percentage: number;
  status: 'excellent' | 'good' | 'normal';
}

const stationsData: StationPower[] = [
  { id: 1, name: '嘉定南翔电站', capacity: 50, current: 38.5, percentage: 98.2, status: 'excellent' },
  { id: 2, name: '临港电站', capacity: 30, current: 22.8, percentage: 97.5, status: 'excellent' },
  { id: 3, name: '青浦电站', capacity: 25, current: 19.2, percentage: 96.8, status: 'good' },
  { id: 4, name: '松江电站', capacity: 20, current: 14.2, percentage: 95.1, status: 'good' },
];

const hourlyPowerData = [
  { hour: '06:00', power: 2.1 },
  { hour: '07:00', power: 8.5 },
  { hour: '08:00', power: 15.2 },
  { hour: '09:00', power: 21.8 },
  { hour: '10:00', power: 26.3 },
  { hour: '11:00', power: 28.9 },
  { hour: '12:00', power: 29.5 },
  { hour: '13:00', power: 28.1 },
  { hour: '14:00', power: 25.7 },
  { hour: '15:00', power: 21.4 },
  { hour: '16:00', power: 16.8 },
  { hour: '17:00', power: 10.2 },
  { hour: '18:00', power: 4.3 },
];

interface Message {
  id: number;
  type: 'ai' | 'user';
  text: string;
}

export default function App() {
  const [currentView, setCurrentView] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'ai', text: '您好！我是您的 Solar AI 助手。运维看板已收缩至上方,您可以随时查阅。' },
    { id: 2, type: 'ai', text: '您可以问我:"分析一下嘉定电站的告警原因",或者"帮我生成今日运维报告"。' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [pendingReplyCount, setPendingReplyCount] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);
  const [showAlertDetail, setShowAlertDetail] = useState(false);
  const [showPowerDetail, setShowPowerDetail] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>(alertsData);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
  const isTyping = pendingReplyCount > 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (indicatorTimeout.current) {
        clearTimeout(indicatorTimeout.current);
      }

      replyTimeoutsRef.current.forEach(clearTimeout);
      replyTimeoutsRef.current = [];
    };
  }, []);

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
    if (showAlertDetail || showPowerDetail) {
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

  const showIndicatorTemporarily = () => {
    setShowIndicator(true);
    if (indicatorTimeout.current) clearTimeout(indicatorTimeout.current);
    indicatorTimeout.current = setTimeout(() => setShowIndicator(false), 2000);
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    const userMessageId = nextMessageIdRef.current++;
    const replyMessageId = nextMessageIdRef.current++;

    setMessages(prev => [...prev, { id: userMessageId, type: 'user', text }]);
    setInputValue('');
    setPendingReplyCount(prev => prev + 1);

    const replyTimeout = setTimeout(() => {
      setPendingReplyCount(prev => Math.max(prev - 1, 0));
      let reply = "收到,正在为您调取实时数据...";
      if (text.includes("告警")) {
        reply = "深度分析显示:嘉定电站的电流波动由局部阴影遮挡引起,由于今日光照强烈,波动在安全范围内,已为您标记为'待观察'。";
      } else if (text.includes("报告") || text.includes("摘要")) {
        reply = "好的,为您汇总今日运营数据:截止目前发电 94.7MWh,全站效率 98.2%,无重大故障风险。";
      }
      setMessages(prev => [...prev, { id: replyMessageId, type: 'ai', text: reply }]);
      replyTimeoutsRef.current = replyTimeoutsRef.current.filter(timeout => timeout !== replyTimeout);
    }, 1200);

    replyTimeoutsRef.current.push(replyTimeout);
  };

  const handleAlertStatus = (alertId: number, newStatus: Alert['status']) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, status: newStatus } : alert
      )
    );
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <motion.div
        className="flex h-full"
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
        {/* Dashboard View */}
        <div
          className="min-w-screen h-full px-5 pt-6 pb-24 overflow-y-auto"
          style={{ touchAction: 'pan-y' }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[11px] font-bold tracking-widest text-sky-500 uppercase mb-1">
                  Real-time Monitor
                </p>
                <h1 className="text-2xl font-black text-slate-900">电站运维概览</h1>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-semibold text-slate-500">2026.04.22</p>
              </div>
            </div>
          </motion.div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowPowerDetail(true)}
              className="relative bg-white/80 backdrop-blur-xl p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-white/60 overflow-hidden group hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300 cursor-pointer active:scale-95"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-sky-100 to-sky-50 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <TrendingUp className="w-5 h-5 text-sky-500 mb-2" />
                <p className="text-xs text-slate-500 font-medium mb-2">今日发电量</p>
                <p className="text-3xl font-black text-slate-900 mb-1.5 tracking-tight">94.7</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-xs font-semibold text-emerald-600">运行平稳</p>
                </div>
                <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              className="relative bg-white/80 backdrop-blur-xl p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-white/60 overflow-hidden group hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-violet-100 to-violet-50 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <Zap className="w-5 h-5 text-violet-500 mb-2" />
                <p className="text-xs text-slate-500 font-medium mb-2">实时功率 (MW)</p>
                <p className="text-3xl font-black text-slate-900 mb-1.5 tracking-tight">14.3</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></div>
                  <p className="text-xs font-semibold text-violet-600">实时波动</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
              className="relative bg-white/80 backdrop-blur-xl p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-white/60 overflow-hidden group hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <Activity className="w-5 h-5 text-emerald-500 mb-2" />
                <p className="text-xs text-slate-500 font-medium mb-2">健康得分</p>
                <p className="text-3xl font-black text-emerald-500 mb-1.5 tracking-tight">98</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-xs font-semibold text-emerald-600">极佳</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAlertDetail(true)}
              className="relative bg-white/80 backdrop-blur-xl p-5 rounded-2xl shadow-lg shadow-slate-200/50 border border-white/60 overflow-hidden group hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-300 cursor-pointer active:scale-95"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-50 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <AlertCircle className="w-5 h-5 text-amber-500 mb-2" />
                <p className="text-xs text-slate-500 font-medium mb-2">待处理告警</p>
                <p className="text-3xl font-black text-amber-500 mb-1.5 tracking-tight">{alerts.filter(a => a.status === 'pending').length}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                  <p className="text-xs font-semibold text-amber-600">需关注</p>
                </div>
                <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 mb-6"
          >
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full"></div>
              近 7 日发电趋势分析
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    padding: '8px 12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  fill="url(#colorValue)"
                  animationDuration={1500}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAlertDetail(true)}
            className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-3xl border border-amber-200/60 shadow-lg shadow-amber-100/50 cursor-pointer hover:shadow-xl hover:shadow-amber-200/50 transition-all duration-300 active:scale-95"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50"></div>
                实时告警摘要
              </h3>
              <ChevronRight className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-2.5 text-sm text-slate-600 leading-relaxed">
              {alerts.filter(a => a.status === 'pending').map(alert => (
                <p key={alert.id} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span>{alert.station}:{alert.title}</span>
                </p>
              ))}
            </div>
          </motion.div>

          {/* Swipe Hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col items-center gap-2 mt-12 mb-8 text-slate-400 text-xs"
          >
            <span>左滑进入 AI 对话助手</span>
            <motion.div
              animate={{ x: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </motion.div>
          </motion.div>
        </div>

        {/* Chat View */}
        <div
          className="min-w-screen h-full flex flex-col bg-white"
          style={{ touchAction: 'pan-y' }}
        >
          {/* Compact Header */}
          <div className="px-4 py-3 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200 flex gap-2.5 overflow-x-auto scrollbar-hide">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm whitespace-nowrap">
              <span className="text-xs font-medium text-slate-600">今日发电</span>
              <span className="text-xs font-black text-sky-600">94.7</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm whitespace-nowrap">
              <span className="text-xs font-medium text-slate-600">实时功率</span>
              <span className="text-xs font-black text-violet-600">14.3</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm whitespace-nowrap">
              <span className="text-xs font-medium text-slate-600">健康得分</span>
              <span className="text-xs font-black text-emerald-600">98</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm whitespace-nowrap">
              <span className="text-xs font-medium text-slate-600">活跃告警</span>
              <span className="text-xs font-black text-amber-600">{alerts.filter(a => a.status === 'pending').length}</span>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-6 space-y-5"
            style={{ touchAction: 'pan-y' }}
          >
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.type === 'ai'
                        ? 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        : 'bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-br-sm shadow-lg shadow-sky-500/30'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.6, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <motion.div
                      className="w-2 h-2 bg-slate-400 rounded-full"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-slate-400 rounded-full"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-slate-400 rounded-full"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="问问我关于电站的情况..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/40 hover:shadow-xl hover:shadow-sky-500/50 transition-shadow"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Page Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showIndicator ? 1 : 0 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-50 pointer-events-none"
      >
        {[0, 1].map((idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentView === idx
                ? 'w-6 bg-sky-500'
                : 'w-1.5 bg-slate-300'
            }`}
          />
        ))}
      </motion.div>

      {/* Alert Detail Page */}
      <AnimatePresence>
        {showAlertDetail && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAlertDetail(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />

            {/* Alert Detail Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 top-16 bg-gradient-to-b from-slate-50 to-white rounded-t-3xl shadow-2xl z-[70] overflow-hidden"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-black text-slate-900">告警处理中心</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {alerts.filter(a => a.status === 'pending').length} 个待处理 · {alerts.filter(a => a.status === 'resolved').length} 个已解决
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAlertDetail(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </motion.button>
              </div>

              {/* Alert List */}
              <div className="overflow-y-auto h-full pb-32 px-5 pt-4">
                <div className="space-y-4">
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white rounded-2xl shadow-lg border overflow-hidden ${
                        alert.level === 'critical'
                          ? 'border-red-200 shadow-red-100/50'
                          : alert.level === 'warning'
                          ? 'border-amber-200 shadow-amber-100/50'
                          : 'border-blue-200 shadow-blue-100/50'
                      }`}
                    >
                      {/* Alert Header */}
                      <div className="p-5 border-b border-slate-100">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {alert.level === 'critical' ? (
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                              ) : alert.level === 'warning' ? (
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                              ) : (
                                <Activity className="w-5 h-5 text-blue-500" />
                              )}
                              <h3 className="font-bold text-slate-900">{alert.title}</h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{alert.station}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>今日 {alert.time}</span>
                              </div>
                            </div>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              alert.status === 'resolved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : alert.status === 'processing'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {alert.status === 'resolved'
                              ? '已解决'
                              : alert.status === 'processing'
                              ? '处理中'
                              : '待处理'}
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 leading-relaxed mb-3">
                          <p className="font-medium text-slate-700 mb-1 text-xs">设备信息</p>
                          <p className="text-xs">{alert.device}</p>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                              <div className="w-1 h-4 bg-sky-500 rounded-full"></div>
                              问题描述
                            </p>
                            <p className="text-slate-600 leading-relaxed text-xs pl-3">
                              {alert.description}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                              <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                              处理建议
                            </p>
                            <p className="text-slate-600 leading-relaxed text-xs pl-3">
                              {alert.suggestion}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="p-4 bg-slate-50/50 flex gap-3">
                        {alert.status === 'pending' && (
                          <>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleAlertStatus(alert.id, 'processing')}
                              className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/30 transition-colors"
                            >
                              开始处理
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleAlertStatus(alert.id, 'resolved')}
                              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle className="w-4 h-4" />
                              标记已解决
                            </motion.button>
                          </>
                        )}
                        {alert.status === 'processing' && (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleAlertStatus(alert.id, 'resolved')}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            确认已解决
                          </motion.button>
                        )}
                        {alert.status === 'resolved' && (
                          <div className="w-full py-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-4 h-4" />
                            已完成处理
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Power Generation Detail Page */}
      <AnimatePresence>
        {showPowerDetail && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPowerDetail(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />

            {/* Power Detail Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 top-16 bg-gradient-to-b from-sky-50 to-white rounded-t-3xl shadow-2xl z-[70] overflow-hidden"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-black text-slate-900">发电详情</h2>
                  <p className="text-xs text-slate-500 mt-0.5">今日累计发电量 94.7 MWh · 效率 97.4%</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPowerDetail(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto h-full pb-32 px-5 pt-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-4 shadow-lg shadow-sky-500/30"
                  >
                    <Sun className="w-6 h-6 text-white/90 mb-2" />
                    <p className="text-xs text-white/80 mb-1">当前功率</p>
                    <p className="text-2xl font-black text-white">14.3</p>
                    <p className="text-[10px] text-white/70">MW</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 shadow-lg shadow-emerald-500/30"
                  >
                    <Battery className="w-6 h-6 text-white/90 mb-2" />
                    <p className="text-xs text-white/80 mb-1">系统效率</p>
                    <p className="text-2xl font-black text-white">97.4</p>
                    <p className="text-[10px] text-white/70">%</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 shadow-lg shadow-violet-500/30"
                  >
                    <Gauge className="w-6 h-6 text-white/90 mb-2" />
                    <p className="text-xs text-white/80 mb-1">负载率</p>
                    <p className="text-2xl font-black text-white">76</p>
                    <p className="text-[10px] text-white/70">%</p>
                  </motion.div>
                </div>

                {/* Hourly Power Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 mb-6"
                >
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full"></div>
                    今日逐时发电功率
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={hourlyPowerData}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.5} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} vertical={false} />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        interval={1}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'MW', position: 'insideLeft', style: { fontSize: 10, fill: '#64748b' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '12px',
                          padding: '8px 12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Bar dataKey="power" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Stations Performance */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5"
                >
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full"></div>
                    各电站发电情况
                  </h3>
                  <div className="space-y-4">
                    {stationsData.map((station, index) => (
                      <motion.div
                        key={station.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + index * 0.05 }}
                        className="border-b border-slate-100 last:border-0 pb-4 last:pb-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{station.name}</p>
                            <p className="text-xs text-slate-500">
                              装机容量 {station.capacity} MW
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-sky-600">{station.current}</p>
                            <p className="text-[10px] text-slate-500">MWh</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${station.percentage}%` }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                            className={`absolute left-0 top-0 h-full rounded-full ${
                              station.status === 'excellent'
                                ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                                : station.status === 'good'
                                ? 'bg-gradient-to-r from-sky-500 to-blue-500'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500'
                            }`}
                          />
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              station.status === 'excellent'
                                ? 'bg-emerald-100 text-emerald-700'
                                : station.status === 'good'
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            <div className={`w-1 h-1 rounded-full ${
                              station.status === 'excellent'
                                ? 'bg-emerald-500'
                                : station.status === 'good'
                                ? 'bg-sky-500'
                                : 'bg-amber-500'
                            } animate-pulse`}></div>
                            {station.status === 'excellent' ? '运行优秀' : station.status === 'good' ? '运行良好' : '正常运行'}
                          </div>
                          <p className="text-xs font-semibold text-slate-600">{station.percentage}%</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Summary Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-5 border border-slate-200"
                >
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-violet-500 to-purple-600 rounded-full"></div>
                    综合统计
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">峰值功率</p>
                      <p className="text-xl font-black text-slate-900">29.5 <span className="text-sm font-normal text-slate-500">MW</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">出现于 12:00</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">平均功率</p>
                      <p className="text-xl font-black text-slate-900">18.6 <span className="text-sm font-normal text-slate-500">MW</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">06:00 - 18:00</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">有效发电时长</p>
                      <p className="text-xl font-black text-slate-900">12.5 <span className="text-sm font-normal text-slate-500">小时</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">今日总时长</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">等效小时数</p>
                      <p className="text-xl font-black text-slate-900">5.1 <span className="text-sm font-normal text-slate-500">小时</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">标准光照</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
