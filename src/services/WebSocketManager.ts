/**
 * WebSocket Manager Service
 * Manages WebSocket connections and broadcasts real-time updates
 */

import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { WebSocketMessage, WebSocketMessageType } from '../types/websocket.types.js';

export class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private projectSubscriptions: Map<string, Set<WebSocket>> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 WebSocket client connected');
      this.clients.add(ws);

      // Send welcome message
      this.sendToClient(ws, {
        type: WebSocketMessageType.PING,
        data: { message: 'Connected to Application Builder' },
        timestamp: new Date().toISOString()
      });

      // Handle messages from client
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        this.clients.delete(ws);
        
        // Remove from all project subscriptions
        this.projectSubscriptions.forEach((subscribers) => {
          subscribers.delete(ws);
        });
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log('✅ WebSocket server initialized');
  }

  /**
   * Handle messages from client
   */
  private handleClientMessage(ws: WebSocket, data: any): void {
    if (data.type === 'subscribe' && data.projectId) {
      this.subscribeToProject(ws, data.projectId);
    } else if (data.type === 'unsubscribe' && data.projectId) {
      this.unsubscribeFromProject(ws, data.projectId);
    } else if (data.type === 'ping') {
      this.sendToClient(ws, {
        type: WebSocketMessageType.PONG,
        data: { message: 'pong' },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Subscribe client to project updates
   */
  private subscribeToProject(ws: WebSocket, projectId: string): void {
    if (!this.projectSubscriptions.has(projectId)) {
      this.projectSubscriptions.set(projectId, new Set());
    }
    this.projectSubscriptions.get(projectId)!.add(ws);
    console.log(`📡 Client subscribed to project: ${projectId}`);
  }

  /**
   * Unsubscribe client from project updates
   */
  private unsubscribeFromProject(ws: WebSocket, projectId: string): void {
    const subscribers = this.projectSubscriptions.get(projectId);
    if (subscribers) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        this.projectSubscriptions.delete(projectId);
      }
    }
    console.log(`📡 Client unsubscribed from project: ${projectId}`);
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  /**
   * Broadcast message to clients subscribed to a specific project
   */
  broadcastToProject(projectId: string, message: WebSocketMessage): void {
    const subscribers = this.projectSubscriptions.get(projectId);
    if (!subscribers || subscribers.size === 0) {
      // If no subscribers, broadcast to all clients
      this.broadcast(message);
      return;
    }

    const messageStr = JSON.stringify(message);
    subscribers.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  /**
   * Send message to specific client
   */
  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get number of project subscriptions
   */
  getProjectSubscriptionCount(): number {
    return this.projectSubscriptions.size;
  }

  /**
   * Close all connections and shutdown
   */
  shutdown(): void {
    this.clients.forEach((client) => {
      client.close();
    });
    this.clients.clear();
    this.projectSubscriptions.clear();

    if (this.wss) {
      this.wss.close();
    }

    console.log('🔌 WebSocket server shutdown');
  }

  /**
   * Send build progress update (compatibility method for builder routes)
   */
  sendBuildProgress(data: {
    buildId: string;
    status: string;
    progress: number;
    message: string;
  }): void {
    this.broadcast({
      type: WebSocketMessageType.BUILD_PROGRESS,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send build complete notification (compatibility method for builder routes)
   */
  sendBuildComplete(data: {
    buildId: string;
    success: boolean;
    files: string[];
    duration: number;
  }): void {
    this.broadcast({
      type: WebSocketMessageType.BUILD_PROGRESS,
      data: {
        buildId: data.buildId,
        status: 'completed',
        progress: 100,
        message: data.success ? `Build complete! Generated ${data.files?.length || 0} files` : 'Build failed',
        success: data.success,
        files: data.files,
        duration: data.duration
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send quality metric update (compatibility method for builder routes)
   */
  sendQualityMetric(data: {
    buildId: string;
    metric: string;
    value: number;
    label: string;
  }): void {
    this.broadcast({
      type: WebSocketMessageType.QUALITY_METRIC,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send build error notification (compatibility method for builder routes)
   */
  sendBuildError(data: {
    buildId: string;
    error: string;
  }): void {
    this.broadcast({
      type: WebSocketMessageType.ERROR,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send file change notification (compatibility method for builder routes)
   */
  sendFileChange(data: {
    projectId: string;
    filePath: string;
    action: 'created' | 'modified' | 'deleted';
  }): void {
    this.broadcast({
      type: WebSocketMessageType.FILE_CHANGE,
      data,
      timestamp: new Date().toISOString()
    });
  }
}

// Singleton instance
export const webSocketManager = new WebSocketManager();

