/**
 * Tests for logging system
 */

import { logger, LogLevel } from '../logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    logger.clearLogs();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('logging methods', () => {
    it('should log info messages', () => {
      logger.info('Test info message', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalled();
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Test info message');
      expect(logs[0].context).toEqual({ key: 'value' });
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].error?.message).toBe('Test error');
    });

    it('should log warning messages', () => {
      logger.warn('Test warning', { warning: true });
      expect(consoleWarnSpy).toHaveBeenCalled();
      const logs = logger.getRecentLogs();
      expect(logs[0].level).toBe(LogLevel.WARN);
    });
  });

  describe('log filtering', () => {
    it('should filter logs by level', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      const errorLogs = logger.getRecentLogs(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('Error message');

      const warnAndAbove = logger.getRecentLogs(LogLevel.WARN);
      expect(warnAndAbove).toHaveLength(2);
    });
  });

  describe('performance timing', () => {
    it('should measure performance with startTimer', async () => {
      const endTimer = logger.startTimer('test-operation');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const duration = endTimer();
      expect(duration).toBeGreaterThan(40);
      expect(duration).toBeLessThan(200);

      const logs = logger.getRecentLogs(LogLevel.DEBUG);
      const timerLog = logs.find(log => log.context?.label === 'test-operation');
      expect(timerLog).toBeDefined();
      expect(timerLog?.context?.type).toBe('performance');
    });
  });

  describe('specialized logging', () => {
    it('should log API requests', () => {
      logger.logRequest('GET', '/api/test', { userId: '123' });
      const logs = logger.getRecentLogs();
      expect(logs[0].message).toContain('GET /api/test');
      expect(logs[0].context?.type).toBe('request');
      expect(logs[0].context?.userId).toBe('123');
    });

    it('should log API responses', () => {
      logger.logResponse('POST', '/api/test', 201, 150);
      const logs = logger.getRecentLogs();
      expect(logs[0].message).toContain('POST /api/test 201 150ms');
      expect(logs[0].context?.status).toBe(201);
      expect(logs[0].context?.duration).toBe(150);
    });

    it('should log document processing', () => {
      logger.logDocumentProcessing('extraction', 'doc-123', { pages: 10 });
      const logs = logger.getRecentLogs();
      expect(logs[0].message).toContain('Document processing: extraction');
      expect(logs[0].context?.documentId).toBe('doc-123');
      expect(logs[0].context?.pages).toBe(10);
    });
  });
});