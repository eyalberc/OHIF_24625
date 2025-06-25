/**
 * Enhanced mapStudies Service
 * 
 * Advanced study mapping service that integrates with VirtualSeriesLoadingManager
 * for optimized virtual series creation, progressive loading, and caching
 * 
 * Task 4.5: mapStudies Function Integration
 */

import { getVirtualSeriesLoadingManager } from './VirtualSeriesLoadingManager.js';
import { virtualSeriesProfiler } from '../utils/virtualSeriesPerformance.js';

/**
 * Enhanced MapStudies Service
 * Provides optimized study mapping with virtual series integration
 */
export class EnhancedMapStudiesService {
  constructor(options = {}) {
    this.options = {
      // Virtual Series Configuration
      enableVirtualSeries: options.enableVirtualSeries !== false,
      virtualSeriesNumber: options.virtualSeriesNumber || '999999',
      virtualSeriesModality: options.virtualSeriesModality || 'VIRTUAL',
      minInstancesForVirtual: options.minInstancesForVirtual || 2,
      
      // Performance Configuration
      enableProgressiveMapping: options.enableProgressiveMapping !== false,
      enableCaching: options.enableCaching !== false,
      maxStudiesInCache: options.maxStudiesInCache || 50,
      
      // Sorting Configuration
      defaultSortStrategy: options.defaultSortStrategy || 'acquisitionTime',
      fallbackSortStrategy: options.fallbackSortStrategy || 'instanceNumber',
      
      // Debug Configuration
      enableDebugLogging: options.enableDebugLogging || (process.env.NODE_ENV === 'development')
    };

    // Initialize loading manager
    this.loadingManager = getVirtualSeriesLoadingManager({
      enableDebugLogging: this.options.enableDebugLogging
    });

    // Internal state
    this.studyMappingCache = new Map();
    this.performanceMetrics = {
      totalStudiesMapped: 0,
      virtualSeriesCreated: 0,
      cacheHitRate: 0,
      averageMappingTime: 0
    };

    this.log('EnhancedMapStudiesService initialized', this.options);
  }

  /**
   * Enhanced mapStudies function with optimization and caching
   */
  async mapStudies(studies, options = {}) {
    const mappingTiming = virtualSeriesProfiler.startTiming('mapStudies');
    
    try {
      if (!Array.isArray(studies) || studies.length === 0) {
        this.log('No studies to map');
        virtualSeriesProfiler.endTiming(mappingTiming, 'mapStudies');
        return [];
      }

      this.log('Mapping studies', { count: studies.length, options });

      // Process studies with optimization strategies
      const mappedStudies = await this.processStudiesWithOptimization(studies, options);
      
      // Update performance metrics
      this.updatePerformanceMetrics(studies.length, mappedStudies);
      
      virtualSeriesProfiler.endTiming(mappingTiming, 'mapStudies');
      return mappedStudies;
      
    } catch (error) {
      this.log('Error mapping studies', error);
      virtualSeriesProfiler.endTiming(mappingTiming, 'mapStudies');
      throw error;
    }
  }

  /**
   * Process studies with performance optimizations
   */
  async processStudiesWithOptimization(studies, options) {
    const processedStudies = [];
    
    for (const study of studies) {
      const processedStudy = await this.processStudyWithOptimization(study, options);
      processedStudies.push(processedStudy);
    }
    
    return processedStudies;
  }

  /**
   * Process individual study with optimization
   */
  async processStudyWithOptimization(study, options) {
    const studyTiming = virtualSeriesProfiler.startTiming('processStudy');
    
    try {
      // Check cache first
      const cacheKey = this.generateStudyCacheKey(study);
      const cachedStudy = this.getCachedStudy(cacheKey);
      
      if (cachedStudy) {
        this.log('Cache hit for study', { studyUID: study.StudyInstanceUID });
        virtualSeriesProfiler.endTiming(studyTiming, 'processStudy');
        return cachedStudy;
      }

      // Create enhanced study with virtual series
      const enhancedStudy = await this.createEnhancedStudy(study, options);
      
      // Cache the result
      await this.cacheStudy(cacheKey, enhancedStudy);
      
      virtualSeriesProfiler.endTiming(studyTiming, 'processStudy');
      return enhancedStudy;
      
    } catch (error) {
      this.log('Error processing study', error);
      virtualSeriesProfiler.endTiming(studyTiming, 'processStudy');
      // Return original study on error
      return study;
    }
  }

