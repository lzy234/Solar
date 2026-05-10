import type {
  AlertActionState,
  AlertDetailView,
  AlertListItemView,
  AlertStatusTone,
  AlertTrendPointView,
  ApiAlertDetail,
  ApiAlertListItem,
  ApiAlertSeverity,
  ApiAlertStatus,
  ApiTrendPoint,
} from "./types";

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
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

function formatTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return timeFormatter.format(date);
}

function getSeverityMeta(severity: ApiAlertSeverity) {
  return severity === "CRITICAL"
    ? { severity: "critical" as const, severityLabel: "严重" }
    : { severity: "warning" as const, severityLabel: "告警" };
}

function getStatusMeta(status: ApiAlertStatus): { status: AlertStatusTone; statusLabel: string } {
  switch (status) {
    case "RECOVERED":
      return { status: "recovered", statusLabel: "已恢复" };
    case "CLOSED":
      return { status: "closed", statusLabel: "已关闭" };
    default:
      return { status: "open", statusLabel: "待处理" };
  }
}

function buildStateHint(status: ApiAlertStatus, ackedAt?: string | null) {
  if (status === "OPEN" && ackedAt) {
    const ackTime = formatDateTime(ackedAt);
    return ackTime ? `已接手 ${ackTime}` : "已接手";
  }

  if (status === "RECOVERED") {
    return "等待人工关闭";
  }

  return undefined;
}

function buildActionState(status: ApiAlertStatus, ackedAt?: string | null): AlertActionState {
  return {
    isAcked: Boolean(ackedAt),
    ackedAt: ackedAt || null,
    canAck: status === "OPEN" && !ackedAt,
    canClose: status !== "CLOSED",
  };
}

function buildTitle(item: Pick<ApiAlertListItem, "inverter_sn" | "string_index" | "severity">) {
  const prefix = item.severity === "CRITICAL" ? "组串电压严重偏差" : "组串电压偏差告警";
  return `${prefix} #${item.string_index}`;
}

function buildDescription(item: Pick<ApiAlertListItem, "description" | "inverter_sn" | "string_index" | "deviation_pct" | "threshold_pct">) {
  if (item.description) {
    return item.description;
  }

  return `逆变器 ${item.inverter_sn} 第 ${item.string_index} 路组串电压偏差 ${item.deviation_pct.toFixed(1)}%，阈值 ${item.threshold_pct.toFixed(1)}%。`;
}

export function adaptAlertListItem(item: ApiAlertListItem): AlertListItemView {
  const severityMeta = getSeverityMeta(item.severity);
  const statusMeta = getStatusMeta(item.status);
  const primaryTime = item.started_at || item.detected_at;
  const dateTimeLabel = formatDateTime(primaryTime) || "--";
  const timeLabel = formatTime(primaryTime) || "--";

  return {
    alertId: item.id,
    stationId: item.station_id,
    stationName: item.station_name || `电站 ${item.station_id}`,
    inverterSn: item.inverter_sn,
    stringIndex: item.string_index,
    title: buildTitle(item),
    deviceLabel: `逆变器 ${item.inverter_sn} / 第 ${item.string_index} 路`,
    severity: severityMeta.severity,
    severityLabel: severityMeta.severityLabel,
    status: statusMeta.status,
    statusLabel: statusMeta.statusLabel,
    stateHint: buildStateHint(item.status, item.acked_at),
    description: buildDescription(item),
    voltage: item.voltage,
    referenceVoltage: item.reference_voltage,
    deviationPct: item.deviation_pct,
    thresholdPct: item.threshold_pct,
    startedAt: item.started_at || null,
    detectedAt: item.detected_at,
    timeLabel,
    dateTimeLabel,
    actionState: buildActionState(item.status, item.acked_at),
  };
}

export function adaptAlertDetail(item: ApiAlertDetail): AlertDetailView {
  const base = adaptAlertListItem(item);

  return {
    ...base,
    operatorNote: item.operator_note || null,
    rawContext: item.raw_context || null,
    recoveredAt: item.recovered_at || null,
    closedAt: item.closed_at || null,
    ackedAtLabel: formatDateTime(item.acked_at) || null,
    recoveredAtLabel: formatDateTime(item.recovered_at) || null,
    closedAtLabel: formatDateTime(item.closed_at) || null,
  };
}

export function adaptAlertTrend(points: ApiTrendPoint[]): AlertTrendPointView[] {
  return points.map((point) => ({
    time: point.time,
    timeLabel: formatTime(point.time) || "--",
    current: point.voltage,
    reference: point.reference_voltage,
    deviationPct: point.deviation_pct,
  }));
}
