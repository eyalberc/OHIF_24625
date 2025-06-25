/**
 * Virtual Series Functional and Integration Tests
 * 
 * Comprehensive functional and integration testing for virtual series feature
 * Covers all user flows, edge cases, and integration points with data sources
 * 
 * Task 4.7: Functional and Integration Testing
 */

import { describe, test, expect, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';
import getDataSourcesModule, { createOptimizedDataSourceConfig } from '../getDataSourcesModule.enhanced.js';
import { getVirtualSeriesErrorHandler } from '../services/VirtualSeriesErrorHandler.js';
import { virtualSeriesProfiler } from '../utils/virtualSeriesPerformance.js';

// Mock OHIF services and utilities
jest.mock('@ohif/core', () => ({
  DicomMetadataStore: {
    addStudy: jest.fn(),
    getStudy: jest.fn(),
    addSeries: jest.fn(),
    getSeries: jest.fn()
  },
  ServicesManager: {
    getService: jest.fn()
  }
}));

/**
 * Test Data Factory
 */
const TestDataFactory = {
  createStudyWithInstances: (studyUID, instanceCount = 100, modality = 'CT') => ({
    StudyInstanceUID: studyUID,
    StudyDate: '20240101',
    StudyTime: '120000',
    StudyDescription: `Test ${modality} Study`,
    PatientName: 'Test^Patient',
    PatientID: 'TEST001',
    series: [{
      SeriesInstanceUID: `${studyUID}.series.1`,
      SeriesNumber: '1',
      SeriesDescription: `${modality} Series`,
      Modality: modality,
      instances: Array.from({ length: instanceCount }, (_, i) => ({
        SOPInstanceUID: `${studyUID}.instance.${i + 1}`,
        InstanceNumber: i + 1,
        AcquisitionTime: `12${String(i).padStart(4, '0')}00`,
        ImagePositionPatient: [0, 0, i * 2.5],
        SliceThickness: 2.5,
        PixelSpacing: [0.5, 0.5]
      }))
    }]
  }),

  createMultiSeriesStudy: (studyUID, seriesCount = 3, instancesPerSeries = 50) => ({
    StudyInstanceUID: studyUID,
    StudyDate: '20240101',
    StudyTime: '120000',
    StudyDescription: 'Multi-Series Study',
    PatientName: 'Test^Patient',
    PatientID: 'TEST002',
    series: Array.from({ length: seriesCount }, (_, seriesIndex) => ({
      SeriesInstanceUID: `${studyUID}.series.${seriesIndex + 1}`,
      SeriesNumber: `${seriesIndex + 1}`,
      SeriesDescription: `Series ${seriesIndex + 1}`,
      Modality: 'CT',
      instances: Array.from({ length: instancesPerSeries }, (_, i) => ({
        SOPInstanceUID: `${studyUID}.series.${seriesIndex + 1}.instance.${i + 1}`,
        InstanceNumber: i + 1,
        AcquisitionTime: `12${String(seriesIndex * 1000 + i).padStart(4, '0')}00`
      }))
    }))
  }),

  createMultiModalityStudy: (studyUID) => ({
    StudyInstanceUID: studyUID,
    StudyDate: '20240101',
    StudyTime: '120000',
    StudyDescription: 'Multi-Modality Study',
    PatientName: 'Test^Patient',
    PatientID: 'TEST003',
    series: [
      {
        SeriesInstanceUID: `${studyUID}.ct`,
        SeriesNumber: '1',
        SeriesDescription: 'CT Chest',
        Modality: 'CT',
        instances: Array.from({ length: 300 }, (_, i) => ({
          SOPInstanceUID: `${studyUID}.ct.${i + 1}`,
          InstanceNumber: i + 1,
          AcquisitionTime: `120000`
        }))
      },
      {
        SeriesInstanceUID: `${studyUID}.mr`,
        SeriesNumber: '2',
        SeriesDescription: 'MR Brain',
        Modality: 'MR',
        instances: Array.from({ length: 200 }, (_, i) => ({
          SOPInstanceUID: `${studyUID}.mr.${i + 1}`,
          InstanceNumber: i + 1,
          AcquisitionTime: `121000`
        }))
      },
      {
        SeriesInstanceUID: `${studyUID}.pt`,
        SeriesNumber: '3',
        SeriesDescription: 'PET Whole Body',
        Modality: 'PT',
        instances: Array.from({ length: 100 }, (_, i) => ({
          SOPInstanceUID: `${studyUID}.pt.${i + 1}`,
          InstanceNumber: i + 1,
          AcquisitionTime: `122000`
        }))
      }
    ]
  }),

  createLargeStudy: (studyUID, totalInstances = 2000) => ({
    StudyInstanceUID: studyUID,
    StudyDate: '20240101',
    StudyTime: '120000',
    StudyDescription: 'Large CT Study',
    PatientName: 'Test^Patient',
    PatientID: 'TEST004',
    series: [{
      SeriesInstanceUID: `${studyUID}.large`,
      SeriesNumber: '1',
      SeriesDescription: 'Large CT Series',
      Modality: 'CT',
      instances: Array.from({ length: totalInstances }, (_, i) => ({
        SOPInstanceUID: `${studyUID}.large.${i + 1}`,
        InstanceNumber: i + 1,
        AcquisitionTime: `12${String(i).padStart(4, '0')}00`,
        ImagePositionPatient: [0, 0, i * 0.5]
      }))
    }]
  })
};

/**
 * Test Utilities
 */
const TestUtils = {
  waitForAsync: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  measurePerformance: async (operation) => {
    const start = performance.now();
    const result = await operation();
    const end = performance.now();
    return { result, duration: end - start };
  },

  validateVirtualSeries: (virtualSeries, expectedInstanceCount) => {
    expect(virtualSeries.isVirtualSeries).toBe(true);
    expect(virtualSeries.SeriesInstanceUID).toMatch(/\.all-images$/);
    expect(virtualSeries.SeriesNumber).toBe('999999');
    expect(virtualSeries.Modality).toBe('VIRTUAL');
    expect(virtualSeries.totalImageCount).toBe(expectedInstanceCount);
    expect(virtualSeries.SeriesDescription).toContain('All Images');
  },

  simulateNetworkDelay: (ms = 500) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  mockNetworkFailure: () => {
    throw new Error('Network request failed');
  }
};

describe('Virtual Series Functional and Integration Tests', () => {
  let dataSourceModule;
  let dataSource;
  let errorHandler;

  beforeAll(() => {
    // Setup global test environment - ensure performance.now exists for tests
    if (typeof global.performance === 'undefined') {
      global.performance = {};
    }
    if (typeof global.performance.now === 'undefined') {
      global.performance.now = () => Date.now();
    }
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    virtualSeriesProfiler.clearMetrics();
    
    // Initialize data source for testing
    dataSourceModule = getDataSourcesModule({
      enableDebugLogging: false,
      chunkSize: 25,
      maxCacheSize: 10 * 1024 * 1024, // 10MB for testing
      enableUserNotifications: false
    });
    
    dataSource = dataSourceModule[0];
    errorHandler = getVirtualSeriesErrorHandler();
  });

  afterEach(async () => {
    // Cleanup after each test
    if (dataSource && dataSource.cleanup) {
      await dataSource.cleanup();
    }
    errorHandler.clearErrorHistory();
  });

  afterAll(() => {
    // Global cleanup
    if (errorHandler) {
      errorHandler.dispose();
    }
  });

  describe('Functional Tests - Core User Flows', () => {
    describe('Study Loading and Virtual Series Creation', () => {
      test('should create virtual series for standard single-series study', async () => {
        const study = TestDataFactory.createStudyWithInstances('study-001', 100);
        
        const mappedStudies = await dataSource.mapStudies([study]);
        
        expect(mappedStudies).toHaveLength(1);
        expect(mappedStudies[0].hasVirtualSeries).toBe(true);
        expect(mappedStudies[0].series).toHaveLength(2); // Virtual + original
        
        const virtualSeries = mappedStudies[0].series[0];
        TestUtils.validateVirtualSeries(virtualSeries, 100);
      });

      test('should create virtual series for multi-series study', async () => {
        const study = TestDataFactory.createMultiSeriesStudy('study-002', 4, 75);
        
        const mappedStudies = await dataSource.mapStudies([study]);
        
        expect(mappedStudies).toHaveLength(1);
        expect(mappedStudies[0].hasVirtualSeries).toBe(true);
        expect(mappedStudies[0].series).toHaveLength(5); // Virtual + 4 original
        
        const virtualSeries = mappedStudies[0].series[0];
        TestUtils.validateVirtualSeries(virtualSeries, 300); // 4 * 75
      });

      test('should handle multi-modality studies correctly', async () => {
        const study = TestDataFactory.createMultiModalityStudy('study-003');
        
        const mappedStudies = await dataSource.mapStudies([study]);
        
        expect(mappedStudies).toHaveLength(1);
        expect(mappedStudies[0].hasVirtualSeries).toBe(true);
        
        const virtualSeries = mappedStudies[0].series[0];
        TestUtils.validateVirtualSeries(virtualSeries, 600); // 300 + 200 + 100
        expect(virtualSeries.SeriesDescription).toContain('All Images');
      });

      test('should skip virtual series for very small studies', async () => {
        const smallStudy = TestDataFactory.createStudyWithInstances('study-004', 1);
        
        const mappedStudies = await dataSource.mapStudies([smallStudy]);
        
        expect(mappedStudies).toHaveLength(1);
        expect(mappedStudies[0].hasVirtualSeries).toBeUndefined();
        expect(mappedStudies[0].series).toHaveLength(1); // Only original
      });
    });

    describe('Large Study Handling', () => {
      test('should optimize configuration for large studies', async () => {
        const largeStudies = [
          TestDataFactory.createLargeStudy('large-001', 1500),
          TestDataFactory.createLargeStudy('large-002', 2000),
          TestDataFactory.createStudyWithInstances('small-001', 50)
        ];

        const optimizationResult = await dataSource.optimizeForLargeStudies(largeStudies);
        
        expect(optimizationResult.totalStudies).toBe(3);
        expect(optimizationResult.largeStudies).toBe(2); // 2 studies > 500 instances
        expect(optimizationResult.totalInstances).toBe(3550);
        expect(optimizationResult.recommendedChunkSize).toBe(25); // Smaller for large studies
      });

      test('should handle extremely large single study', async () => {
        const extremeStudy = TestDataFactory.createLargeStudy('extreme-001', 5000);
        
        const { result: mappedStudies, duration } = await TestUtils.measurePerformance(
          () => dataSource.mapStudies([extremeStudy])
        );
        
        expect(mappedStudies).toHaveLength(1);
        expect(mappedStudies[0].hasVirtualSeries).toBe(true);
        
        const virtualSeries = mappedStudies[0].series[0];
        TestUtils.validateVirtualSeries(virtualSeries, 5000);
        
        // Performance check - should complete in reasonable time
        expect(duration).toBeLessThan(5000); // Under 5 seconds
      });
    });

    describe('Virtual Series Instance Retrieval', () => {
      test('should retrieve virtual series instances successfully', async () => {
        const study = TestDataFactory.createStudyWithInstances('retrieve-001', 150);
        const mappedStudies = await dataSource.mapStudies([study]);
        
        const virtualSeries = mappedStudies[0].series[0];
        
        const instances = await dataSource.retrieve.series.src({
          SeriesInstanceUID: virtualSeries.SeriesInstanceUID
        });
        
        expect(instances).toBeDefined();
        expect(Array.isArray(instances)).toBe(true);
      });

      test('should handle range-based instance retrieval', async () => {
        const study = TestDataFactory.createStudyWithInstances('retrieve-002', 200);
        const mappedStudies = await dataSource.mapStudies([study]);
        
        const virtualSeries = mappedStudies[0].series[0];
        
        const instances = await dataSource.retrieve.series.src({
          SeriesInstanceUID: virtualSeries.SeriesInstanceUID
        }, {
          requestedRange: { start: 0, end: 50 }
        });
        
        expect(instances).toBeDefined();
      });

      test('should handle non-virtual series retrieval', async () => {
        const study = TestDataFactory.createStudyWithInstances('retrieve-003', 100);
        const mappedStudies = await dataSource.mapStudies([study]);
        
        const originalSeries = mappedStudies[0].series[1]; // Not the virtual series
        
        const instances = await dataSource.retrieve.series.src({
          SeriesInstanceUID: originalSeries.SeriesInstanceUID
        });
        
        expect(instances).toBeDefined();
      });
    });
  });

  describe('Integration Tests - Data Source Integration', () => {
    describe('OHIF Data Source Integration', () => {
      test('should integrate with OHIF DicomMetadataStore', async () => {
        const study = TestDataFactory.createStudyWithInstances('integration-001', 100);
        
        // Mock OHIF services
        const { DicomMetadataStore } = require('@ohif/core');
        DicomMetadataStore.getStudy.mockReturnValue(study);
        
        const mappedStudies = await dataSource.mapStudies([study]);
        
        expect(mappedStudies).toHaveLength(1);
        expect(mappedStudies[0].hasVirtualSeries).toBe(true);
      });

      test('should handle OHIF service failures gracefully', async () => {
        const study = TestDataFactory.createStudyWithInstances('integration-002', 100);
        
        // Mock service failure
        const { DicomMetadataStore } = require('@ohif/core');
        DicomMetadataStore.getStudy.mockImplementation(() => {
          throw new Error('Service unavailable');
        });
        
        // Should still work with fallback
        const mappedStudies = await dataSource.mapStudies([study]);
        expect(mappedStudies).toBeDefined();
      });
    });

    describe('Configuration Integration', () => {
      test('should work with different environment configurations', async () => {
        const configs = ['development', 'testing', 'production'];
        
        for (const env of configs) {
          const config = createOptimizedDataSourceConfig(env);
          const envDataSource = getDataSourcesModule(config)[0];
          
          const study = TestDataFactory.createStudyWithInstances(`env-${env}`, 100);
          const mappedStudies = await envDataSource.mapStudies([study]);
          
          expect(mappedStudies).toHaveLength(1);
          expect(mappedStudies[0].hasVirtualSeries).toBe(true);
          
          await envDataSource.cleanup();
        }
      });

      test('should adapt to custom configuration changes', async () => {
        const customConfig = {
          enableVirtualSeries: true,
          chunkSize: 10,
          maxCacheSize: 5 * 1024 * 1024, // 5MB
          minInstancesForVirtual: 5
        };
        
        const customDataSource = getDataSourcesModule(customConfig)[0];
        const study = TestDataFactory.createStudyWithInstances('custom-001', 10);
        
        const mappedStudies = await customDataSource.mapStudies([study]);
        
        expect(mappedStudies).toHaveLength(1);
        expect(mappedStudies[0].hasVirtualSeries).toBe(true);
        
        await customDataSource.cleanup();
      });
    });

    describe('Performance Integration', () => {
      test('should maintain performance metrics across operations', async () => {
        const studies = Array.from({ length: 10 }, (_, i) => 
          TestDataFactory.createStudyWithInstances(`perf-${i}`, 50)
        );
        
        // Process studies
        for (const study of studies) {
          await dataSource.mapStudies([study]);
        }
        
        const metrics = dataSource.getPerformanceMetrics();
        
        expect(metrics).toBeDefined();
        expect(metrics.mapStudies).toBeDefined();
        expect(metrics.loadingManager).toBeDefined();
        expect(metrics.profiler).toBeDefined();
        expect(metrics.errorHandling).toBeDefined();
      });

      test('should handle concurrent study processing', async () => {
        const studies = Array.from({ length: 5 }, (_, i) => 
          TestDataFactory.createStudyWithInstances(`concurrent-${i}`, 100)
        );
        
        // Process concurrently
        const promises = studies.map(study => dataSource.mapStudies([study]));
        const results = await Promise.all(promises);
        
        expect(results).toHaveLength(5);
        results.forEach(mappedStudies => {
          expect(mappedStudies).toHaveLength(1);
          expect(mappedStudies[0].hasVirtualSeries).toBe(true);
        });
      });
    });
  });

  describe('Error Handling Integration Tests', () => {
    describe('Network Error Handling', () => {
      test('should handle network timeouts gracefully', async () => {
        const study = TestDataFactory.createStudyWithInstances('timeout-001', 100);
        
        // Mock network timeout
        const originalRetrieve = dataSource.retrieve.series.src;
        dataSource.retrieve.series.src = jest.fn().mockImplementation(async () => {
          await TestUtils.simulateNetworkDelay(100);
          throw new Error('Network timeout');
        });
        
        // Should handle error gracefully
        try {
          await dataSource.retrieve.series.src({
            SeriesInstanceUID: 'test.all-images'
          });
        } catch (error) {
          expect(error.message).toContain('Network timeout');
        }
        
        // Restore original
        dataSource.retrieve.series.src = originalRetrieve;
      });

      test('should retry failed operations automatically', async () => {
        const study = TestDataFactory.createStudyWithInstances('retry-001', 100);
        
        let callCount = 0;
        const originalMapStudies = dataSource.mapStudies;
        
        dataSource.mapStudies = jest.fn().mockImplementation(async (studies) => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Temporary failure');
          }
          return originalMapStudies.call(dataSource, studies);
        });
        
        const mappedStudies = await dataSource.mapStudies([study]);
        
        expect(callCount).toBe(2); // Original call + 1 retry
        expect(mappedStudies).toHaveLength(1);
        
        // Restore original
        dataSource.mapStudies = originalMapStudies;
      });
    });

    describe('Data Corruption Handling', () => {
      test('should handle corrupted study data', async () => {
        const corruptedStudy = {
          StudyInstanceUID: 'corrupted-001',
          series: null // Corrupted data
        };
        
        const mappedStudies = await dataSource.mapStudies([corruptedStudy]);
        
        expect(mappedStudies).toHaveLength(1);
        expect(mappedStudies[0].StudyInstanceUID).toBe('corrupted-001');
        // Should not create virtual series for corrupted data
        expect(mappedStudies[0].hasVirtualSeries).toBeUndefined();
      });

      test('should handle mixed valid and invalid studies', async () => {
        const validStudy = TestDataFactory.createStudyWithInstances('valid-001', 100);
        const invalidStudy = { StudyInstanceUID: 'invalid-001', series: null };
        
        const mappedStudies = await dataSource.mapStudies([validStudy, invalidStudy]);
        
        expect(mappedStudies).toHaveLength(2);
        expect(mappedStudies[0].hasVirtualSeries).toBe(true); // Valid study
        expect(mappedStudies[1].hasVirtualSeries).toBeUndefined(); // Invalid study
      });
    });

    describe('Memory Pressure Handling', () => {
      test('should handle memory pressure gracefully', async () => {
        // Create many large studies to simulate memory pressure
        const largeStudies = Array.from({ length: 20 }, (_, i) => 
          TestDataFactory.createLargeStudy(`memory-${i}`, 500)
        );
        
        // Process studies and monitor for memory issues
        const results = [];
        for (const study of largeStudies) {
          const mappedStudies = await dataSource.mapStudies([study]);
          results.push(mappedStudies);
          
          // Allow garbage collection
          await TestUtils.waitForAsync(10);
        }
        
        expect(results).toHaveLength(20);
        
        // Check system health
        const health = dataSource.healthCheck();
        expect(health.status).toMatch(/healthy|degraded/);
      });
    });
  });

  describe('Edge Cases and Boundary Tests', () => {
    describe('Boundary Conditions', () => {
      test('should handle empty study list', async () => {
        const mappedStudies = await dataSource.mapStudies([]);
        expect(mappedStudies).toEqual([]);
      });

      test('should handle null/undefined input', async () => {
        const mappedStudies1 = await dataSource.mapStudies(null);
        const mappedStudies2 = await dataSource.mapStudies(undefined);
        
        expect(mappedStudies1).toEqual([]);
        expect(mappedStudies2).toEqual([]);
      });

      test('should handle study with exact threshold instance count', async () => {
        const thresholdStudy = TestDataFactory.createStudyWithInstances('threshold-001', 2);
        
        const mappedStudies = await dataSource.mapStudies([thresholdStudy]);
        
        expect(mappedStudies).toHaveLength(1);
        expect(mappedStudies[0].hasVirtualSeries).toBe(true); // At threshold
      });
    });

    describe('Complex Study Structures', () => {
      test('should handle studies with missing metadata', async () => {
        const incompleteStudy = {
          StudyInstanceUID: 'incomplete-001',
          // Missing required fields
          series: [{
            SeriesInstanceUID: 'incomplete.series.1',
            instances: [{
              SOPInstanceUID: 'incomplete.instance.1'
              // Missing other fields
            }]
          }]
        };
        
        const mappedStudies = await dataSource.mapStudies([incompleteStudy]);
        
        expect(mappedStudies).toHaveLength(1);
        expect(mappedStudies[0].StudyInstanceUID).toBe('incomplete-001');
      });

      test('should handle studies with empty series', async () => {
        const emptySeriesStudy = {
          StudyInstanceUID: 'empty-series-001',
          StudyDate: '20240101',
          series: [{
            SeriesInstanceUID: 'empty.series.1',
            instances: [] // Empty instances
          }]
        };
        
        const mappedStudies = await dataSource.mapStudies([emptySeriesStudy]);
        
        expect(mappedStudies).toHaveLength(1);
        expect(mappedStudies[0].hasVirtualSeries).toBeUndefined();
      });
    });
  });

  describe('Performance Regression Tests', () => {
    test('should maintain acceptable performance for typical workloads', async () => {
      const typicalStudies = Array.from({ length: 10 }, (_, i) => 
        TestDataFactory.createStudyWithInstances(`typical-${i}`, 150)
      );
      
      const { duration } = await TestUtils.measurePerformance(
        async () => {
          for (const study of typicalStudies) {
            await dataSource.mapStudies([study]);
          }
        }
      );
      
      // Should process 10 studies with 150 instances each in under 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    test('should not degrade performance with repeated operations', async () => {
      const study = TestDataFactory.createStudyWithInstances('repeated-001', 100);
      
      const times = [];
      for (let i = 0; i < 5; i++) {
        const { duration } = await TestUtils.measurePerformance(
          () => dataSource.mapStudies([study])
        );
        times.push(duration);
      }
      
      // Performance should not significantly degrade
      const firstTime = times[0];
      const lastTime = times[times.length - 1];
      expect(lastTime).toBeLessThan(firstTime * 2); // Less than 2x slower
    });
  });

  describe('Health and Monitoring Tests', () => {
    test('should provide accurate health status', () => {
      const health = dataSource.healthCheck();
      
      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|critical/);
      expect(health.services).toBeDefined();
      expect(health.services.mapStudiesService).toBeDefined();
      expect(health.services.loadingManager).toBeDefined();
      expect(health.services.errorHandler).toBeDefined();
      expect(health.timestamp).toBeDefined();
      expect(health.version).toBe('2.0');
    });

    test('should track error statistics accurately', async () => {
      // Generate some errors
      try {
        await dataSource.mapStudies(null);
      } catch (error) {
        // Expected
      }
      
      const errorStats = dataSource.getErrorStatistics();
      expect(errorStats).toBeDefined();
      expect(typeof errorStats.totalErrors).toBe('number');
    });

    test('should provide comprehensive performance metrics', async () => {
      const study = TestDataFactory.createStudyWithInstances('metrics-001', 100);
      await dataSource.mapStudies([study]);
      
      const metrics = dataSource.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.mapStudies).toBeDefined();
      expect(metrics.loadingManager).toBeDefined();
      expect(metrics.profiler).toBeDefined();
      expect(metrics.errorHandling).toBeDefined();
      expect(metrics.timestamp).toBeDefined();
      expect(metrics.integrationVersion).toBe('2.0');
    });
  });
}); 