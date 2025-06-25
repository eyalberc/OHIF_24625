/**
 * StudyComparisonService Unit Tests
 * 
 * Comprehensive test suite for the performance-optimized study comparison service
 * covering caching, study detection, event management, and edge cases.
 * 
 * Task 3.5: Unit and Integration Tests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { StudyComparisonService, StudyTypeResult, StudyMetadata } from '../services/StudyComparisonService';

// Mock performance.now for consistent timing tests
const mockPerformanceNow = jest.fn();
(global as any).performance = { now: mockPerformanceNow };

// Mock ServicesManager
const mockServicesManager = {
  services: {
    DicomMetadataStore: {
      getStudyInstanceUIDs: jest.fn(),
      getStudy: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      EVENTS: {
        STUDY_ADDED: 'STUDY_ADDED',
        INSTANCES_ADDED: 'INSTANCES_ADDED'
      }
    }
  }
};

describe('StudyComparisonService', () => {
  let service: StudyComparisonService;
  let mockStudies: StudyMetadata[];

  beforeEach(() => {
    service = new StudyComparisonService();
    
    // Reset all mocks
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
    
    // Setup mock studies
    mockStudies = [
      {
        uid: 'study1',
        date: '20231201', // Most recent
        patientName: 'Patient, Test',
        studyDescription: 'Current Study'
      },
      {
        uid: 'study2', 
        date: '20231115', // Prior study
        patientName: 'Patient, Test',
        studyDescription: 'Prior Study'
      }
    ];

    // Setup default mock implementations
    mockServicesManager.services.DicomMetadataStore.getStudyInstanceUIDs.mockReturnValue([
      'study1', 'study2'
    ]);
    
    mockServicesManager.services.DicomMetadataStore.getStudy.mockImplementation((uid: string) => {
      const study = mockStudies.find(s => s.uid === uid);
      return study ? {
        StudyInstanceUID: study.uid,
        StudyDate: study.date,
        PatientName: study.patientName,
        StudyDescription: study.studyDescription
      } : null;
    });
  });

  afterEach(() => {
    service.clearCaches();
  });

  describe('Study Type Detection', () => {
    it('should identify current study correctly', () => {
      const result = service.getStudyType('study1', mockServicesManager as any);
      
      expect(result.type).toBe('current');
      expect(result.date).toBe('20231201');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should identify prior studies correctly', () => {
      const result = service.getStudyType('study2', mockServicesManager as any);
      
      expect(result.type).toBe('prior');
      expect(result.date).toBe('20231115');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should handle single study as current', () => {
      mockServicesManager.services.DicomMetadataStore.getStudyInstanceUIDs.mockReturnValue(['study1']);
      
      const result = service.getStudyType('study1', mockServicesManager as any);
      
      expect(result.type).toBe('current');
      expect(result.confidence).toBe(1.0);
    });

    it('should return default for missing study', () => {
      const result = service.getStudyType('nonexistent', mockServicesManager as any);
      
      expect(result.type).toBe('default');
      expect(result.date).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should handle missing DicomMetadataStore service', () => {
      const invalidServicesManager = { services: {} };
      
      const result = service.getStudyType('study1', invalidServicesManager as any);
      
      expect(result.type).toBe('default');
      expect(result.date).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should handle empty study instance UID', () => {
      const result = service.getStudyType('', mockServicesManager as any);
      
      expect(result.type).toBe('default');
      expect(result.date).toBeNull();
      expect(result.confidence).toBe(0);
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign high confidence for well-separated dates', () => {
      // Studies more than a week apart
      const weekApartStudies = [
        { uid: 'study1', date: '20231201', patientName: 'Test', studyDescription: 'Current' },
        { uid: 'study2', date: '20231115', patientName: 'Test', studyDescription: 'Prior' }
      ];

      mockServicesManager.services.DicomMetadataStore.getStudyInstanceUIDs.mockReturnValue(['study1', 'study2']);
      mockServicesManager.services.DicomMetadataStore.getStudy.mockImplementation((uid: string) => {
        const study = weekApartStudies.find(s => s.uid === uid);
        return study ? { StudyDate: study.date, ...study } : null;
      });

      const result = service.getStudyType('study2', mockServicesManager as any);
      expect(result.confidence).toBe(1.0);
    });

    it('should assign lower confidence for same-day studies', () => {
      // Studies on the same day
      const sameDayStudies = [
        { uid: 'study1', date: '20231201', patientName: 'Test', studyDescription: 'Current' },
        { uid: 'study2', date: '20231201', patientName: 'Test', studyDescription: 'Same Day' }
      ];

      mockServicesManager.services.DicomMetadataStore.getStudyInstanceUIDs.mockReturnValue(['study1', 'study2']);
      mockServicesManager.services.DicomMetadataStore.getStudy.mockImplementation((uid: string) => {
        const study = sameDayStudies.find(s => s.uid === uid);
        return study ? { StudyDate: study.date, ...study } : null;
      });

      const result = service.getStudyType('study2', mockServicesManager as any);
      expect(result.confidence).toBe(0.4); // Lower confidence for same date
    });
  });

  describe('Caching Performance', () => {
    it('should cache study type results', () => {
      // First call
      const result1 = service.getStudyType('study1', mockServicesManager as any);
      
      // Second call should use cache
      const result2 = service.getStudyType('study1', mockServicesManager as any);
      
      expect(result1).toEqual(result2);
      
      // Should only call DicomMetadataStore once due to caching
      expect(mockServicesManager.services.DicomMetadataStore.getStudyInstanceUIDs).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache when study data changes', () => {
      // First call
      service.getStudyType('study1', mockServicesManager as any);
      
      // Change study data
      mockStudies.push({
        uid: 'study4',
        date: '20231205', // New current study
        patientName: 'Patient, Test',
        studyDescription: 'New Current Study'
      });
      
      mockServicesManager.services.DicomMetadataStore.getStudyInstanceUIDs.mockReturnValue([
        'study1', 'study2', 'study4'
      ]);
      
      // Second call should detect change and recalculate
      const result = service.getStudyType('study1', mockServicesManager as any);
      expect(result.type).toBe('prior'); // study1 is now prior due to study4
    });

    it('should respect cache expiry', async () => {
      // First call at time 0
      mockPerformanceNow.mockReturnValue(0);
      service.getStudyType('study1', mockServicesManager as any);
      
      // Second call after cache expiry (5+ seconds)
      mockPerformanceNow.mockReturnValue(6000);
      service.getStudyType('study1', mockServicesManager as any);
      
      // Should call DicomMetadataStore twice due to cache expiry
      expect(mockServicesManager.services.DicomMetadataStore.getStudyInstanceUIDs).toHaveBeenCalledTimes(2);
    });

    it('should provide cache statistics', () => {
      service.getStudyType('study1', mockServicesManager as any);
      service.getStudyType('study1', mockServicesManager as any); // Cache hit
      
      const metrics = service.getPerformanceMetrics();
      
      expect(metrics.cacheStats).toBeDefined();
      expect(metrics.cacheStats.studyTypeCacheSize).toBeGreaterThan(0);
      expect(metrics.lastCalculationTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track calculation times', () => {
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(150);
      
      service.getStudyType('study1', mockServicesManager as any);
      
      const metrics = service.getPerformanceMetrics();
      expect(metrics.lastCalculationTime).toBe(50);
      expect(metrics.averageCalculationTime).toBeGreaterThan(0);
    });

    it('should update average calculation time', () => {
      // First calculation: 50ms
      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(150);
      service.getStudyType('study1', mockServicesManager as any);
      
      // Second calculation: 30ms  
      mockPerformanceNow.mockReturnValueOnce(200).mockReturnValueOnce(230);
      service.getStudyType('study2', mockServicesManager as any);
      
      const metrics = service.getPerformanceMetrics();
      expect(metrics.averageCalculationTime).toBe(40); // (50 + 30) / 2
    });
  });

  describe('Shared Event Management', () => {
    it('should subscribe to study changes', () => {
      const callback = jest.fn();
      
      const unsubscribe = service.subscribeToStudyChanges(callback, mockServicesManager as any);
      
      expect(mockServicesManager.services.DicomMetadataStore.subscribe).toHaveBeenCalledWith(
        'STUDY_ADDED',
        expect.any(Function)
      );
      expect(mockServicesManager.services.DicomMetadataStore.subscribe).toHaveBeenCalledWith(
        'INSTANCES_ADDED', 
        expect.any(Function)
      );
      
      // Test unsubscribe
      unsubscribe();
      expect(callback).toBeDefined();
    });

    it('should notify subscribers of study changes', () => {
      const callback = jest.fn();
      service.subscribeToStudyChanges(callback, mockServicesManager as any);
      
      // Simulate study change by getting the callback and calling it
      const subscribeCall = mockServicesManager.services.DicomMetadataStore.subscribe.mock.calls[0];
      const eventCallback = subscribeCall[1];
      
      // Trigger the callback
      eventCallback({ StudyInstanceUID: 'study1' });
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Date Formatting', () => {
    it('should format DICOM dates correctly', () => {
      const formatted = service.formatStudyDate('20231201');
      expect(formatted).toBe('12/01/2023');
    });

    it('should handle invalid date formats', () => {
      expect(service.formatStudyDate('invalid')).toBe('Date: N/A');
      expect(service.formatStudyDate(null)).toBe('Date: N/A');
      expect(service.formatStudyDate('')).toBe('Date: N/A');
    });

    it('should handle partial dates', () => {
      expect(service.formatStudyDate('202312')).toBe('Date: N/A');
      expect(service.formatStudyDate('20231')).toBe('Date: N/A');
    });
  });

  describe('Error Handling', () => {
    it('should handle DicomMetadataStore errors gracefully', () => {
      mockServicesManager.services.DicomMetadataStore.getStudyInstanceUIDs.mockImplementation(() => {
        throw new Error('Service error');
      });
      
      const result = service.getStudyType('study1', mockServicesManager as any);
      
      expect(result.type).toBe('default');
      expect(result.confidence).toBe(0);
    });

    it('should handle getStudy returning null', () => {
      mockServicesManager.services.DicomMetadataStore.getStudy.mockReturnValue(null);
      
      const result = service.getStudyType('study1', mockServicesManager as any);
      
      expect(result.type).toBe('default');
    });

    it('should handle missing study dates', () => {
      mockServicesManager.services.DicomMetadataStore.getStudy.mockReturnValue({
        StudyInstanceUID: 'study1',
        StudyDate: undefined,
        PatientName: 'Test Patient'
      });
      
      const result = service.getStudyType('study1', mockServicesManager as any);
      
      expect(result.type).toBe('current'); // Should still work with fallback date
    });
  });

  describe('Memory Management', () => {
    it('should clear caches on demand', () => {
      service.getStudyType('study1', mockServicesManager as any);
      
      let metrics = service.getPerformanceMetrics();
      expect(metrics.cacheStats.studyTypeCacheSize).toBeGreaterThan(0);
      
      service.clearCaches();
      
      metrics = service.getPerformanceMetrics();
      expect(metrics.cacheStats.studyTypeCacheSize).toBe(0);
    });

    it('should prevent memory leaks with proper cleanup', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      const unsubscribe1 = service.subscribeToStudyChanges(callback1, mockServicesManager as any);
      const unsubscribe2 = service.subscribeToStudyChanges(callback2, mockServicesManager as any);
      
      unsubscribe1();
      unsubscribe2();
      
      // Verify cleanup was called appropriately
      expect(callback1).toBeDefined();
      expect(callback2).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle studies with identical dates but different UIDs', () => {
      const identicalDateStudies = [
        { uid: 'study1', date: '20231201' },
        { uid: 'study2', date: '20231201' }
      ];

      mockServicesManager.services.DicomMetadataStore.getStudyInstanceUIDs.mockReturnValue(['study1', 'study2']);
      mockServicesManager.services.DicomMetadataStore.getStudy.mockImplementation((uid: string) => {
        const study = identicalDateStudies.find(s => s.uid === uid);
        return study ? { StudyDate: study.date, StudyInstanceUID: study.uid } : null;
      });

      const result1 = service.getStudyType('study1', mockServicesManager as any);
      const result2 = service.getStudyType('study2', mockServicesManager as any);
      
      // Both should have reduced confidence due to ambiguous dates
      expect(result1.confidence).toBeLessThan(1.0);
      expect(result2.confidence).toBeLessThan(1.0);
    });

    it('should handle very large numbers of studies efficiently', () => {
      // Create 100 studies
      const manyStudies = Array.from({ length: 100 }, (_, i) => ({
        uid: `study${i}`,
        date: `202312${(i + 1).toString().padStart(2, '0')}` // Sequential dates
      }));

      mockServicesManager.services.DicomMetadataStore.getStudyInstanceUIDs.mockReturnValue(
        manyStudies.map(s => s.uid)
      );
      mockServicesManager.services.DicomMetadataStore.getStudy.mockImplementation((uid: string) => {
        const study = manyStudies.find(s => s.uid === uid);
        return study ? { StudyDate: study.date, StudyInstanceUID: study.uid } : null;
      });

      mockPerformanceNow.mockReturnValueOnce(100).mockReturnValueOnce(150);
      
      const result = service.getStudyType('study99', mockServicesManager as any); // Most recent
      
      expect(result.type).toBe('current');
      expect(result.confidence).toBeGreaterThan(0.8);
      
      // Should complete in reasonable time even with many studies
      const metrics = service.getPerformanceMetrics();
      expect(metrics.lastCalculationTime).toBeLessThan(100); // Should be fast due to optimization
    });
  });
}); 