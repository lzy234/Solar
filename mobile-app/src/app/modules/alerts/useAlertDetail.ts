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
  const detailRef = useRef<AlertDetailView | null>(null);
  const trendRef = useRef<AlertTrendPointView[]>([]);

  useEffect(() => {
    detailRef.current = detail;
  }, [detail]);

  useEffect(() => {
    trendRef.current = trend;
  }, [trend]);

  const load = useCallback(
    async (options: { preserveCurrent?: boolean } = {}) => {
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
      const previousDetail = detailRef.current;
      const preserveCurrent =
        Boolean(options.preserveCurrent) && previousDetail?.alertId === selectedAlertId;

      setDetailError(null);
      setTrendError(null);
      setIsDetailLoading(true);

      if (!preserveCurrent) {
        setDetail(null);
        setTrend([]);
        setIsTrendLoading(false);
      } else {
        setIsTrendLoading(trendRef.current.length > 0);
      }

      try {
        const detailResponse = await getAlertDetail(selectedAlertId, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        const nextDetail = adaptAlertDetail(detailResponse);
        const canReuseTrend =
          preserveCurrent &&
          previousDetail?.inverterSn === nextDetail.inverterSn &&
          previousDetail?.stringIndex === nextDetail.stringIndex;

        setDetail(nextDetail);
        setIsDetailLoading(false);

        if (!canReuseTrend) {
          setTrend([]);
        }

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
    },
    [enabled, selectedAlertId],
  );

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
    retry: () => load({ preserveCurrent: true }),
    refresh: () => load({ preserveCurrent: true }),
  };
}
