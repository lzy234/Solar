import { useCallback, useEffect, useRef, useState } from "react";

import { getAlertDetail, getInverterTrend } from "@/app/services/alerts";
import { ApiError } from "@/app/services/http";

import { adaptAlertDetail, adaptAlertTrend } from "./adapters";
import type { AlertDetailView, AlertTrendPointView } from "./types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return null;
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

export function useAlertDetail(selectedAlertId: number | null, enabled = true) {
  const [detail, setDetail] = useState<AlertDetailView | null>(null);
  const [trend, setTrend] = useState<AlertTrendPointView[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [trendError, setTrendError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortControllerRef.current?.abort();

    if (!enabled || selectedAlertId === null) {
      setDetail(null);
      setTrend([]);
      setDetailError(null);
      setTrendError(null);
      setIsDetailLoading(false);
      setIsTrendLoading(false);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setDetail(null);
    setTrend([]);
    setDetailError(null);
    setTrendError(null);
    setIsDetailLoading(true);
    setIsTrendLoading(false);

    try {
      const detailResponse = await getAlertDetail(selectedAlertId, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      const nextDetail = adaptAlertDetail(detailResponse);
      setDetail(nextDetail);
      setIsDetailLoading(false);
      setIsTrendLoading(true);

      try {
        const trendResponse = await getInverterTrend(
          nextDetail.inverterSn,
          {
            stringIndex: nextDetail.stringIndex,
          },
          {
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) {
          return;
        }

        setTrend(adaptAlertTrend(trendResponse));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setTrendError(getErrorMessage(error, "趋势数据加载失败"));
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setDetailError(getErrorMessage(error, "告警详情加载失败"));
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      setIsDetailLoading(false);
      setIsTrendLoading(false);
    }
  }, [enabled, selectedAlertId]);

  useEffect(() => {
    void load();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [load]);

  return {
    detail,
    trend,
    isDetailLoading,
    isTrendLoading,
    isLoading: isDetailLoading || isTrendLoading,
    detailError,
    trendError,
    retry: load,
    refresh: load,
  };
}
