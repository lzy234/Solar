import { AlertCircle, AlertTriangle, ChevronRight, Clock, LoaderCircle, MapPin, RefreshCw } from "lucide-react";

import type { AlertListItemView } from "@/app/modules/alerts/types";

interface AlertListSectionProps {
  alerts: AlertListItemView[];
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  selectedAlertId?: number;
  onOpenAlert: (alertId: number) => void;
  onRetry: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
}

function getSeverityMeta(severity: AlertListItemView["severity"]) {
  if (severity === "critical") {
    return {
      label: "严重",
      accent: "from-rose-500 to-orange-500",
      chip: "bg-rose-100 text-rose-700 border-rose-200",
      border: "border-rose-200",
      icon: AlertTriangle,
    };
  }

  return {
    label: "告警",
    accent: "from-amber-400 to-orange-500",
    chip: "bg-amber-100 text-amber-700 border-amber-200",
    border: "border-amber-200",
    icon: AlertCircle,
  };
}

function getStatusChip(status: AlertListItemView["status"]) {
  switch (status) {
    case "recovered":
      return "bg-emerald-100 text-emerald-700";
    case "closed":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-sky-100 text-sky-700";
  }
}

function AlertListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[26px] border border-slate-200 bg-white/92 p-5 shadow-lg shadow-slate-200/50"
        >
          <div className="animate-pulse">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-slate-200" />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 h-4 w-40 rounded-full bg-slate-200" />
                  <div className="h-3 w-52 rounded-full bg-slate-100" />
                </div>
              </div>
              <div className="h-6 w-16 rounded-full bg-slate-200" />
            </div>
            <div className="mb-3 h-10 rounded-2xl bg-slate-100" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 rounded-full bg-slate-100" />
              <div className="h-3 w-16 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AlertListSection({
  alerts,
  error,
  isLoading,
  isRefreshing,
  selectedAlertId,
  onOpenAlert,
  onRetry,
  onRefresh,
}: AlertListSectionProps) {
  const hasAlerts = alerts.length > 0;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-700">关键告警卡片</h2>
          <p className="mt-1 text-xs text-slate-400">实时读取开放告警，支持手动刷新与失败重试</p>
        </div>
        <div className="flex items-center gap-2">
          {isRefreshing ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              刷新中
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm shadow-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新
          </button>
        </div>
      </div>

      {isLoading ? <AlertListSkeleton /> : null}

      {!isLoading && error ? (
        <div className="rounded-[26px] border border-rose-200 bg-rose-50/80 p-5 shadow-lg shadow-rose-100/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-rose-800">告警列表加载失败</p>
              <p className="mt-1 text-sm leading-6 text-rose-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => void onRetry()}
              className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-200"
            >
              重试
            </button>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && !hasAlerts ? (
        <div className="rounded-[26px] border border-dashed border-slate-200 bg-white/88 p-6 text-center shadow-lg shadow-slate-100/60">
          <p className="text-sm font-bold text-slate-800">当前没有开放告警</p>
          <p className="mt-1 text-sm text-slate-500">`GET /api/alerts?status=OPEN` 返回为空，列表已进入空态。</p>
        </div>
      ) : null}

      {!isLoading && !error && hasAlerts ? (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const severityMeta = getSeverityMeta(alert.severity);
            const LevelIcon = severityMeta.icon;
            const isActive = alert.alertId === selectedAlertId;

            return (
              <button
                key={alert.alertId}
                type="button"
                onClick={() => onOpenAlert(alert.alertId)}
                className={`w-full rounded-[26px] border bg-white/92 p-5 text-left shadow-lg transition-all ${
                  isActive ? "border-sky-300 shadow-sky-100/80" : severityMeta.border
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${severityMeta.accent} text-white shadow-lg`}
                    >
                      <LevelIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900">{alert.title}</p>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${severityMeta.chip}`}>
                          {severityMeta.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {alert.stationName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {alert.dateTimeLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusChip(alert.status)}`}>
                    {alert.stateHint || alert.statusLabel}
                  </span>
                </div>

                <p className="mb-3 text-sm leading-relaxed text-slate-600">{alert.description}</p>

                <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>
                    偏差 {alert.deviationPct.toFixed(1)}% / 阈值 {alert.thresholdPct.toFixed(1)}%
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-sky-600">
                    查看详情
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
