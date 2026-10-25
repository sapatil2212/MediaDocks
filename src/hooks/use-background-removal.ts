"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackgroundRemovalClient,
  isEngineSupported,
  type EngineEvent,
  type RemovalResult,
} from "@/lib/background-remover/client";
import { MODEL } from "@/lib/background-remover/protocol";

export type EnginePhase = "idle" | "downloading" | "starting" | "ready" | "error";

export interface EngineState {
  phase: EnginePhase;
  loaded: number;
  total: number;
  message?: string;
}

/**
 * Owns one background-removal client per mounted hero. Nothing heavy is
 * created at mount: the worker, runtime and model load on the first
 * `ensureReady()` call, and the worker is terminated on unmount.
 */
export function useBackgroundRemoval() {
  const clientRef = useRef<BackgroundRemovalClient | null>(null);
  const [supported, setSupported] = useState(true);
  const [engine, setEngine] = useState<EngineState>({
    phase: "idle",
    loaded: 0,
    total: MODEL.bytes,
  });

  useEffect(() => {
    setSupported(isEngineSupported());
    return () => {
      clientRef.current?.terminate();
      clientRef.current = null;
    };
  }, []);

  const handleEvent = useCallback((event: EngineEvent) => {
    switch (event.type) {
      case "model-progress":
        setEngine({ phase: "downloading", loaded: event.loaded, total: event.total });
        break;
      case "engine-starting":
        setEngine((prev) => ({ ...prev, phase: "starting", message: undefined }));
        break;
      case "ready":
        setEngine((prev) => ({ ...prev, phase: "ready", message: undefined }));
        break;
      case "init-error":
        setEngine((prev) => ({ ...prev, phase: "error", message: event.message }));
        break;
    }
  }, []);

  const getClient = useCallback(() => {
    if (!clientRef.current) clientRef.current = new BackgroundRemovalClient();
    return clientRef.current;
  }, []);

  const ensureReady = useCallback(async (): Promise<boolean> => {
    setEngine((prev) =>
      prev.phase === "idle" || prev.phase === "error"
        ? { phase: "downloading", loaded: 0, total: MODEL.bytes }
        : prev
    );
    try {
      await getClient().init(handleEvent);
      return true;
    } catch {
      return false;
    }
  }, [getClient, handleEvent]);

  const removeBackground = useCallback(
    (id: string, file: Blob): Promise<RemovalResult> => getClient().process(id, file),
    [getClient]
  );

  return { supported, engine, ensureReady, removeBackground };
}
