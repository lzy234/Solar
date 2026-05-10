export type ApiAlertSeverity = "WARNING" | "CRITICAL";
export type ApiAlertStatus = "OPEN" | "RECOVERED" | "CLOSED";

export interface ApiAlertListItem {
  id: number;
  station_id: number | string;
  station_name?: string | null;
  inverter_sn: string;
  string_index: number;
  severity: ApiAlertSeverity;
  status: ApiAlertStatus;
  voltage: number;
  reference_voltage: number;
  deviation_pct: number;
  threshold_pct: number;
  started_at?: string | null;
  detected_at: string;
  acked_at?: string | null;
  recovered_at?: string | null;
  closed_at?: string | null;
  description?: string | null;
}

export interface ApiAlertListResponse {
  total: number;
  page: number;
  limit: number;
  items: ApiAlertListItem[];
}

export interface ApiAlertDetail extends ApiAlertListItem {
  dedup_key?: string | null;
  raw_context?: string | null;
  operator_note?: string | null;
}

export interface ApiTrendPoint {
  time: string;
  voltage: number;
  reference_voltage: number;
  deviation_pct: number;
}

export interface ApiStationStatus {
  station_id: number | string;
  online_device_count: number;
  open_alert_count: number;
  latest_alerts: ApiAlertListItem[];
}

export interface AckAlertResponse {
  alert_id: number;
  acked: boolean;
  acked_at: string | null;
}

export interface CloseAlertRequest {
  operator_note?: string | null;
}

export interface CloseAlertResponse {
  alert_id: number;
  status: ApiAlertStatus;
}

export interface GetAlertsParams {
  stationId?: string | number;
  status?: ApiAlertStatus;
  severity?: ApiAlertSeverity;
  start?: string;
  end?: string;
  limit?: number;
  offset?: number;
}

export interface GetInverterTrendParams {
  stringIndex: number;
  start?: string;
  end?: string;
}

export type AlertSeverityTone = "critical" | "warning";
export type AlertStatusTone = "open" | "recovered" | "closed";

export interface AlertActionState {
  isAcked: boolean;
  ackedAt: string | null;
  canAck: boolean;
  canClose: boolean;
}

export interface AlertListItemView {
  alertId: number;
  stationId: number | string;
  stationName: string;
  inverterSn: string;
  stringIndex: number;
  title: string;
  deviceLabel: string;
  severity: AlertSeverityTone;
  severityLabel: string;
  status: AlertStatusTone;
  statusLabel: string;
  stateHint?: string;
  description: string;
  voltage: number;
  referenceVoltage: number;
  deviationPct: number;
  thresholdPct: number;
  startedAt: string | null;
  detectedAt: string;
  timeLabel: string;
  dateTimeLabel: string;
  actionState: AlertActionState;
}

export interface AlertDetailView extends AlertListItemView {
  operatorNote: string | null;
  rawContext: string | null;
  recoveredAt: string | null;
  closedAt: string | null;
  ackedAtLabel: string | null;
  recoveredAtLabel: string | null;
  closedAtLabel: string | null;
}

export interface AlertTrendPointView {
  time: string;
  timeLabel: string;
  current: number;
  reference: number;
  deviationPct: number;
}
