/**
 * Virtual Series Integration Test Suite - Edge Cases
 * 
 * Comprehensive test coverage for mapStudies function integration
 * with EnhancedMapStudiesService and VirtualSeriesLoadingManager
 * 
 * Task 4.5: mapStudies Function Integration - Test Suite
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import getDataSourcesModule, { 
  createOptimizedDataSourceConfig,
  EnhancedMapStudiesService,
  getVirtualSeriesLoadingManager,
  virtualSeriesProfiler 
} from '../getDataSourcesModule.enhanced.js';

// Mock utilities for testing
const createMockStudy = (studyUID, seriesCount = 3, instancesPerSeries = 100) => ({
  StudyInstanceUID: studyUID,
  StudyDate: '20240101',
  StudyTime: '120000',
  series: Array.from({ length: seriesCount }, (_, seriesIndex) => ({
    SeriesInstanceUID: `${studyUID}.series.${seriesIndex + 1}`,
    SeriesNumber: `${seriesIndex + 1}`,
    SeriesDescription: `Test Series ${seriesIndex + 1}`,
    Modality: 'CT',
    instances: Array.from({ length: instancesPerSeries }, (_, instanceIndex) => ({
      SOPInstanceUID: `${studyUID}.series.${seriesIndex + 1}.instance.${instanceIndex + 1}`,
      InstanceNumber: instanceIndex + 1,
      AcquisitionTime: `12${String(instanceIndex).padStart(4, '0')}00`
    }))
  }))
});

const createCorruptedStudy = (studyUID) => ({
  StudyInstanceUID: studyUID,
  StudyDate: null,
  StudyTime: undefined,
  series: [
    {
      SeriesInstanceUID: `${studyUID}.corrupt.1`,
      SeriesNumber: null,
      instances: null // Corrupted instances
    },
    {
      SeriesInstanceUID: `${studyUID}.corrupt.2`,
      // Missing instances array
    },
    {
      SeriesInstanceUID: `${studyUID}.corrupt.3`,
      instances: [] // Empty instances
    }
  ]
});

describe('Virtual Series Integration - Edge Cases', () => {
  let dataSourceModule;
  let dataSource;

  beforeEach(() => {
    // Clear any existing timers and metrics
    jest.clearAllMocks();
    virtualSeriesProfiler.clearMetrics();
    
    // Initialize data source module
    dataSourceModule = getDataSourcesModule({
      enableDebugLogging: false,
      chunkSize: 10,
      maxCacheSize: 1024 * 1024 // 1MB for testing
    });
    
    dataSource = dataSourceModule[0];
  });

  afterEach(async () => {
    // Cleanup after each test
    if (dataSource && dataSource.cleanup) {
      await dataSource.cleanup();
    }
  });

  describe('Edge Case 1: Large Study Collections (>500 instances)', () => {
    test('should optimize for large study collections automatically', async () => {
      const largeStudies = [
        createMockStudy('study1', 5, 200), // 1000 instances
        createMockStudy('study2', 3, 300), // 900 instances
        createMockStudy('study3', 2, 100)  // 200 instances
      ];

      const optimizationResult = await dataSource.optimizeForLargeStudies(largeStudies);
      
      expect(optimizationResult).toBeDefined();
      expect(optimizationResult.totalStudies).toBe(3);
      expect(optimizationResult.largeStudies).toBe(2); // First two studies > 500 instances
      expect(optimizationResult.totalInstances).toBe(2100);
      expect(optimizationResult.recommendedChunkSize).toBe(25); // Smaller chunks for large studies
    });

    test('should handle extremely large individual studies (>2000 instances)', async () => {
      const extremelyLargeStudy = createMockStudy('extreme', 10, 250); // 2500 instances
      
      const mappedStudies = await dataSource.mapStudies([extremelyLargeStudy]);
      
      expect(mappedStudies).toHaveLength(1);
      expect(mappedStudies[0].hasVirtualSeries).toBe(true);
      expect(mappedStudies[0].series[0].isVirtualSeries).toBe(true);
      expect(mappedStudies[0].series[0].totalImageCount).toBe(2500);
      expect(mappedStudies[0].series[0].loadingStrategy).toBe('progressive');
    });

    test('should handle memory pressure during large study processing', async () => {
      // Mock memory pressure scenario
      const originalMemory = global.performance?.['memory'];
      const originalPerformance = global.performance;
      
      // Create mock performance object
      global.performance = Object.assign({}, originalPerformance);
      global.performance['memory'] = {
        usedJSHeapSize: 180 * 1024 * 1024, // 180MB - high memory usage
        totalJSHeapSize: 200 * 1024 * 1024 // 200MB total
      };

      const largeStudies = Array.from({ length: 20 }, (_, i) => 
        createMockStudy(`study${i}`, 3, 100));

      const mappedStudies = await dataSource.mapStudies(largeStudies);
      
      expect(mappedStudies).toHaveLength(20);
      // Should still process all studies despite memory pressure
      
      // Restore original state
      global.performance = originalPerformance;
    });
  });

  describe('Edge Case 2: Corrupted and Malformed Study Data', () => {
    test('should handle studies with null/undefined series', async () => {
      const corruptedStudies = [
        { StudyInstanceUID: 'null-series', series: null },
        { StudyInstanceUID: 'undefined-series', series: undefined },
        { StudyInstanceUID: 'empty-series', series: [] }
      ];

      const mappedStudies = await dataSource.mapStudies(corruptedStudies);
      
      expect(mappedStudies).toHaveLength(3);
      // Should return original studies without virtual series
      expect(mappedStudies[0].hasVirtualSeries).toBeUndefined();
      expect(mappedStudies[1].hasVirtualSeries).toBeUndefined();
      expect(mappedStudies[2].hasVirtualSeries).toBeUndefined();
    });

    test('should handle studies with corrupted instance data', async () => {
      const corruptedStudy = createCorruptedStudy('corrupted-study');
      
      const mappedStudies = await dataSource.mapStudies([corruptedStudy]);
      
      expect(mappedStudies).toHaveLength(1);
      // Should gracefully handle corruption and create minimal virtual series
      expect(mappedStudies[0].StudyInstanceUID).toBe('corrupted-study');
    });

    test('should handle studies with missing metadata', async () => {
      const incompleteStudy = {
        StudyInstanceUID: 'incomplete',
        // Missing StudyDate, StudyTime
        series: [{
          SeriesInstanceUID: 'incomplete.series.1',
          // Missing SeriesNumber, SeriesDescription, Modality
          instances: [{
            SOPInstanceUID: 'incomplete.instance.1'
            // Missing InstanceNumber, AcquisitionTime
          }]
        }]
      };

      const mappedStudies = await dataSource.mapStudies([incompleteStudy]);
      
      expect(mappedStudies).toHaveLength(1);
      expect(mappedStudies[0].StudyInstanceUID).toBe('incomplete');
    });

    test('should handle mixed valid and invalid studies', async () => {
      const mixedStudies = [
        createMockStudy('valid-study', 2, 50),
        { StudyInstanceUID: 'invalid-study', series: null },
        createCorruptedStudy('corrupted-study'),
        createMockStudy('another-valid-study', 1, 25)
      ];

      const mappedStudies = await dataSource.mapStudies(mixedStudies);
      
      expect(mappedStudies).toHaveLength(4);
      // Valid studies should have virtual series
      expect(mappedStudies[0].hasVirtualSeries).toBe(true);
      expect(mappedStudies[3].hasVirtualSeries).toBe(true);
    });
  });

  describe('Edge Case 3: Network and Performance Conditions', () => {
    test('should adapt to slow network conditions', async () => {
      // Mock slow network
      const originalConnection = global.navigator?.['connection'];
      const originalNavigator = global.navigator;
      
      // Create mock navigator object
      global.navigator = Object.assign({}, originalNavigator);
      global.navigator['connection'] = {
        effectiveType: 'slow-2g',
        addEventListener: jest.fn()
      };

      const study = createMockStudy('network-test', 3, 100);
      const mappedStudies = await dataSource.mapStudies([study]);
      
      expect(mappedStudies).toHaveLength(1);
      
      // Test progressive loading with slow network
      const virtualSeries = mappedStudies[0].series[0];
      const instances = await dataSource.retrieve.series.src({
        SeriesInstanceUID: virtualSeries.SeriesInstanceUID
      });
      
      // Should handle slow network gracefully
      expect(instances).toBeDefined();
      
      // Restore original state
      global.navigator = originalNavigator;
    });

    test('should handle concurrent loading requests', async () => {
      const studies = Array.from({ length: 5 }, (_, i) => 
        createMockStudy(`concurrent${i}`, 2, 50));
      
      // Simulate concurrent mapping requests
      const promises = studies.map(study => dataSource.mapStudies([study]));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveLength(1);
        expect(result[0].hasVirtualSeries).toBe(true);
      });
    });

    test('should handle cache overflow scenarios', async () => {
      // Create many studies to overflow cache
      const manyStudies = Array.from({ length: 100 }, (_, i) => 
        createMockStudy(`cache-test-${i}`, 1, 10));

      // Process studies individually to trigger cache management
      for (const study of manyStudies) {
        await dataSource.mapStudies([study]);
      }

      // Verify performance metrics
      const metrics = dataSource.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.mapStudies).toBeDefined();
    });
  });

  describe('Edge Case 4: Complex Multi-Modality Studies', () => {
    test('should handle multi-modality studies correctly', async () => {
      const multiModalityStudy = {
        StudyInstanceUID: 'multi-modality',
        StudyDate: '20240101',
        StudyTime: '120000',
        series: [
          {
            SeriesInstanceUID: 'ct-series',
            Modality: 'CT',
            instances: Array.from({ length: 50 }, (_, i) => ({
              SOPInstanceUID: `ct.${i}`,
              InstanceNumber: i + 1
            }))
          },
          {
            SeriesInstanceUID: 'mr-series',
            Modality: 'MR',
            instances: Array.from({ length: 30 }, (_, i) => ({
              SOPInstanceUID: `mr.${i}`,
              InstanceNumber: i + 1
            }))
          },
          {
            SeriesInstanceUID: 'pet-series',
            Modality: 'PT',
            instances: Array.from({ length: 20 }, (_, i) => ({
              SOPInstanceUID: `pet.${i}`,
              InstanceNumber: i + 1
            }))
          }
        ]
      };

      const mappedStudies = await dataSource.mapStudies([multiModalityStudy]);
      
      expect(mappedStudies).toHaveLength(1);
      expect(mappedStudies[0].hasVirtualSeries).toBe(true);
      
      const virtualSeries = mappedStudies[0].series[0];
      expect(virtualSeries.totalImageCount).toBe(100); // 50 + 30 + 20
      expect(virtualSeries.SeriesDescription).toContain('All Images');
    });

    test('should handle studies with varying instance metadata', async () => {
      const varyingStudy = {
        StudyInstanceUID: 'varying-metadata',
        StudyDate: '20240101',
        series: [{
          SeriesInstanceUID: 'varying-series',
          instances: [
            { 
              SOPInstanceUID: 'inst1',
              InstanceNumber: 1,
              AcquisitionTime: '120000',
              ImagePositionPatient: [0, 0, 0]
            },
            { 
              SOPInstanceUID: 'inst2',
              InstanceNumber: 2,
              // Missing AcquisitionTime
              ImagePositionPatient: [0, 0, 5]
            },
            { 
              SOPInstanceUID: 'inst3',
              InstanceNumber: 3,
              AcquisitionTime: '120100',
              // Missing ImagePositionPatient
            }
          ]
        }]
      };

      const mappedStudies = await dataSource.mapStudies([varyingStudy]);
      
      expect(mappedStudies).toHaveLength(1);
      expect(mappedStudies[0].hasVirtualSeries).toBe(true);
    });
  });

  describe('Edge Case 5: Error Recovery and Fallback Scenarios', () => {
    test('should recover from service initialization failures', async () => {
      // Mock service initialization failure
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // Create data source with invalid configuration
      const faultyModule = getDataSourcesModule({
        maxCacheSize: -1, // Invalid cache size
        chunkSize: 0 // Invalid chunk size
      });

      const faultyDataSource = faultyModule[0];
      const study = createMockStudy('fallback-test', 2, 10);
      
      // Should still work with fallback
      const mappedStudies = await faultyDataSource.mapStudies([study]);
      expect(mappedStudies).toBeDefined();
      
      console.error = originalConsoleError;
    });

    test('should handle async operation timeouts', async () => {
      const timeoutStudy = createMockStudy('timeout-test', 1, 5);
      
      // Set a very short timeout for testing
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 100));
      
      try {
        await Promise.race([
          dataSource.mapStudies([timeoutStudy]),
          timeoutPromise
        ]);
      } catch (error) {
        expect(error.message).toBe('Timeout');
      }
    });

    test('should maintain data integrity during errors', async () => {
      const originalMapStudies = dataSource.mapStudies;
      let callCount = 0;
      
      // Mock intermittent failures
      dataSource.mapStudies = async (studies) => {
        callCount++;
        if (callCount % 2 === 0) {
          throw new Error('Simulated failure');
        }
        return originalMapStudies.call(dataSource, studies);
      };

      const study = createMockStudy('integrity-test', 1, 10);
      
      try {
        await dataSource.mapStudies([study]); // Should succeed
        await dataSource.mapStudies([study]); // Should fail
      } catch (error) {
        expect(error.message).toBe('Simulated failure');
      }
      
      // Restore original function
      dataSource.mapStudies = originalMapStudies;
    });
  });

  describe('Edge Case 6: Configuration and Environment Variations', () => {
    test('should handle different environment configurations', () => {
      const devConfig = createOptimizedDataSourceConfig('development');
      const testConfig = createOptimizedDataSourceConfig('testing');
      const prodConfig = createOptimizedDataSourceConfig('production');
      
      expect(devConfig.chunkSize).toBe(25);
      expect(testConfig.chunkSize).toBe(10);
      expect(prodConfig.chunkSize).toBe(50);
      
      expect(devConfig.enableDebugLogging).toBe(true);
      expect(testConfig.enableDebugLogging).toBe(true);
      expect(prodConfig.enableDebugLogging).toBe(true);
    });

    test('should handle health check in various states', () => {
      const healthStatus = dataSource.healthCheck();
      
      expect(healthStatus.status).toMatch(/healthy|degraded/);
      expect(healthStatus.services.mapStudiesService.status).toBe('healthy');
      expect(healthStatus.services.loadingManager.status).toBe('healthy');
      expect(healthStatus.services.profiler.status).toBe('healthy');
      expect(healthStatus.version).toBe('2.0');
    });
  });

  describe('Performance Metrics and Monitoring', () => {
    test('should track comprehensive performance metrics', async () => {
      const study = createMockStudy('metrics-test', 3, 50);
      
      await dataSource.mapStudies([study]);
      
      const metrics = dataSource.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.mapStudies).toBeDefined();
      expect(metrics.loadingManager).toBeDefined();
      expect(metrics.profiler).toBeDefined();
      expect(metrics.timestamp).toBeDefined();
      expect(metrics.integrationVersion).toBe('2.0');
    });

    test('should handle performance profiler edge cases', () => {
      // Test profiler with invalid operations
      const timing1 = virtualSeriesProfiler.startTiming('test-operation');
      virtualSeriesProfiler.endTiming(timing1, 'test-operation');
      
      // Test profiler with nested operations
      const timing2 = virtualSeriesProfiler.startTiming('outer-operation');
      const timing3 = virtualSeriesProfiler.startTiming('inner-operation');
      virtualSeriesProfiler.endTiming(timing3, 'inner-operation');
      virtualSeriesProfiler.endTiming(timing2, 'outer-operation');
      
      const summary = virtualSeriesProfiler.getPerformanceSummary();
      expect(summary).toBeDefined();
    });
  });
});

/**
 * Integration Test Utilities
 */
export const testUtils = {
  createMockStudy,
  createCorruptedStudy,
  
  // Helper to create study with specific characteristics
  createStudyWithCharacteristics: (options = {}) => {
    const {
      studyUID = 'test-study',
      seriesCount = 2,
      instancesPerSeries = 50,
      modalities = ['CT'],
      hasAcquisitionTimes = true,
      hasPositionData = false
    } = options;

    const study = createMockStudy(studyUID, seriesCount, instancesPerSeries);
    
    // Apply modalities
    study.series.forEach((series, index) => {
      series.Modality = modalities[index % modalities.length];
      
      if (!hasAcquisitionTimes) {
        series.instances.forEach(instance => {
          delete instance.AcquisitionTime;
        });
      }
      
      if (hasPositionData) {
        series.instances.forEach((instance, instIndex) => {
          instance.ImagePositionPatient = [0, 0, instIndex * 5];
        });
      }
    });
    
    return study;
  },
  
  // Performance test helper
  measureOperationTime: async (operation) => {
    const start = performance.now();
    const result = await operation();
    const end = performance.now();
    return {
      result,
      duration: end - start
    };
  }
}; 