import { requestJson, type ApiRequestOptions } from "./http";
import type {
  AckAlertResponse,
  ApiAlertDetail,
  ApiAlertListResponse,
  ApiStationStatus,
  ApiTrendPoint,
  CloseAlertRequest,
  CloseAlertResponse,
  GetAlertsParams,
  GetInverterTrendParams,
} from "@/app/modules/alerts/types";

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function getAlerts(params: GetAlertsParams = {}, options?: ApiRequestOptions) {
  const query = buildQuery({
    station_id: params.stationId,
    status: params.status,
    severity: params.severity,
    start: params.start,
    end: params.end,
    limit: params.limit,
    offset: params.offset,
  });

  return requestJson<ApiAlertListResponse>(`/api/alerts${query}`, options);
}

export function getAlertDetail(alertId: number, options?: ApiRequestOptions) {
  return requestJson<ApiAlertDetail>(`/api/alerts/${alertId}`, options);
}

export function ackAlert(alertId: number, options?: ApiRequestOptions) {
  return requestJson<AckAlertResponse>(`/api/alerts/${alertId}/ack`, {
    method: "POST",
    ...options,
  });
}

export function closeAlert(alertId: number, operatorNote?: string | null, options?: ApiRequestOptions) {
  const body: CloseAlertRequest =
    operatorNote === undefined ? {} : { operator_note: operatorNote };

  return requestJson<CloseAlertResponse>(`/api/alerts/${alertId}/close`, {
    method: "POST",
    body,
    ...options,
  });
}

export function getInverterTrend(sn: string, params: GetInverterTrendParams, options?: ApiRequestOptions) {
  const query = buildQuery({
    string_index: params.stringIndex,
    start: params.start,
    end: params.end,
  });

  return requestJson<ApiTrendPoint[]>(`/api/inverters/${sn}/trend${query}`, options);
}

export function getStationStatus(stationId: string | number, options?: ApiRequestOptions) {
  return requestJson<ApiStationStatus>(`/api/stations/${stationId}/status`, options);
}
