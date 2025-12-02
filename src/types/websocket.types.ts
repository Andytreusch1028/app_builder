/**
 * WebSocket Message Types for Real-time Updates
 * Used for streaming build progress, file changes, and quality metrics
 */

export enum WebSocketMessageType {
  BUILD_PROGRESS = 'build_progress',
  FILE_CHANGE = 'file_change',
  QUALITY_METRIC = 'quality_metric',
  TECHNOLOGY_USAGE = 'technology_usage',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong'
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
  timestamp: string;
  projectId?: string;
}

export interface BuildProgressData {
  projectId: string;
  step: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  message: string;
  progress?: number; // 0-100
  details?: {
    currentFile?: string;
    totalFiles?: number;
    completedFiles?: number;
    error?: string;
  };
}

export interface FileChangeData {
  projectId: string;
  action: 'created' | 'modified' | 'deleted' | 'renamed';
  path: string;
  oldPath?: string; // For rename operations
  content?: string; // For created/modified
  size?: number;
  timestamp: string;
}

export interface QualityMetricData {
  projectId: string;
  metric: 'complexity' | 'quality_score' | 'iteration_count' | 'improvement_delta';
  value: number;
  label: string;
  description?: string;
  timestamp: string;
}

export interface TechnologyUsageData {
  projectId: string;
  technology: string;
  action: 'started' | 'completed' | 'failed';
  duration?: number; // milliseconds
  details?: any;
  timestamp: string;
}

export interface ErrorData {
  projectId?: string;
  error: string;
  stack?: string;
  context?: any;
  timestamp: string;
}

// Helper function to create WebSocket messages
export function createWebSocketMessage(
  type: WebSocketMessageType,
  data: any,
  projectId?: string
): WebSocketMessage {
  return {
    type,
    data,
    timestamp: new Date().toISOString(),
    projectId
  };
}

// Helper function to create build progress message
export function createBuildProgressMessage(
  projectId: string,
  step: string,
  status: BuildProgressData['status'],
  message: string,
  progress?: number,
  details?: BuildProgressData['details']
): WebSocketMessage {
  return createWebSocketMessage(
    WebSocketMessageType.BUILD_PROGRESS,
    {
      projectId,
      step,
      status,
      message,
      progress,
      details
    } as BuildProgressData,
    projectId
  );
}

// Helper function to create file change message
export function createFileChangeMessage(
  projectId: string,
  action: FileChangeData['action'],
  path: string,
  content?: string,
  oldPath?: string
): WebSocketMessage {
  return createWebSocketMessage(
    WebSocketMessageType.FILE_CHANGE,
    {
      projectId,
      action,
      path,
      oldPath,
      content,
      timestamp: new Date().toISOString()
    } as FileChangeData,
    projectId
  );
}

// Helper function to create quality metric message
export function createQualityMetricMessage(
  projectId: string,
  metric: QualityMetricData['metric'],
  value: number,
  label: string,
  description?: string
): WebSocketMessage {
  return createWebSocketMessage(
    WebSocketMessageType.QUALITY_METRIC,
    {
      projectId,
      metric,
      value,
      label,
      description,
      timestamp: new Date().toISOString()
    } as QualityMetricData,
    projectId
  );
}

// Helper function to create technology usage message
export function createTechnologyUsageMessage(
  projectId: string,
  technology: string,
  action: TechnologyUsageData['action'],
  duration?: number,
  details?: any
): WebSocketMessage {
  return createWebSocketMessage(
    WebSocketMessageType.TECHNOLOGY_USAGE,
    {
      projectId,
      technology,
      action,
      duration,
      details,
      timestamp: new Date().toISOString()
    } as TechnologyUsageData,
    projectId
  );
}

