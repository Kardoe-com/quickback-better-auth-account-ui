/**
 * RealtimeProvider
 *
 * Manages WebSocket lifecycle for realtime broadcasts.
 * Auto-connects when user is logged in and realtime is enabled.
 * Auto-invalidates React Query caches on CRUD events.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import authClient from '@/auth/authClient';
import { appConfig } from '@/config/app';
import { getRealtimeWsUrl, getRealtimeTicketUrl } from '@/config/runtime';

export interface RealtimeMessage {
  type: 'postgres_changes' | 'broadcast';
  table?: string;
  eventType?: 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  new?: Record<string, any>;
  old?: Record<string, any>;
  event?: string;
  payload?: Record<string, any>;
}

interface RealtimeContextValue {
  connected: boolean;
  subscribe: (handler: (msg: RealtimeMessage) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  subscribe: () => () => {},
});

export function useRealtime(handler: (msg: RealtimeMessage) => void) {
  const { subscribe } = useContext(RealtimeContext);
  useEffect(() => subscribe(handler), [subscribe, handler]);
}

export function useRealtimeStatus() {
  return useContext(RealtimeContext).connected;
}

async function fetchWsTicket(): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
      const jwt = localStorage.getItem('bearer_token');
      if (jwt) {
        headers['Authorization'] = `Bearer ${jwt}`;
      }
    }

    const res = await fetch(getRealtimeTicketUrl(), {
      method: 'POST',
      credentials: 'include',
      headers,
    });

    if (!res.ok) return null;

    const { wsTicket } = await res.json();
    return wsTicket || null;
  } catch {
    return null;
  }
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  if (!appConfig.features.realtime || !appConfig.routes.api.realtime) {
    return <>{children}</>;
  }

  return <RealtimeProviderInner>{children}</RealtimeProviderInner>;
}

function RealtimeProviderInner({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const queryClient = useQueryClient();

  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Set<(msg: RealtimeMessage) => void>>(new Set());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalClose = useRef(false);

  const disconnect = useCallback(() => {
    intentionalClose.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const connect = useCallback(async (orgId: string) => {
    disconnect();
    intentionalClose.current = false;

    const ticket = await fetchWsTicket();
    if (!ticket || intentionalClose.current) return;

    const wsUrl = `${getRealtimeWsUrl()}?ws_ticket=${encodeURIComponent(ticket)}&organizationId=${encodeURIComponent(orgId)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as RealtimeMessage;

        // Auto-invalidate React Query caches on CRUD events
        if (msg.type === 'postgres_changes' && msg.table) {
          queryClient.invalidateQueries({ queryKey: [msg.table] });
        }

        // Clear cached JWT when server signals auth context changed (role update, removal)
        if (msg.type === 'broadcast' && msg.event === 'auth:token-invalidated') {
          localStorage.removeItem('bearer_token');
        }

        // Notify all subscribers
        for (const handler of subscribersRef.current) {
          try {
            handler(msg);
          } catch {
            // Don't let subscriber errors break the loop
          }
        }
      } catch {
        // Ignore non-JSON messages (pong, etc.)
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;

      // Auto-reconnect unless intentionally closed
      if (!intentionalClose.current) {
        reconnectTimerRef.current = setTimeout(() => {
          connect(orgId);
        }, 2000);
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror — reconnect handled there
    };
  }, [disconnect, queryClient]);

  // Connect when session + org are available
  useEffect(() => {
    const orgId = activeOrg?.id;
    const isLoggedIn = !!session?.user?.id;

    if (isLoggedIn && orgId) {
      connect(orgId);
    } else {
      disconnect();
    }

    return () => disconnect();
  }, [session?.user?.id, activeOrg?.id, connect, disconnect]);

  const subscribe = useCallback(
    (handler: (msg: RealtimeMessage) => void) => {
      subscribersRef.current.add(handler);
      return () => {
        subscribersRef.current.delete(handler);
      };
    },
    []
  );

  return (
    <RealtimeContext.Provider value={{ connected, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}
