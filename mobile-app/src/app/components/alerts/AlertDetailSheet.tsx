import { motion } from "motion/react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Clock3,
  LineChart as LineChartIcon,
  LoaderCircle,
  MapPin,
  RefreshCw,
  X,
  Zap,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type {
  AlertDetailView,
  AlertListItemView,
  AlertTrendPointView,
} from "@/app/modules/alerts/types";

import { AlertStateView } from "./AlertStateView";

interface AlertDetailSheetProps {
  alerts: AlertListItemView[];
  selectedAlertId: number | null;
  detail: AlertDetailView | null;
  selectedAlert: AlertListItemView | null;
  trend: AlertTrendPointView[];
  isDetailLoading: boolean;
  isTrendLoading: boolean;
  detailError: string | null;
  trendError: string | null;
  actionLoading?: {
    ack: boolean;
    close: boolean;
  };
  onClose: () => void;
  onRetry: () => void | Promise<void>;
  onSelectAlert: (alertId: number) => void;
  onAcknowledgeAlert: () => void | Promise<void>;
  onCloseAlert: () => void | Promise<void>;
  onSyncToCopilot?: () => void;
}

function getSeverityMeta(severity: AlertListItemView["severity"]) {
  if (severity === "critical") {
    return {
      label: "严重",
      chip: "bg-rose-100 text-rose-700 border-rose-200",
      border: "border-rose-200",
      accent: "from-rose-500 to-orange-500",
      icon: AlertTriangle,
    };
  }

  return {
    label: "告警",
    chip: "bg-amber-100 text-amber-700 border-amber-200",
    border: "border-amber-200",
    accent: "from-amber-400 to-orange-500",
    icon: AlertCircle,
  };
}

function getStatusMeta(status: AlertListItemView["status"], stateHint?: string) {
  switch (status) {
    case "recovered":
      return {
        label: stateHint || "已恢复",
        chip: "bg-emerald-100 text-emerald-700",
      };
    case "closed":
      return {
        label: stateHint || "已关闭",
        chip: "bg-slate-200 text-slate-700",
      };
    default:
      return {
        label: stateHint || "待处理",
        chip: "bg-sky-100 text-sky-700",
      };
  }
}

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return dateTimeFormatter.format(date);
}

function buildStateRows(detail: AlertDetailView) {
  return [
    {
      key: "started",
      label: "异常开始",
      value: formatDateTime(detail.startedAt) || "未提供",
    },
    {
      key: "detected",
      label: "检测时间",
      value: formatDateTime(detail.detectedAt) || "未提供",
    },
    {
      key: "acked",
      label: "接手时间",
      value: detail.ackedAtLabel || "未接手",
    },
    {
      key: "recovered",
      label: "恢复时间",
      value: detail.recoveredAtLabel || "未恢复",
    },
    {
      key: "closed",
      label: "关闭时间",
      value: detail.closedAtLabel || "未关闭",
    },
  ];
}

export function AlertDetailSheet({
  alerts,
  selectedAlertId,
  detail,
  selectedAlert,
  trend,
  isDetailLoading,
  isTrendLoading,
  detailError,
  trendError,
  actionLoading,
  onClose,
  onRetry,
  onSelectAlert,
  onAcknowledgeAlert,
  onCloseAlert,
  onSyncToCopilot,
}: AlertDetailSheetProps) {
  const openCount = alerts.filter((alert) => alert.status === "open").length;
  const recoveredCount = alerts.filter((alert) => alert.status === "recovered").length;
  const closedCount = alerts.filter((alert) => alert.status === "closed").length;
  const activeAlert = detail ?? selectedAlert;
  const isAckSubmitting = actionLoading?.ack ?? false;
  const isCloseSubmitting = actionLoading?.close ?? false;
  const isActionBusy = isAckSubmitting || isCloseSubmitting;
  const canAck = activeAlert?.actionState.canAck ?? false;
  const canClose = activeAlert?.actionState.canClose ?? false;
  const ackButtonLabel = canAck ? "确认接手" : activeAlert?.actionState.isAcked ? "已确认接手" : "确认接手";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-sky-950/18 backdrop-blur-sm"
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 top-10 z-[70] overflow-hidden rounded-t-[34px] bg-[linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(255,255,255,1)_24%,_rgba(248,250,252,1)_100%)] shadow-2xl"
      >
        <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/92 px-5 py-4 backdrop-blur">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-500">Alert Detail</p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">告警详情页</h2>
              <p className="mt-1 text-xs text-slate-500">
                {openCount} 条待处理 · {recoveredCount} 条已恢复 · {closedCount} 条已关闭
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            >
              <X className="h-5 w-5" />
            </motion.button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1" data-swipe-ignore="true">
            {alerts.map((alert) => {
              const severityMeta = getSeverityMeta(alert.severity);
              const statusMeta = getStatusMeta(alert.status, alert.stateHint);
              const isActive = alert.alertId === selectedAlertId;

              return (
                <button
                  key={alert.alertId}
                  type="button"
                  onClick={() => onSelectAlert(alert.alertId)}
                  className={`min-w-[220px] rounded-[24px] border p-3 text-left shadow-sm transition-all ${
                    isActive
                      ? "border-sky-200 bg-[linear-gradient(145deg,_rgba(239,246,255,1),_rgba(219,234,254,1))] text-sky-950 shadow-md shadow-sky-100/80"
                      : `bg-white ${severityMeta.border} text-slate-900`
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        isActive ? "border border-white bg-white text-sky-700 shadow-sm shadow-sky-100/80" : statusMeta.chip
                      }`}
                    >
                      {statusMeta.label}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        isActive ? "border border-sky-100 bg-sky-100 text-sky-700" : severityMeta.chip
                      }`}
                    >
                      {severityMeta.label}
                    </span>
                  </div>
                  <p className={`font-bold ${isActive ? "text-sky-950" : "text-slate-900"}`}>{alert.title}</p>
                  <p className={`mt-1 text-xs ${isActive ? "text-sky-700" : "text-slate-500"}`}>
                    {alert.stationName} · {alert.dateTimeLabel}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-full overflow-y-auto px-5 pb-40 pt-4">
          {isDetailLoading && !detail ? (
            <AlertStateView
              isLoading
              title="告警详情加载中"
              description="正在读取告警详情与趋势数据，切换告警时会自动取消旧请求。"
            />
          ) : null}

          {!isDetailLoading && detailError && !detail ? (
            <AlertStateView
              title="告警详情加载失败"
              description={detailError}
              actionLabel="重试"
              onAction={onRetry}
              tone="error"
            />
          ) : null}

          {!isDetailLoading && !detailError && !detail ? (
            <AlertStateView
              title="暂无可展示的告警详情"
              description="请先从告警列表中选择一条真实告警。"
            />
          ) : null}

          {detail ? (
            <>
              <div className="mb-4 rounded-[30px] border border-sky-100 bg-[linear-gradient(145deg,_rgba(14,165,233,0.95),_rgba(37,99,235,0.92))] p-5 text-white shadow-2xl shadow-sky-200/60">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getSeverityMeta(detail.severity).chip}`}
                      >
                        {getSeverityMeta(detail.severity).label}
                      </span>
                      <span className="rounded-full border border-white/20 bg-white/16 px-3 py-1 text-[11px] font-semibold text-white/95">
                        {detail.statusLabel}
                      </span>
                      {detail.stateHint ? (
                        <span className="rounded-full border border-white/20 bg-white/16 px-3 py-1 text-[11px] font-semibold text-white/95">
                          {detail.stateHint}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">{detail.title}</h3>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-sky-100">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {detail.stationName}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" />
                        {detail.deviceLabel}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {detail.dateTimeLabel}
                      </span>
                    </p>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-100">{detail.description}</p>
                    {detailError ? (
                      <p className="mt-3 rounded-2xl border border-amber-200/70 bg-amber-50/85 px-3 py-2 text-xs text-amber-900">
                        当前展示的是上一次成功结果，本次详情刷新失败：{detailError}
                      </p>
                    ) : null}
                  </div>
                  {onSyncToCopilot ? (
                    <button
                      type="button"
                      onClick={onSyncToCopilot}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900"
                    >
                      同步到 AI 对话
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/20 bg-white/16 p-3">
                    <p className="text-[11px] text-slate-300">当前电压</p>
                    <p className="mt-1 text-lg font-black">{detail.voltage.toFixed(1)} V</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/16 p-3">
                    <p className="text-[11px] text-slate-300">参考电压</p>
                    <p className="mt-1 text-lg font-black">{detail.referenceVoltage.toFixed(1)} V</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/16 p-3">
                    <p className="text-[11px] text-slate-300">偏差比例</p>
                    <p className="mt-1 text-lg font-black">{detail.deviationPct.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/16 p-3">
                    <p className="text-[11px] text-slate-300">告警阈值</p>
                    <p className="mt-1 text-lg font-black">{detail.thresholdPct.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="mb-4 rounded-[30px] border border-white/70 bg-white/92 p-5 shadow-xl shadow-slate-200/60">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <LineChartIcon className="h-4 w-4 text-sky-500" />
                    异常趋势对比
                  </div>
                  <button
                    type="button"
                    onClick={() => void onRetry()}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm shadow-slate-100"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isDetailLoading || isTrendLoading ? "animate-spin" : ""}`} />
                    刷新
                  </button>
                </div>

                {isTrendLoading && trend.length === 0 ? (
                  <AlertStateView
                    isLoading
                    compact
                    title="趋势加载中"
                    description="正在读取逆变器趋势点位，接口默认返回最近 24 小时数据。"
                  />
                ) : null}

                {!isTrendLoading && trendError && trend.length === 0 ? (
                  <AlertStateView
                    compact
                    title="趋势加载失败"
                    description={trendError}
                    actionLabel="重试"
                    onAction={onRetry}
                    tone="error"
                  />
                ) : null}

                {!isTrendLoading && !trendError && trend.length === 0 ? (
                  <AlertStateView
                    compact
                    title="暂无趋势数据"
                    description="`GET /api/inverters/{sn}/trend` 当前返回为空。"
                  />
                ) : null}

                {trend.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `${value.toFixed(1)} V`,
                            name === "current" ? "当前组串" : "参考基线",
                          ]}
                          labelFormatter={(label) => `时间 ${label}`}
                          contentStyle={{
                            borderRadius: "16px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
                          }}
                        />
                        <Line type="monotone" dataKey="current" stroke="#f97316" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="reference" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>

                    {trendError ? (
                      <p className="mt-3 text-xs text-amber-600">
                        趋势图显示的是上一次成功结果，本次刷新失败：{trendError}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </div>

              <div className="mb-4 rounded-[30px] border border-white/70 bg-white/92 p-5 shadow-xl shadow-slate-200/60">
                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Clock3 className="h-4 w-4 text-sky-500" />
                  状态记录
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {buildStateRows(detail).map((item) => (
                    <div key={item.key} className="rounded-[24px] border border-slate-100 bg-slate-50/90 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {detail.operatorNote ? (
                <div className="mb-4 rounded-[30px] border border-white/70 bg-white/92 p-5 shadow-xl shadow-slate-200/60">
                  <div className="mb-2 text-sm font-bold text-slate-800">关闭备注</div>
                  <p className="text-sm leading-relaxed text-slate-600">{detail.operatorNote}</p>
                </div>
              ) : null}
            </>
          ) : null}

          <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-slate-200/80 bg-white/92 px-5 py-4 backdrop-blur">
            <div className="space-y-3">
              {onSyncToCopilot ? (
                <button
                  type="button"
                  onClick={onSyncToCopilot}
                  className="w-full rounded-full border border-sky-100 bg-white px-4 py-3 text-sm font-semibold text-sky-700 shadow-lg shadow-sky-100/80"
                >
                  同步到 AI 对话
                </button>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => void onAcknowledgeAlert()}
                  disabled={!canAck || isActionBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-sky-700 shadow-lg shadow-sky-100/80 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {isAckSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {isAckSubmitting ? "提交中..." : ackButtonLabel}
                </button>
                <button
                  type="button"
                  onClick={() => void onCloseAlert()}
                  disabled={!canClose || isActionBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isCloseSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {isCloseSubmitting ? "提交中..." : "关闭告警"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
