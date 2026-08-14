/**
 * useWebSocket - Real-time WebSocket Hook
 * 
 * Provides real-time connectivity for the TrialGPTBot Enterprise Review Dashboard.
 * Handles task queue updates, live notifications, and collaborative features.
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Message queuing during disconnection
 * - Connection health monitoring
 * - Message type routing
 * - Heartbeat/ping-pong keepalive
 * - Authentication token management
 * 
 * @hook
 * @example
 * ```tsx
 * const { 
 *   isConnected, 
 *   lastMessage, 
 *   sendMessage,
 *   connectionHistory 
 * } = useWebSocket('wss://api.trialgptbot.enterprise/ws/review-queue', {
 *   authToken: 'your-jwt-token',
 *   enableHeartbeat: true,
 * });
 * ```
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface WebSocketMessage {
  /** Unique message identifier */
  id: string;
  /** Message type for routing */
  type: 
    | 'task_created'
    | 'task_updated'
    | 'task_completed'
    | 'task_escalated'
    | 'queue_update'
    | 'stats_refresh'
    | 'user_joined'
    | 'user_left'
    | 'broadcast'
    | 'error'
    | 'heartbeat'
    | 'auth_required'
    | 'auth_success'
    | 'rate_limit';
  /** Timestamp when message was sent */
  timestamp: Date;
  /** Message payload (varies by type) */
  payload: any;
  /** Source user/system that generated the message */
  source: string;
  /** Target audience ('all', 'team', 'user:{id}') */
  target: string;
  /** Message priority for ordering */
  priority: 'low' | 'normal' | 'high' | 'critical';
  /** Whether this message requires acknowledgment */
  requiresAck: boolean;
  /** Correlation ID for request-response patterns */
  correlationId?: string;
}

export interface WebSocketConfig {
  /** Authentication token for secure connections */
  authToken?: string;
  /** Enable heartbeat/ping-pong keepalive */
  enableHeartbeat?: boolean;
  /** Heartbeat interval in milliseconds (default: 30000) */
  heartbeatInterval?: number;
  /** Connection timeout in milliseconds (default: 10000) */
  connectionTimeout?: number;
  /** Maximum reconnection attempts (default: 10) */
  maxReconnectAttempts?: number;
  /** Enable automatic reconnection */
  autoReconnect?: boolean;
  /** Initial reconnection delay in milliseconds (default: 1000) */
  initialReconnectDelay?: number;
  /** Maximum reconnection delay in milliseconds (default: 30000) */
  maxReconnectDelay?: number;
  /** Enable message buffering while disconnected */
  bufferMessages?: boolean;
  /** Maximum buffered messages (default: 100) */
  maxBufferSize?: number;
  /** Debug mode for console logging */
  debug?: boolean;
  /** Custom protocols array */
  protocols?: string[];
  /** Additional headers for connection */
  headers?: Record<string, string>;
  /** Callback on successful connection */
  onConnect?: () => void;
  /** Callback on disconnection */
  onDisconnect?: (code: number, reason: string) => void;
  /** Callback on error */
  onError?: (error: Event) => void;
  /** Callback on message received */
  onMessage?: (message: WebSocketMessage) => void;
  /** Callback on reconnection attempt */
  onReconnect?: (attempt: number) => void;
  /** Callback when max reconnect attempts reached */
  onMaxReconnectReached?: () => void;
}

export interface WebSocketState {
  /** Current connection status */
  status: 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'reconnecting' | 'error';
  /** Whether the socket is currently connected */
  isConnected: boolean;
  /** Number of reconnection attempts */
  reconnectAttempt: number;
  /** Last successful connection time */
  lastConnectedAt: Date | null;
  /** Last disconnection time */
  lastDisconnectedAt: Date | null;
  /** Total messages received */
  totalMessagesReceived: number;
  /** Total messages sent */
  totalMessagesSent: number;
  /** Last error encountered */
  lastError: Error | null;
  /** Average latency in milliseconds */
  averageLatency: number;
  /** Connection history for analytics */
  connectionHistory: ConnectionEvent[];
}

