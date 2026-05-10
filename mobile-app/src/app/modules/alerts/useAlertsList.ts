import { useEffect, useRef, useState } from "react";

import { ApiError } from "@/app/services/http";
import { ackAlert, closeAlert, getAlerts } from "@/app/services/alerts";

import { adaptAlertListItem } from "./adapters";
import type { AlertListItemView } from "./types";

type AlertActionKey = "ack" | "close";

interface AlertActionLoadingState {
  ack: boolean;
  close: boolean;
}

const DEFAULT_ACTION_LOADING_STATE: AlertActionLoadingState = {
  ack: false,
  close: false,
};

function getErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return null;
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "告警列表加载失败";
}

export function useAlertsList() {
  const [alerts, setAlerts] = useState<AlertListItemView[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingById, setActionLoadingById] = useState<Record<number, AlertActionLoadingState>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  const setActionLoading = (alertId: number, key: AlertActionKey, isActive: boolean) => {
    setActionLoadingById((previousState) => {
      const currentState = previousState[alertId] || DEFAULT_ACTION_LOADING_STATE;
      const nextState = {
        ...currentState,
        [key]: isActive,
      };

      if (!nextState.ack && !nextState.close) {
        const { [alertId]: _, ...restState } = previousState;
        return restState;
      }

      return {
        ...previousState,
        [alertId]: nextState,
      };
    });
  };

  const loadAlerts = async (
    mode: "initial" | "refresh" = "refresh",
    options: { throwOnError?: boolean } = {},
  ) => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError(null);

    if (mode === "initial") {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await getAlerts(
        {
          status: "OPEN",
        },
        {
          signal: controller.signal,
        }
      );

      if (controller.signal.aborted) {
        return;
      }

      setAlerts(response.items.map(adaptAlertListItem));
      setTotal(response.total);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setError(getErrorMessage(error));

      if (options.throwOnError) {
        throw error;
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAlerts("initial");

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const refresh = async () => {
    await loadAlerts("refresh");
  };

  const retry = async () => {
    await loadAlerts("initial");
  };

  const runAction = async (alertId: number, key: AlertActionKey, action: () => Promise<unknown>) => {
    setActionLoading(alertId, key, true);

    try {
      await action();
      await loadAlerts("refresh", { throwOnError: true });
    } finally {
      setActionLoading(alertId, key, false);
    }
  };

  const acknowledgeAlert = async (alertId: number) => {
    await runAction(alertId, "ack", () => ackAlert(alertId));
  };

  const markAlertClosed = async (alertId: number, operatorNote?: string | null) => {
    await runAction(alertId, "close", () => closeAlert(alertId, operatorNote));
  };

  return {
    alerts,
    total,
    isLoading,
    isRefreshing,
    error,
    refresh,
    retry,
    actionLoadingById,
    acknowledgeAlert,
    markAlertClosed,
  };
}