  /**
   * Create enhanced study with virtual series
   */
  async createEnhancedStudy(study, options) {
    const enhancementTiming = virtualSeriesProfiler.startTiming('createEnhancedStudy');
    
    try {
      // Validate study structure
      if (!this.isValidStudy(study)) {
        this.log('Invalid study structure', { studyUID: study.StudyInstanceUID });
        return study;
      }

      // Calculate study statistics
      const studyStats = this.calculateStudyStatistics(study);
      this.log('Study statistics calculated', studyStats);

      // Determine if virtual series should be created
      if (!this.shouldCreateVirtualSeries(study, studyStats, options)) {
        this.log('Skipping virtual series creation', { reason: 'Not eligible', studyUID: study.StudyInstanceUID });
        return study;
      }

      // Create virtual series with optimization
      const virtualSeries = await this.createOptimizedVirtualSeries(study, studyStats, options);
      
      // Create enhanced study
      const enhancedStudy = {
        ...study,
        series: [virtualSeries, ...(study.series || [])],
        virtualSeriesStats: studyStats,
        hasVirtualSeries: true
      };

      this.performanceMetrics.virtualSeriesCreated++;
      virtualSeriesProfiler.endTiming(enhancementTiming, 'createEnhancedStudy');
      return enhancedStudy;
      
    } catch (error) {
      this.log('Error creating enhanced study', error);
      virtualSeriesProfiler.endTiming(enhancementTiming, 'createEnhancedStudy');
      return study;
    }
  }

  /**
   * Create optimized virtual series
   */
  async createOptimizedVirtualSeries(study, studyStats, options) {
    const virtualTiming = virtualSeriesProfiler.startTiming('createVirtualSeries');
    
    try {
      // Create base virtual series structure
      const virtualSeries = {
        SeriesInstanceUID: `${study.StudyInstanceUID}.all-images`,
        SeriesNumber: this.options.virtualSeriesNumber,
        SeriesDescription: this.generateVirtualSeriesDescription(studyStats),
        SeriesDate: study.StudyDate,
        SeriesTime: study.StudyTime,
        Modality: this.options.virtualSeriesModality,
        isVirtualSeries: true,
        virtualSeriesVersion: '2.0',
        totalImageCount: studyStats.totalInstances,
        sourceSeriesCount: studyStats.totalSeries,
        instances: [],
        displaySets: []
      };

      // Progressive instance loading based on study size
      if (studyStats.totalInstances > 100) {
        // Large study - use progressive loading
        virtualSeries.instances = await this.loadInstancesProgressively(study, studyStats);
      } else {
        // Small study - load all instances immediately
        virtualSeries.instances = await this.loadAllInstances(study, studyStats);
      }

      // Add metadata for optimization
      virtualSeries.loadingStrategy = studyStats.totalInstances > 100 ? 'progressive' : 'immediate';
      virtualSeries.lastUpdated = new Date().toISOString();
      
      virtualSeriesProfiler.endTiming(virtualTiming, 'createVirtualSeries');
      return virtualSeries;
      
    } catch (error) {
      this.log('Error creating virtual series', error);
      virtualSeriesProfiler.endTiming(virtualTiming, 'createVirtualSeries');
      throw error;
    }
  }

  /**
   * Load instances progressively for large studies
   */
  async loadInstancesProgressively(study, studyStats) {
    const progressiveTiming = virtualSeriesProfiler.startTiming('loadInstancesProgressively');
    
    try {
      this.log('Loading instances progressively', { totalInstances: studyStats.totalInstances });
      
      // Use loading manager for progressive loading
      const instances = await this.loadingManager.loadVirtualSeriesInstances(
        study.StudyInstanceUID,
        `${study.StudyInstanceUID}.all-images`,
        { start: 0, end: Math.min(50, studyStats.totalInstances) } // Load first 50 instances
      );

      // Sort instances using optimized sorting
      const sortedInstances = await this.sortInstancesOptimized(instances);
      
      virtualSeriesProfiler.endTiming(progressiveTiming, 'loadInstancesProgressively');
      return sortedInstances;
      
    } catch (error) {
      this.log('Error in progressive loading', error);
      virtualSeriesProfiler.endTiming(progressiveTiming, 'loadInstancesProgressively');
      return await this.loadAllInstances(study, studyStats);
    }
  }

  /**
   * Load all instances immediately for smaller studies
   */
  async loadAllInstances(study, studyStats) {
    const loadTiming = virtualSeriesProfiler.startTiming('loadAllInstances');
    
    try {
      const allInstances = [];
      
      if (study.series && study.series.length > 0) {
        for (const series of study.series) {
          if (series.instances && Array.isArray(series.instances)) {
            allInstances.push(...series.instances);
          }
        }
      }

      // Sort instances using optimized sorting
      const sortedInstances = await this.sortInstancesOptimized(allInstances);
      
      virtualSeriesProfiler.endTiming(loadTiming, 'loadAllInstances');
      return sortedInstances;
      
    } catch (error) {
      this.log('Error loading all instances', error);
      virtualSeriesProfiler.endTiming(loadTiming, 'loadAllInstances');
      return [];
    }
  }

  /**
   * Optimized instance sorting
   */
  async sortInstancesOptimized(instances) {
    const sortTiming = virtualSeriesProfiler.startTiming('sortInstances');
    
    try {
      if (!Array.isArray(instances) || instances.length === 0) {
        return instances;
      }

      // Use primary sort strategy
      let sortedInstances = this.sortInstancesByStrategy(instances, this.options.defaultSortStrategy);
      
      // If primary strategy fails, use fallback
      if (!this.isSortedCorrectly(sortedInstances)) {
        this.log('Primary sort failed, using fallback strategy');
        sortedInstances = this.sortInstancesByStrategy(instances, this.options.fallbackSortStrategy);
      }

      virtualSeriesProfiler.endTiming(sortTiming, 'sortInstances');
      return sortedInstances;
      
    } catch (error) {
      this.log('Error sorting instances', error);
      virtualSeriesProfiler.endTiming(sortTiming, 'sortInstances');
      return instances;
    }
  }

  /**
   * Sort instances by specific strategy
   */
  sortInstancesByStrategy(instances, strategy) {
    switch (strategy) {
      case 'acquisitionTime':
        return instances.sort((a, b) => {
          if (a.AcquisitionTime && b.AcquisitionTime) {
            return a.AcquisitionTime.localeCompare(b.AcquisitionTime);
          }
          return (a.InstanceNumber || 0) - (b.InstanceNumber || 0);
        });
        
      case 'instanceNumber':
        return instances.sort((a, b) => (a.InstanceNumber || 0) - (b.InstanceNumber || 0));
        
      case 'imagePosition':
        return instances.sort((a, b) => {
          if (a.ImagePositionPatient && b.ImagePositionPatient) {
            // Sort by Z position (third component)
            const aZ = parseFloat(a.ImagePositionPatient[2]) || 0;
            const bZ = parseFloat(b.ImagePositionPatient[2]) || 0;
            return aZ - bZ;
          }
          return (a.InstanceNumber || 0) - (b.InstanceNumber || 0);
        });
        
      case 'contentTime':
        return instances.sort((a, b) => {
          if (a.ContentTime && b.ContentTime) {
            return a.ContentTime.localeCompare(b.ContentTime);
          }
          return (a.InstanceNumber || 0) - (b.InstanceNumber || 0);
        });
        
      default:
        this.log('Unknown sort strategy, using instance number', { strategy });
        return instances.sort((a, b) => (a.InstanceNumber || 0) - (b.InstanceNumber || 0));
    }
  }

  /**
   * Validation and utility methods
   */
  
  isValidStudy(study) {
    return study && 
           study.StudyInstanceUID && 
           study.series && 
           Array.isArray(study.series) &&
           study.series.length > 0;
  }

  shouldCreateVirtualSeries(study, studyStats, options) {
    // Don't create if disabled
    if (!this.options.enableVirtualSeries) {
      return false;
    }

    // Don't create if forced disabled in options
    if (options.disableVirtualSeries) {
      return false;
    }

    // Don't create if not enough instances
    if (studyStats.totalInstances < this.options.minInstancesForVirtual) {
      return false;
    }

    // Don't create if only one series with few instances
    if (studyStats.totalSeries === 1 && studyStats.totalInstances < 10) {
      return false;
    }

    return true;
  }

  calculateStudyStatistics(study) {
    let totalInstances = 0;
    let totalSeries = 0;
    const modalityCount = {};
    
    if (study.series && Array.isArray(study.series)) {
      totalSeries = study.series.length;
      
      study.series.forEach(series => {
        if (series.instances && Array.isArray(series.instances)) {
          totalInstances += series.instances.length;
        }
        
        if (series.Modality) {
          modalityCount[series.Modality] = (modalityCount[series.Modality] || 0) + 1;
        }
      });
    }

    return {
      totalInstances,
      totalSeries,
      modalityCount,
      isMultiModality: Object.keys(modalityCount).length > 1,
      dominantModality: this.getDominantModality(modalityCount)
    };
  }

  getDominantModality(modalityCount) {
    let maxCount = 0;
    let dominantModality = 'UNKNOWN';
    
    Object.entries(modalityCount).forEach(([modality, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantModality = modality;
      }
    });
    
    return dominantModality;
  }

  generateVirtualSeriesDescription(studyStats) {
    const { totalInstances, totalSeries, isMultiModality, dominantModality } = studyStats;
    
    if (isMultiModality) {
      return `All Images (${totalInstances} total from ${totalSeries} series)`;
    } else {
      return `All ${dominantModality} Images (${totalInstances} total)`;
    }
  }

  isSortedCorrectly(instances) {
    // Simple validation - check if instances have meaningful ordering
    if (instances.length < 2) return true;
    
    // Check if InstanceNumbers are sequential or at least increasing
    let hasSequentialNumbers = true;
    for (let i = 1; i < Math.min(instances.length, 10); i++) {
      const prev = instances[i-1].InstanceNumber || 0;
      const curr = instances[i].InstanceNumber || 0;
      if (curr <= prev) {
        hasSequentialNumbers = false;
        break;
      }
    }
    
    return hasSequentialNumbers;
  }

  /**
   * Caching methods
   */
  
  generateStudyCacheKey(study) {
    const seriesUIDs = study.series ? study.series.map(s => s.SeriesInstanceUID).sort().join(',') : '';
    return `study:${study.StudyInstanceUID}:${this.hashString(seriesUIDs)}`;
  }

  getCachedStudy(cacheKey) {
    if (!this.options.enableCaching) {
      return null;
    }

    const cached = this.studyMappingCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) { // 10 minute expiry
      return cached.study;
    }
    
    return null;
  }

  async cacheStudy(cacheKey, study) {
    if (!this.options.enableCaching) {
      return;
    }

    // Manage cache size
    if (this.studyMappingCache.size >= this.options.maxStudiesInCache) {
      // Remove oldest entries
      const entries = Array.from(this.studyMappingCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, Math.floor(this.options.maxStudiesInCache / 2));
      toRemove.forEach(([key]) => this.studyMappingCache.delete(key));
    }

    this.studyMappingCache.set(cacheKey, {
      study,
      timestamp: Date.now()
    });
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Performance and monitoring
   */
  
  updatePerformanceMetrics(originalCount, mappedStudies) {
    this.performanceMetrics.totalStudiesMapped += originalCount;
    
    // Update cache hit rate based on loading manager
    const loadingManagerMetrics = this.loadingManager.getPerformanceMetrics();
    this.performanceMetrics.cacheHitRate = loadingManagerMetrics.cacheHitRate || 0;
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      loadingManagerMetrics: this.loadingManager.getPerformanceMetrics(),
      cacheSize: this.studyMappingCache.size
    };
  }

  log(message, data = null) {
    if (this.options.enableDebugLogging) {
      if (data) {
        console.log(`[EnhancedMapStudiesService] ${message}`, data);
      } else {
        console.log(`[EnhancedMapStudiesService] ${message}`);
      }
    }
  }

  /**
   * Cleanup and disposal
   */
  dispose() {
    this.studyMappingCache.clear();
    this.log('EnhancedMapStudiesService disposed');
  }
}

// Factory function for easy integration
export function createEnhancedMapStudiesFunction(options = {}) {
  const service = new EnhancedMapStudiesService(options);
  
  return async (studies, mappingOptions = {}) => {
    return await service.mapStudies(studies, mappingOptions);
  };
}

// Export singleton instance
let globalMapStudiesService = null;

export function getEnhancedMapStudiesService(options = {}) {
  if (!globalMapStudiesService) {
    globalMapStudiesService = new EnhancedMapStudiesService(options);
  }
  return globalMapStudiesService;
}

export function resetEnhancedMapStudiesService() {
  if (globalMapStudiesService) {
    globalMapStudiesService.dispose();
    globalMapStudiesService = null;
  }
}

// Development helpers
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.getEnhancedMapStudiesService = getEnhancedMapStudiesService;
  window.EnhancedMapStudiesService = EnhancedMapStudiesService;
} 