export interface ConnectionEvent {
  /** Event type */
  type: 'connect' | 'disconnect' | 'reconnect' | 'error' | 'heartbeat_missed';
  /** When the event occurred */
  timestamp: Date;
  /** Additional event data */
  data?: any;
}

export interface QueuedMessage {
  /** The message to send */
  message: any;
  /** When it was queued */
  queuedAt: Date;
  /** Number of retry attempts */
  attempts: number;
  /** Maximum retries before discarding */
  maxRetries: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: Required<WebSocketConfig> = {
  authToken: '',
  enableHeartbeat: true,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
  maxReconnectAttempts: 10,
  autoReconnect: true,
  initialReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  bufferMessages: true,
  maxBufferSize: 100,
  debug: false,
  protocols: [],
  headers: {},
  onConnect: () => {},
  onDisconnect: () => {},
  onError: () => {},
  onMessage: () => {},
  onReconnect: () => {},
  onMaxReconnectReached: () => {},
};

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * useWebSocket - React hook for WebSocket connectivity
 * 
 * Manages WebSocket lifecycle including:
 * - Connection establishment and teardown
 * - Automatic reconnection with exponential backoff
 * - Message buffering during disconnections
 * - Heartbeat monitoring
 * - Connection health tracking
 * 
 * @param url - WebSocket endpoint URL
 * @param config - Configuration options
 * @returns WebSocket state and control methods
 */
export function useWebSocket(url: string, config: WebSocketConfig = {}) {
  // Merge configuration with defaults
  const cfg: Required<WebSocketConfig> = { ...DEFAULT_CONFIG, ...config };
  
  // Refs for mutable values (avoid stale closures)
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageBufferRef = useRef<QueuedMessage[]>([]);
  const unmountedRef = useRef(false);

  // State
  const [status, setStatus] = useState<WebSocketState['status']>('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
  const [lastDisconnectedAt, setLastDisconnectedAt] = useState<Date | null>(null);
  const [totalMessagesReceived, setTotalMessagesReceived] = useState(0);
  const [totalMessagesSent, setTotalMessagesSent] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [averageLatency, setAverageLatency] = useState(0);
  const [connectionHistory, setConnectionHistory] = useState<ConnectionEvent[]>([]);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  /**
   * Add connection event to history
   */
  const addConnectionEvent = useCallback((event: ConnectionEvent) => {
    setConnectionHistory(prev => [...prev.slice(-99), event]);
    if (cfg.debug) {
      console.log('[WebSocket] Event:', event.type, event.data || '');
    }
  }, [cfg.debug]);

  /**
   * Calculate exponential backoff delay
   */
  const getReconnectDelay = useCallback((attempt: number): number => {
    const baseDelay = cfg.initialReconnectDelay;
    const maxDelay = cfg.maxReconnectDelay;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter (±25%)
    return delay * (0.75 + Math.random() * 0.5);
  }, [cfg.initialReconnectDelay, cfg.maxReconnectDelay]);

  /**
   * Clear all timeouts to prevent memory leaks
   */
  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  /**
   * Start heartbeat monitoring
   */
  const startHeartbeat = useCallback(() => {
    if (!cfg.enableHeartbeat || !socketRef.current) return;

    // Send ping at regular intervals
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        sendRaw({ type: 'heartbeat', timestamp: new Date() });
      }
    }, cfg.heartbeatInterval);

    // Set up response timeout detection
    resetHeartbeatTimeout();
  }, [cfg.enableHeartbeat, cfg.heartbeatInterval]);

  /**
   * Reset heartbeat timeout (expecting pong)
   */
  const resetHeartbeatTimeout = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }

    heartbeatTimeoutRef.current = setTimeout(() => {
      if (cfg.debug) {
        console.warn('[WebSocket] Heartbeat timeout - connection may be dead');
      }
      addConnectionEvent({
        type: 'heartbeat_missed',
        timestamp: new Date(),
      });
      
      // Force close and reconnect
      socketRef.current?.close(4000, 'Heartbeat timeout');
    }, cfg.heartbeatInterval * 1.5); // Allow 1.5x interval for response
  }, [cfg.heartbeatInterval, cfg.debug, addConnectionEvent]);

  /**
   * Send raw data through WebSocket
   */
  const sendRaw = useCallback((data: any): boolean => {
    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(data));
        setTotalMessagesSent(prev => prev + 1);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[WebSocket] Send error:', error);
      return false;
    }
  }, []);

  /**
   * Queue message for later sending (when reconnected)
   */
  const queueMessage = useCallback((message: any, maxRetries: number = 3) => {
    if (messageBufferRef.current.length >= cfg.maxBufferSize) {
      // Remove oldest message
      messageBufferRef.current.shift();
    }

    messageBufferRef.current.push({
      message,
      queuedAt: new Date(),
      attempts: 0,
      maxRetries,
    });

    if (cfg.debug) {
      console.log('[WebSocket] Message queued:', message.type || 'unknown');
    }
  }, [cfg.maxBufferSize, cfg.debug]);

  /**
   * Flush all buffered messages
   */
  const flushMessageBuffer = useCallback(() => {
    const buffer = [...messageBufferRef.current];
    messageBufferRef.current = [];

    let successCount = 0;
    let failCount = 0;

    buffer.forEach(qm => {
      qm.attempts++;
      if (qm.attempts <= qm.maxRetries) {
        if (sendRaw(qm.message)) {
          successCount++;
        } else {
          messageBufferRef.current.push(qm);
          failCount++;
        }
      }
    });

    if (cfg.debug && (successCount > 0 || failCount > 0)) {
      console.log(`[WebSocket] Buffer flushed: ${successCount} sent, ${failCount} re-queued`);
    }
  }, [sendRaw, cfg.debug]);

  /**
   * Handle incoming message
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      const message: WebSocketMessage = {
        id: data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: data.type || 'broadcast',
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        payload: data.payload || data,
        source: data.source || 'system',
        target: data.target || 'all',
        priority: data.priority || 'normal',
        requiresAck: data.requiresAck || false,
        correlationId: data.correlationId,
      };

      // Handle heartbeat responses
      if (message.type === 'heartbeat') {
        resetHeartbeatTimeout();
        // Update latency measurement
        if (message.payload?.responseTime) {
          setAverageLatency(prev => {
            const newLatency = message.payload.responseTime;
            return prev === 0 ? newLatency : prev * 0.9 + newLatency * 0.1; // EMA
          });
        }
        return;
      }

      // Update state
      setLastMessage(message);
      setTotalMessagesReceived(prev => prev + 1);

      // Call external handler
      cfg.onMessage(message);

      // Auto-acknowledge if required
      if (message.requiresAck) {
        sendRaw({
          type: 'ack',
          messageId: message.id,
          timestamp: new Date(),
        });
      }

      if (cfg.debug) {
        console.log(`[WebSocket] Received: ${message.type}`, message.payload);
      }
    } catch (error) {
      console.error('[WebSocket] Parse error:', error);
    }
  }, [resetHeartbeatTimeout, sendRaw, cfg.onMessage, cfg.debug]);

  /**
   * Handle connection open
   */
  const handleOpen = useCallback(() => {
    setStatus('connected');
    setIsConnected(true);
    setReconnectAttempt(0);
    setLastError(null);
    setLastConnectedAt(new Date());
    
    addConnectionEvent({
      type: 'connect',
      timestamp: new Date(),
      data: { url },
    });

    // Clear connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    // Start heartbeat
    startHeartbeat();

    // Flush buffered messages
    flushMessageBuffer();

    // Call external handler
    cfg.onConnect();

    if (cfg.debug) {
      console.log('[WebSocket] Connected to', url);
    }
  }, [url, startHeartbeat, flushMessageBuffer, addConnectionEvent, cfg.onConnect, cfg.debug]);

  /**
   * Handle connection close
   */
  const handleClose = useCallback((event: CloseEvent) => {
    setIsConnected(false);
    setLastDisconnectedAt(new Date());
    setStatus('disconnected');

    clearTimeouts();
    addConnectionEvent({
      type: 'disconnect',
      timestamp: new Date(),
      data: { code: event.code, reason: event.reason },
    });

    cfg.onDisconnect(event.code, event.reason);

    if (cfg.debug) {
      console.log(`[WebSocket] Disconnected: ${event.code} - ${event.reason}`);
    }

    // Attempt reconnection if enabled and not intentionally closed
    if (cfg.autoReconnect && event.code !== 1000 && !unmountedRef.current) {
      attemptReconnect();
    }
  }, [clearTimeouts, addConnectionEvent, cfg.autoReconnect, cfg.onDisconnect, cfg.debug]);

  /**
   * Handle connection error
   */
  const handleError = useCallback((event: Event) => {
    const error = new Error('WebSocket connection error');
    setLastError(error);
    setStatus('error');

    addConnectionEvent({
      type: 'error',
      timestamp: new Date(),
    });

    cfg.onError(event);

    if (cfg.debug) {
      console.error('[WebSocket] Error:', event);
    }
  }, [addConnectionEvent, cfg.onError, cfg.debug]);

  /**
   * Attempt to reconnect
   */
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempt >= cfg.maxReconnectAttempts) {
      if (cfg.debug) {
        console.error('[WebSocket] Max reconnect attempts reached');
      }
      cfg.onMaxReconnectReached();
      return;
    }

    const nextAttempt = reconnectAttempt + 1;
    setReconnectAttempt(nextAttempt);
    setStatus('reconnecting');

    addConnectionEvent({
      type: 'reconnect',
      timestamp: new Date(),
      data: { attempt: nextAttempt },
    });

    cfg.onReconnect(nextAttempt);

    const delay = getReconnectDelay(nextAttempt);

    if (cfg.debug) {
      console.log(`[WebSocket] Reconnecting in ${Math.round(delay)}ms (attempt ${nextAttempt})`);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (!unmountedRef.current) {
        connect();
      }
    }, delay);
  }, [reconnectAttempt, cfg.maxReconnectAttempts, cfg.onReconnect, cfg.onMaxReconnectReached, cfg.debug, getReconnectDelay, addConnectionEvent]);

  /**
   * Establish WebSocket connection
   */
  const connect = useCallback(() => {
    // Don't connect if already connected or connecting
    if (socketRef.current?.readyState === WebSocket.OPEN || 
        socketRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setStatus('connecting');
    clearTimeouts();

    try {
      // Build URL with auth token if provided
      let wsUrl = url;
      if (cfg.authToken) {
        const separator = url.includes('?') ? '&' : '?';
        wsUrl = `${url}${separator}token=${encodeURIComponent(cfg.authToken)}`;
      }

      // Create new WebSocket
      const socket = cfg.protocols.length > 0 
        ? new WebSocket(wsUrl, cfg.protocols)
        : new WebSocket(wsUrl);

      socketRef.current = socket;

      // Set up connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (socket.readyState === WebSocket.CONNECTING) {
          socket.close(4001, 'Connection timeout');
          setLastError(new Error('Connection timeout'));
        }
      }, cfg.connectionTimeout);

      // Attach event handlers
      socket.onopen = handleOpen;
      socket.onmessage = handleMessage;
      socket.onclose = handleClose;
      socket.onerror = handleError;

    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      setLastError(error as Error);
      setStatus('error');
      
      if (cfg.autoReconnect) {
        attemptReconnect();
      }
    }
  }, [url, cfg.authToken, cfg.protocols, cfg.connectionTimeout, cfg.autoReconnect, clearTimeouts, handleOpen, handleMessage, handleClose, handleError, attemptReconnect]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback((code: number = 1000, reason: string = 'Client disconnect') => {
    clearTimeouts();
    
    if (socketRef.current) {
      socketRef.current.close(code, reason);
      socketRef.current = null;
    }

    setIsConnected(false);
    setStatus('disconnected');
    setLastDisconnectedAt(new Date());

    if (cfg.debug) {
      console.log(`[WebSocket] Disconnected: ${code} - ${reason}`);
    }
  }, [clearTimeouts, cfg.debug]);

  /**
   * Send a typed message through WebSocket
   */
  const sendMessage = useCallback((
    type: WebSocketMessage['type'],
    payload: any,
    options: {
      priority?: WebSocketMessage['priority'];
      target?: string;
      requiresAck?: boolean;
      correlationId?: string;
    } = {}
  ): boolean => {
    const message: Partial<WebSocketMessage> = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date(),
      payload,
      source: 'client',
      ...options,
    };

    const sent = sendRaw(message);

    if (!sent && cfg.bufferMessages) {
      queueMessage(message);
    }

    return sent;
  }, [sendRaw, cfg.bufferMessages, queueMessage]);

  /**
   * Request a specific task update
   */
  const requestTaskUpdate = useCallback((taskId: string) => {
    sendMessage('task_updated', { taskId }, { target: `task:${taskId}` });
  }, [sendMessage]);

  /**
   * Join a review room/team channel
   */
  const joinRoom = useCallback((roomId: string) => {
    sendMessage('user_joined', { roomId }, { target: roomId });
  }, [sendMessage]);

  /**
   * Leave a review room/team channel
   */
  const leaveRoom = useCallback((roomId: string) => {
    sendMessage('user_left', { roomId }, { target: roomId });
  }, [sendMessage]);

  /**
   * Broadcast a notification to all reviewers
   */
  const broadcast = useCallback((notification: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    taskIds?: string[];
  }) => {
    sendMessage('broadcast', notification, { priority: 'normal', target: 'all' });
  }, [sendMessage]);

  /**
   * Get current connection statistics
   */
  const getStats = useCallback(() => ({
    status,
    isConnected,
    reconnectAttempt,
    lastConnectedAt,
    lastDisconnectedAt,
    totalMessagesReceived,
    totalMessagesSent,
    lastError,
    averageLatency,
    bufferSize: messageBufferRef.current.length,
    connectionHistoryLength: connectionHistory.length,
  }), [status, isConnected, reconnectAttempt, lastConnectedAt, lastDisconnectedAt, totalMessagesReceived, totalMessagesSent, lastError, averageLatency, connectionHistory.length]);

  // ==========================================================================
  // LIFECYCLE EFFECTS
  // ==========================================================================

  // Connect on mount
  useEffect(() => {
    unmountedRef.current = false;
    connect();

    return () => {
      unmountedRef.current = true;
      disconnect();
    };
  }, []); // Only run once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounting');
        socketRef.current = null;
      }
    };
  }, [clearTimeouts]);

  // ==========================================================================
  // RETURN VALUE
  // ==========================================================================

  const state: WebSocketState = {
    status,
    isConnected,
    reconnectAttempt,
    lastConnectedAt,
    lastDisconnectedAt,
    totalMessagesReceived,
    totalMessagesSent,
    lastError,
    averageLatency,
    connectionHistory,
  };

  return {
    // State
    ...state,
    lastMessage,

    // Actions
    connect,
    disconnect,
    sendMessage,
    requestTaskUpdate,
    joinRoom,
    leaveRoom,
    broadcast,

    // Utilities
    getStats,

    // Refs for advanced usage
    socketRef,
    messageBufferRef,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useWebSocket;

// Type exports
export type {
  WebSocketMessage,
  WebSocketConfig,
  WebSocketState,
  ConnectionEvent,
  QueuedMessage,
};
