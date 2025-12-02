import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

/**
 * WebSocket Service for real-time updates
 * Broadcasts build progress, file changes, and quality metrics to connected clients
 */

export interface WebSocketMessage {
  type: 'build_progress' | 'file_change' | 'quality_metric' | 'build_complete' | 'build_error';
  data: any;
  timestamp: string;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('✅ WebSocket client connected');
      this.clients.add(ws);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'build_progress',
        data: { message: 'Connected to build server' },
        timestamp: new Date().toISOString()
      });

      ws.on('close', () => {
        console.log('❌ WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log('🔌 WebSocket server initialized on /ws');
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: WebSocket, message: WebSocketMessage): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: WebSocketMessage): void {
    const payload = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  /**
   * Send build progress update
   */
  sendBuildProgress(data: {
    buildId: string;
    status: string;
    progress: number;
    message: string;
  }): void {
    this.broadcast({
      type: 'build_progress',
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send file change notification
   */
  sendFileChange(data: {
    projectId: string;
    filePath: string;
    action: 'created' | 'modified' | 'deleted';
  }): void {
    this.broadcast({
      type: 'file_change',
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send quality metric update
   */
  sendQualityMetric(data: {
    buildId: string;
    metric: string;
    value: number;
    label: string;
  }): void {
    this.broadcast({
      type: 'quality_metric',
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send build complete notification
   */
  sendBuildComplete(data: {
    buildId: string;
    success: boolean;
    files: string[];
    duration: number;
  }): void {
    this.broadcast({
      type: 'build_complete',
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send build error notification
   */
  sendBuildError(data: {
    buildId: string;
    error: string;
  }): void {
    this.broadcast({
      type: 'build_error',
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Close all connections and shutdown
   */
  shutdown(): void {
    this.clients.forEach((client) => {
      client.close();
    });
    this.clients.clear();
    this.wss?.close();
    console.log('🔌 WebSocket server shutdown');
  }
}

