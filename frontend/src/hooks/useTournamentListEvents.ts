import { useEffect, useRef } from 'react';
import { tournamentsWebSocketUrl } from '../api/tournamentsService';

/** Turnirlar ro‘yxati yangilanganda (yaratish / jamoa) server yengil WS xabar yuboradi */
export function useTournamentListEvents(onRefresh: () => void) {
  const cbRef = useRef(onRefresh);
  cbRef.current = onRefresh;

  useEffect(() => {
    const url = tournamentsWebSocketUrl();
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(url);
      ws.onmessage = () => cbRef.current();
    } catch {
      /* brauzer yoki URL */
    }
    return () => {
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
    };
  }, []);
}
