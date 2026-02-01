/**
 * Performance Monitor for Barkley Research Platform
 * Tracks system performance, document processing metrics, and AI analysis efficiency
 */

import { EventEmitter } from 'events';

export interface PerformanceMetrics {
  timestamp: Date;
  documentProcessing: {
    totalDocuments: number;
    averageProcessingTime: number;
    successRate: number;
    errorRate: number;
    throughput: number;
    queueLength: number;
    activeJobs: number;
  };
  aiAnalysis: {
    totalRequests: number;
    averageResponseTime: number;
    providerUsage: Record<string, number>;
    successRate: number;
    rateLimitHits: number;
    failoverEvents: number;
  };
  chunking: {
    totalChunks: number;
    averageChunkSize: number;
    strategyUsage: Record<string, number>;
    averageChunkingTime: number;
    qualityScore: number;
  };
  validation: {
    totalValidations: number;
    averageValidationScore: number;
    reprocessingRate: number;
    issuesFound: number;
    recommendationsGenerated: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkLatency: number;
    uptime: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  category: 'performance' | 'quality' | 'system' | 'security';
  message: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
}

export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
    duration: number;
  };
  summary: {
    totalDocuments: number;
    successRate: number;
    averageProcessingTime: number;
    totalIssues: number;
    systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
  metrics: PerformanceMetrics;
  recommendations: string[];
  alerts: PerformanceAlert[];
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private isCollecting = false;
  private collectionInterval: NodeJS.Timeout | null = null;

  private alertThresholds = {
    maxProcessingTime: 30000, // 30 seconds
    minSuccessRate: 0.9,
    maxQueueLength: 50,
    maxMemoryUsage: 0.8,
    minQualityScore: 0.75,
    maxResponseTime: 10000, // 10 seconds
  };

  constructor() {
    super();
  }

  /**
   * Start collecting performance metrics
   */
  startCollection(intervalMs: number = 60000): void {
    if (this.isCollecting) {
      return;
    }

    this.isCollecting = true;
    this.collectionInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);
        this.checkAlerts(metrics);
        this.emit('metrics:collected', metrics);

        // Keep only last 1000 metrics to prevent memory issues
        if (this.metrics.length > 1000) {
          this.metrics = this.metrics.slice(-1000);
        }
      } catch (error) {
        console.error('Performance metrics collection failed:', error);
      }
    }, intervalMs);

    this.emit('collection:started');
  }

  /**
   * Stop collecting performance metrics
   */
  stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    this.isCollecting = false;
    this.emit('collection:stopped');
  }

  /**
   * Collect current performance metrics
   */
  private async collectMetrics(): Promise<PerformanceMetrics> {
    const [
      documentProcessing,
      aiAnalysis,
      chunking,
      validation,
      system
    ] = await Promise.all([
      this.collectDocumentProcessingMetrics(),
      this.collectAIAnalysisMetrics(),
      this.collectChunkingMetrics(),
      this.collectValidationMetrics(),
      this.collectSystemMetrics()
    ]);

    return {
      timestamp: new Date(),
      documentProcessing,
      aiAnalysis,
      chunking,
      validation,
      system
    };
  }

  /**
   * Collect document processing metrics
   */
  private async collectDocumentProcessingMetrics(): Promise<PerformanceMetrics['documentProcessing']> {
    return {
      totalDocuments: 0,
      averageProcessingTime: 0,
      successRate: 1.0,
      errorRate: 0,
      throughput: 0,
      queueLength: 0,
      activeJobs: 0
    };
  }

  /**
   * Collect AI analysis metrics
   */
  private async collectAIAnalysisMetrics(): Promise<PerformanceMetrics['aiAnalysis']> {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      providerUsage: {},
      successRate: 1.0,
      rateLimitHits: 0,
      failoverEvents: 0
    };
  }

  /**
   * Collect chunking metrics
   */
  private async collectChunkingMetrics(): Promise<PerformanceMetrics['chunking']> {
    return {
      totalChunks: 0,
      averageChunkSize: 0,
      strategyUsage: {},
      averageChunkingTime: 0,
      qualityScore: 0.8
    };
  }

  /**
   * Collect validation metrics
   */
  private async collectValidationMetrics(): Promise<PerformanceMetrics['validation']> {
    return {
      totalValidations: 0,
      averageValidationScore: 0.8,
      reprocessingRate: 0.05,
      issuesFound: 0,
      recommendationsGenerated: 0
    };
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<PerformanceMetrics['system']> {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      memoryUsage: memoryUsage.heapUsed / memoryUsage.heapTotal,
      cpuUsage: await this.getCPUUsage(),
      diskUsage: 0,
      networkLatency: 0,
      uptime
    };
  }

  /**
   * Get CPU usage percentage
   */
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = Date.now();
        const timeDiff = endTime - startTime;

        const cpuPercent = (endUsage.user + endUsage.system) / (timeDiff * 1000);
        resolve(Math.min(cpuPercent, 1.0));
      }, 100);
    });
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // Check processing time
    if (metrics.documentProcessing.averageProcessingTime > this.alertThresholds.maxProcessingTime) {
      alerts.push({
        id: `processing-time-${Date.now()}`,
        type: 'warning',
        category: 'performance',
        message: 'High average processing time detected',
        details: {
          currentTime: metrics.documentProcessing.averageProcessingTime,
          threshold: this.alertThresholds.maxProcessingTime
        },
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check memory usage
    if (metrics.system.memoryUsage > this.alertThresholds.maxMemoryUsage) {
      alerts.push({
        id: `memory-usage-${Date.now()}`,
        type: 'critical',
        category: 'system',
        message: 'High memory usage detected',
        details: {
          currentUsage: metrics.system.memoryUsage,
          threshold: this.alertThresholds.maxMemoryUsage
        },
        timestamp: new Date(),
        resolved: false
      });
    }

    // Add new alerts
    this.alerts.push(...alerts);

    // Emit alerts
    alerts.forEach(alert => {
      this.emit('alert:triggered', alert);
    });

    // Clean up old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Export metrics data
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.metrics, null, 2);
    }

    // CSV format
    const headers = [
      'timestamp',
      'totalDocuments',
      'averageProcessingTime',
      'successRate',
      'memoryUsage',
      'cpuUsage'
    ];

    const rows = this.metrics.map(m => [
      m.timestamp.toISOString(),
      m.documentProcessing.totalDocuments,
      m.documentProcessing.averageProcessingTime,
      m.documentProcessing.successRate,
      m.system.memoryUsage,
      m.system.cpuUsage
    ]);

    return [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
  }
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor();