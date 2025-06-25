/**
 * Data Source Registration Order Utility
 * 
 * This module manages the proper registration order for data sources in the
 * ui-enhancements extension, ensuring dependencies are satisfied and
 * data flows correctly through the OHIF v3 system.
 * 
 * Task 7.3: Data Source Registration Order
 */

// Simple logger for data source registration
const ConflictLogger = {
  log(level, message, details = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[Data Source Registration ${timestamp}] ${message}`;
    
    switch (level) {
      case 'info':
        console.log(logMessage, details || '');
        break;
      case 'warn':
        console.warn(logMessage, details || '');
        break;
      case 'error':
        console.error(logMessage, details || '');
        break;
      default:
        console.log(logMessage, details || '');
    }
  }
};

/**
 * Data Source Registration Priorities
 * Higher numbers indicate higher priority for data source selection
 */
export const DATA_SOURCE_PRIORITIES = {
  UI_ENHANCEMENTS: 100,    // Highest - our enhanced data sources
  MERGE: 90,               // High - merge data sources
  CUSTOM_WEB: 80,          // High - custom web implementations
  DICOM_WEB: 70,           // Standard - primary web data sources
  DICOM_WEB_PROXY: 60,     // Medium - proxy implementations
  DICOM_JSON: 50,          // Medium - JSON implementations
  DICOM_LOCAL: 40,         // Lower - local file sources
  FALLBACK: 10             // Lowest - fallback implementations
};

/**
 * Data Source Dependencies Map
 * Defines which data sources depend on others
 */
export const DATA_SOURCE_DEPENDENCIES = {
  'enhanced-dicom-web': ['dicomweb'],                    // Wraps/extends default dicomweb
  'enhanced-virtual-series': ['enhanced-dicom-web'],    // Builds on enhanced dicomweb
  'enhanced-merge': ['dicomweb', 'dicomjson'],         // Requires multiple base sources
  'enhanced-proxy': ['dicomwebproxy']                   // Extends proxy functionality
};

/**
 * Data Source Registration Order
 * Defines the specific order for registering data sources
 */
export const REGISTRATION_ORDER = [
  // Phase 1: Base OHIF data sources (dependencies)
  'dicomweb',
  'dicomwebproxy', 
  'dicomjson',
  'dicomlocal',
  'merge',
  
  // Phase 2: UI-Enhancements base data sources
  'enhanced-dicom-web',
  
  // Phase 3: UI-Enhancements specialized data sources
  'enhanced-virtual-series',
  'enhanced-merge',
  'enhanced-proxy',
  
  // Phase 4: UI-Enhancements advanced features
  'enhanced-caching',
  'enhanced-optimization'
];

/**
 * Data Source Registration Manager
 * Manages the registration sequence and dependency validation
 */
export class DataSourceRegistrationManager {
  constructor() {
    this.registeredSources = new Map();
    this.registrationQueue = [];
    this.dependencyGraph = new Map();
    this.registrationMetrics = {
      totalSources: 0,
      successfulRegistrations: 0,
      failedRegistrations: 0,
      dependencyConflicts: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Validate dependencies for a data source
   */
  validateDependencies(sourceName, availableSources = []) {
    const dependencies = DATA_SOURCE_DEPENDENCIES[sourceName] || [];
    const missing = dependencies.filter(dep => !availableSources.includes(dep));
    
    return {
      isValid: missing.length === 0,
      dependencies,
      missingDependencies: missing,
      hasCircularDependency: this.checkCircularDependency(sourceName, dependencies)
    };
  }

  /**
   * Check for circular dependencies
   */
  checkCircularDependency(sourceName, dependencies, visited = new Set()) {
    if (visited.has(sourceName)) {
      return true; // Circular dependency detected
    }
    
    visited.add(sourceName);
    
    for (const dep of dependencies) {
      const depDependencies = DATA_SOURCE_DEPENDENCIES[dep] || [];
      if (this.checkCircularDependency(dep, depDependencies, new Set(visited))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Sort data sources by registration order and dependencies
   */
  sortDataSourcesByOrder(dataSources) {
    const sourceMap = new Map();
    dataSources.forEach(source => {
      sourceMap.set(source.name, source);
    });

    const sorted = [];
    const processed = new Set();

    // First, add sources following the defined order
    for (const sourceName of REGISTRATION_ORDER) {
      if (sourceMap.has(sourceName) && !processed.has(sourceName)) {
        const source = sourceMap.get(sourceName);
        const validation = this.validateDependencies(sourceName, Array.from(processed));
        
        if (validation.isValid) {
          sorted.push({
            ...source,
            registrationOrder: REGISTRATION_ORDER.indexOf(sourceName),
            priority: DATA_SOURCE_PRIORITIES[sourceName.toUpperCase().replace(/-/g, '_')] || DATA_SOURCE_PRIORITIES.FALLBACK,
            dependencies: validation.dependencies,
            registrationPhase: this.getRegistrationPhase(sourceName)
          });
          processed.add(sourceName);
        } else {
          ConflictLogger.log('warn', `Data source ${sourceName} has unmet dependencies`, validation);
          this.registrationMetrics.dependencyConflicts++;
        }
      }
    }

    // Add any remaining sources not in the defined order
    dataSources.forEach(source => {
      if (!processed.has(source.name)) {
        sorted.push({
          ...source,
          registrationOrder: 999, // Low priority for undefined sources
          priority: DATA_SOURCE_PRIORITIES.FALLBACK,
          dependencies: [],
          registrationPhase: 'undefined'
        });
        processed.add(source.name);
      }
    });

    ConflictLogger.log('info', `Data source registration order determined for ${sorted.length} sources`);
    return sorted;
  }

  /**
   * Get registration phase for a data source
   */
  getRegistrationPhase(sourceName) {
    const index = REGISTRATION_ORDER.indexOf(sourceName);
    if (index >= 0 && index <= 4) return 'base-ohif';
    if (index >= 5 && index <= 5) return 'enhanced-base';
    if (index >= 6 && index <= 8) return 'enhanced-specialized';
    if (index >= 9) return 'enhanced-advanced';
    return 'undefined';
  }

  /**
   * Register data sources in the correct order
   */
  async registerDataSources(dataSources, extensionManager = null) {
    this.registrationMetrics.startTime = Date.now();
    this.registrationMetrics.totalSources = dataSources.length;
    
    ConflictLogger.log('info', 'Starting data source registration process', {
      totalSources: dataSources.length,
      hasExtensionManager: !!extensionManager
    });

    try {
      // Sort data sources by registration order
      const sortedSources = this.sortDataSourcesByOrder(dataSources);
      
      // Register sources in order
      const registrationResults = [];
      
      for (const source of sortedSources) {
        try {
          const result = await this.registerSingleDataSource(source, extensionManager);
          registrationResults.push(result);
          
          if (result.success) {
            this.registeredSources.set(source.name, source);
            this.registrationMetrics.successfulRegistrations++;
          } else {
            this.registrationMetrics.failedRegistrations++;
          }
          
        } catch (error) {
          ConflictLogger.log('error', `Failed to register data source: ${source.name}`, error);
          this.registrationMetrics.failedRegistrations++;
          
          registrationResults.push({
            sourceName: source.name,
            success: false,
            error: error.message,
            registrationOrder: source.registrationOrder
          });
        }
      }
      
      this.registrationMetrics.endTime = Date.now();
      
      const summary = this.generateRegistrationSummary(registrationResults);
      ConflictLogger.log('info', 'Data source registration completed', summary);
      
      return {
        success: this.registrationMetrics.failedRegistrations === 0,
        results: registrationResults,
        summary,
        metrics: this.registrationMetrics
      };
      
    } catch (error) {
      ConflictLogger.log('error', 'Data source registration process failed', error);
      this.registrationMetrics.endTime = Date.now();
      
      return {
        success: false,
        error: error.message,
        metrics: this.registrationMetrics
      };
    }
  }

  /**
   * Register a single data source
   */
  async registerSingleDataSource(source, extensionManager) {
    ConflictLogger.log('info', `Registering data source: ${source.name}`, {
      priority: source.priority,
      phase: source.registrationPhase,
      dependencies: source.dependencies
    });

    try {
      // Validate dependencies before registration
      const dependencyValidation = this.validateDependencies(
        source.name, 
        Array.from(this.registeredSources.keys())
      );
      
      if (!dependencyValidation.isValid) {
        throw new Error(`Unmet dependencies: ${dependencyValidation.missingDependencies.join(', ')}`);
      }
      
      // Register with extension manager if available
      if (extensionManager && extensionManager.registerDataSource) {
        await extensionManager.registerDataSource(source);
      }
      
      return {
        sourceName: source.name,
        success: true,
        registrationOrder: source.registrationOrder,
        priority: source.priority,
        phase: source.registrationPhase,
        dependencies: source.dependencies
      };
      
    } catch (error) {
      return {
        sourceName: source.name,
        success: false,
        error: error.message,
        registrationOrder: source.registrationOrder
      };
    }
  }

  /**
   * Generate registration summary
   */
  generateRegistrationSummary(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    const summary = {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      registrationTime: this.registrationMetrics.endTime - this.registrationMetrics.startTime,
      phases: {
        'base-ohif': successful.filter(r => r.phase === 'base-ohif').length,
        'enhanced-base': successful.filter(r => r.phase === 'enhanced-base').length,
        'enhanced-specialized': successful.filter(r => r.phase === 'enhanced-specialized').length,
        'enhanced-advanced': successful.filter(r => r.phase === 'enhanced-advanced').length
      },
      failedSources: failed.map(f => ({
        name: f.sourceName,
        error: f.error
      }))
    };
    
    return summary;
  }

  /**
   * Get registration metrics
   */
  getRegistrationMetrics() {
    return { ...this.registrationMetrics };
  }

  /**
   * Clear registration state
   */
  reset() {
    this.registeredSources.clear();
    this.registrationQueue = [];
    this.dependencyGraph.clear();
    this.registrationMetrics = {
      totalSources: 0,
      successfulRegistrations: 0,
      failedRegistrations: 0,
      dependencyConflicts: 0,
      startTime: null,
      endTime: null
    };
  }
}

/**
 * Factory function to create registration manager
 */
export function createDataSourceRegistrationManager() {
  return new DataSourceRegistrationManager();
}

export default {
  DataSourceRegistrationManager,
  createDataSourceRegistrationManager,
  DATA_SOURCE_PRIORITIES,
  DATA_SOURCE_DEPENDENCIES,
  REGISTRATION_ORDER
};
