/**
 * Data Source Registration Validation Utilities
 * 
 * Tools for validating Virtual Series data source registration
 * and integration with OHIF v3 architecture
 * 
 * Task 4.2: Data Source Registration Validation
 */

/**
 * Validates data source module structure follows OHIF v3 patterns
 */
export function validateDataSourceModule(dataSourceModule) {
  const validationResults = {
    isValid: true,
    errors: [],
    warnings: [],
    moduleInfo: {}
  };

  try {
    // Check if module is an array
    if (!Array.isArray(dataSourceModule)) {
      validationResults.errors.push('Data source module must return an array');
      validationResults.isValid = false;
      return validationResults;
    }

    // Validate each data source in the module
    dataSourceModule.forEach((dataSource, index) => {
      const dsValidation = validateDataSourceDefinition(dataSource, index);
      validationResults.errors.push(...dsValidation.errors);
      validationResults.warnings.push(...dsValidation.warnings);
      
      if (!dsValidation.isValid) {
        validationResults.isValid = false;
      }
    });

    validationResults.moduleInfo = {
      dataSourceCount: dataSourceModule.length,
      dataSourceNames: dataSourceModule.map(ds => ds.name),
      dataSourceTypes: dataSourceModule.map(ds => ds.type)
    };

  } catch (error) {
    validationResults.errors.push(`Module validation error: ${error.message}`);
    validationResults.isValid = false;
  }

  return validationResults;
}

/**
 * Validates individual data source definition
 */
export function validateDataSourceDefinition(dataSource, index = 0) {
  const validationResults = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const requiredFields = ['name', 'type', 'createDataSource'];
  const validTypes = ['webApi', 'jsonApi', 'localApi', 'mergeApi', 'other'];

  // Check required fields
  requiredFields.forEach(field => {
    if (!dataSource[field]) {
      validationResults.errors.push(`Data source ${index}: Missing required field '${field}'`);
      validationResults.isValid = false;
    }
  });

  // Validate specific fields
  if (dataSource.name) {
    if (typeof dataSource.name !== 'string') {
      validationResults.errors.push(`Data source ${index}: 'name' must be a string`);
      validationResults.isValid = false;
    }
  }

  if (dataSource.type) {
    if (!validTypes.includes(dataSource.type)) {
      validationResults.warnings.push(`Data source ${index}: '${dataSource.type}' is not a standard type. Valid types: ${validTypes.join(', ')}`);
    }
  }

  if (dataSource.createDataSource) {
    if (typeof dataSource.createDataSource !== 'function') {
      validationResults.errors.push(`Data source ${index}: 'createDataSource' must be a function`);
      validationResults.isValid = false;
    }
  }

  // Check for old/deprecated patterns
  const deprecatedFields = ['wadoUriRoot', 'qidoRoot', 'wadoRoot', 'mapStudies', 'retrieve'];
  deprecatedFields.forEach(field => {
    if (dataSource[field]) {
      validationResults.warnings.push(`Data source ${index}: '${field}' should be in configuration, not data source definition`);
    }
  });

  return validationResults;
}

/**
 * Tests data source creation with mock configuration
 */
export function testDataSourceCreation(dataSource, mockConfig = {}) {
  const testResults = {
    success: false,
    error: null,
    createdDataSource: null,
    validationResults: {}
  };

  try {
    const defaultConfig = {
      name: 'test-data-source',
      wadoUriRoot: 'https://example.com/wado',
      qidoRoot: 'https://example.com/qido',
      wadoRoot: 'https://example.com/wado-rs',
      ...mockConfig
    };

    // Attempt to create data source
    const createdDataSource = dataSource.createDataSource(defaultConfig);
    
    if (!createdDataSource) {
      testResults.error = 'createDataSource returned null/undefined';
      return testResults;
    }

    testResults.createdDataSource = createdDataSource;
    testResults.success = true;

    // Validate created data source structure
    testResults.validationResults = validateCreatedDataSource(createdDataSource);

  } catch (error) {
    testResults.error = error.message;
    testResults.success = false;
  }

  return testResults;
}

/**
 * Validates the structure of a created data source instance
 */
export function validateCreatedDataSource(dataSourceInstance) {
  const validationResults = {
    isValid: true,
    errors: [],
    warnings: [],
    features: {}
  };

  // Check for expected methods/properties
  const expectedMethods = ['query', 'retrieve', 'getConfig'];
  const optionalMethods = ['mapStudies', 'deleteStudyMetadataPromise'];

  expectedMethods.forEach(method => {
    if (!dataSourceInstance[method]) {
      validationResults.warnings.push(`Missing expected method: ${method}`);
    }
  });

  // Check for Virtual Series specific features
  if (dataSourceInstance.mapStudies) {
    validationResults.features.hasMapStudies = true;
    
    if (typeof dataSourceInstance.mapStudies === 'function') {
      validationResults.features.mapStudiesCallable = true;
    } else {
      validationResults.errors.push('mapStudies exists but is not a function');
      validationResults.isValid = false;
    }
  }

  if (dataSourceInstance._virtualSeriesConfig) {
    validationResults.features.hasVirtualSeriesConfig = true;
    validationResults.features.virtualSeriesConfig = dataSourceInstance._virtualSeriesConfig;
  }

  if (dataSourceInstance.getPerformanceMetrics) {
    validationResults.features.hasPerformanceMetrics = true;
  }

  if (dataSourceInstance.cleanup) {
    validationResults.features.hasCleanup = true;
  }

  return validationResults;
}

/**
 * Comprehensive data source registration validation suite
 */
export class DataSourceRegistrationValidator {
  constructor() {
    this.testResults = {};
    this.overallStatus = 'pending';
  }

  /**
   * Run comprehensive validation on a data source module
   */
  async validateModule(getDataSourcesModule) {
    console.log('[DataSourceValidator] Starting comprehensive validation...');
    
    try {
      // Test 1: Module Structure Validation
      const dataSourceModule = getDataSourcesModule();
      this.testResults.moduleStructure = validateDataSourceModule(dataSourceModule);
      
      // Test 2: Individual Data Source Creation
      this.testResults.dataSourceCreation = {};
      
      for (const [index, dataSource] of dataSourceModule.entries()) {
        const testResult = testDataSourceCreation(dataSource);
        this.testResults.dataSourceCreation[dataSource.name || index] = testResult;
      }

      // Test 3: Virtual Series Specific Tests
      this.testResults.virtualSeriesTests = await this.runVirtualSeriesTests(dataSourceModule);

      // Test 4: Performance Impact Assessment
      this.testResults.performanceTests = await this.runPerformanceTests(dataSourceModule);

      // Test 5: Integration Compatibility
      this.testResults.integrationTests = this.runIntegrationTests(dataSourceModule);

      // Determine overall status
      this.overallStatus = this.determineOverallStatus();

      console.log('[DataSourceValidator] Validation completed:', this.overallStatus);
      
    } catch (error) {
      console.error('[DataSourceValidator] Validation failed:', error);
      this.testResults.error = error.message;
      this.overallStatus = 'failed';
    }

    return this.generateReport();
  }

  /**
   * Run Virtual Series specific tests
   */
  async runVirtualSeriesTests(dataSourceModule) {
    const virtualSeriesTests = {
      hasVirtualSeriesDataSource: false,
      mapStudiesFunctionality: false,
      lazyLoadingSupport: false,
      performanceMonitoring: false
    };

    try {
      const virtualSeriesDS = dataSourceModule.find(ds => 
        ds.name.includes('virtual') || ds.name.includes('series')
      );

      if (virtualSeriesDS) {
        virtualSeriesTests.hasVirtualSeriesDataSource = true;

        // Test data source creation
        const testConfig = {
          name: 'test-virtual-series',
          wadoUriRoot: 'https://test.com/wado',
          qidoRoot: 'https://test.com/qido',
          wadoRoot: 'https://test.com/wado-rs'
        };

        const instance = virtualSeriesDS.createDataSource(testConfig);
        
        if (instance.mapStudies) {
          virtualSeriesTests.mapStudiesFunctionality = true;
        }

        if (instance.getPerformanceMetrics) {
          virtualSeriesTests.performanceMonitoring = true;
        }

        // Test with mock study data
        if (instance.mapStudies) {
          const mockStudy = this.createMockStudy();
          const result = instance.mapStudies([mockStudy]);
          
          if (result && result[0] && result[0].series && result[0].series[0].isVirtualSeries) {
            virtualSeriesTests.lazyLoadingSupport = true;
          }
        }
      }

    } catch (error) {
      virtualSeriesTests.error = error.message;
    }

    return virtualSeriesTests;
  }

  /**
   * Run performance impact tests
   */
  async runPerformanceTests(dataSourceModule) {
    const performanceTests = {
      moduleLoadTime: 0,
      dataSourceCreationTime: 0,
      mapStudiesPerformance: null
    };

         try {
       // Test module load performance (simulation)
       const startTime = performance.now();
       // Note: Module load performance would be tested in actual integration
       performanceTests.moduleLoadTime = performance.now() - startTime;

      // Test data source creation time
      const virtualSeriesDS = dataSourceModule.find(ds => 
        ds.name.includes('virtual') || ds.name.includes('series')
      );

      if (virtualSeriesDS) {
        const creationStart = performance.now();
        const instance = virtualSeriesDS.createDataSource({
          name: 'perf-test',
          wadoUriRoot: 'https://test.com/wado'
        });
        performanceTests.dataSourceCreationTime = performance.now() - creationStart;

        // Test mapStudies performance
        if (instance.mapStudies) {
          const mockStudies = [this.createMockStudy(), this.createMockStudy()];
          const mapStart = performance.now();
          instance.mapStudies(mockStudies);
          performanceTests.mapStudiesPerformance = performance.now() - mapStart;
        }
      }

    } catch (error) {
      performanceTests.error = error.message;
    }

    return performanceTests;
  }

  /**
   * Run integration compatibility tests
   */
  runIntegrationTests(dataSourceModule) {
    const integrationTests = {
      ohifCompatible: true,
      namingConventions: true,
      standardMethods: true,
      issues: []
    };

    try {
      dataSourceModule.forEach(dataSource => {
        // Check OHIF naming conventions
        if (!dataSource.name.match(/^[a-z][a-z0-9-]*$/)) {
          integrationTests.namingConventions = false;
          integrationTests.issues.push(`Data source name '${dataSource.name}' doesn't follow kebab-case convention`);
        }

        // Test creation and check for standard methods
        const instance = dataSource.createDataSource({ name: 'integration-test' });
        
        if (!instance.query || typeof instance.query !== 'function') {
          integrationTests.standardMethods = false;
          integrationTests.issues.push(`Data source '${dataSource.name}' missing query method`);
        }

        if (!instance.retrieve || typeof instance.retrieve !== 'object') {
          integrationTests.standardMethods = false;
          integrationTests.issues.push(`Data source '${dataSource.name}' missing retrieve object`);
        }
      });

      if (integrationTests.issues.length > 0) {
        integrationTests.ohifCompatible = false;
      }

    } catch (error) {
      integrationTests.error = error.message;
      integrationTests.ohifCompatible = false;
    }

    return integrationTests;
  }

  /**
   * Create mock study for testing
   */
  createMockStudy() {
    return {
      StudyInstanceUID: '1.2.3.4.5.test',
      StudyDate: '20241215',
      StudyTime: '120000',
      series: [
        {
          SeriesInstanceUID: '1.2.3.4.5.test.1',
          SeriesNumber: '1',
          Modality: 'CT',
          instances: [
            { SOPInstanceUID: '1.2.3.4.5.test.1.1', InstanceNumber: 1 },
            { SOPInstanceUID: '1.2.3.4.5.test.1.2', InstanceNumber: 2 }
          ]
        }
      ]
    };
  }

  /**
   * Determine overall validation status
   */
  determineOverallStatus() {
    if (this.testResults.error) {
      return 'failed';
    }

    let hasErrors = false;
    let hasWarnings = false;

    // Check module structure
    if (this.testResults.moduleStructure && !this.testResults.moduleStructure.isValid) {
      hasErrors = true;
    }

    // Check data source creation
    if (this.testResults.dataSourceCreation) {
      Object.values(this.testResults.dataSourceCreation).forEach(result => {
        if (!result.success) {
          hasErrors = true;
        }
      });
    }

    // Check integration tests
    if (this.testResults.integrationTests && !this.testResults.integrationTests.ohifCompatible) {
      hasErrors = true;
    }

    if (hasErrors) {
      return 'failed';
    } else if (hasWarnings) {
      return 'warning';
    } else {
      return 'passed';
    }
  }

  /**
   * Generate comprehensive validation report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      overallStatus: this.overallStatus,
      summary: this.generateSummary(),
      details: this.testResults,
      recommendations: this.generateRecommendations()
    };

    // Log summary to console
    console.log('\n[DataSourceValidator] VALIDATION REPORT');
    console.log('='.repeat(50));
    console.log(`Overall Status: ${this.overallStatus.toUpperCase()}`);
    console.log('\nSummary:');
    Object.entries(report.summary).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    return report;
  }

  /**
   * Generate validation summary
   */
  generateSummary() {
    const summary = {};

    if (this.testResults.moduleStructure) {
      summary['Data Source Count'] = this.testResults.moduleStructure.moduleInfo?.dataSourceCount || 0;
      summary['Structure Valid'] = this.testResults.moduleStructure.isValid ? 'Yes' : 'No';
    }

    if (this.testResults.virtualSeriesTests) {
      summary['Virtual Series Support'] = this.testResults.virtualSeriesTests.hasVirtualSeriesDataSource ? 'Yes' : 'No';
      summary['Performance Monitoring'] = this.testResults.virtualSeriesTests.performanceMonitoring ? 'Yes' : 'No';
    }

    if (this.testResults.integrationTests) {
      summary['OHIF Compatible'] = this.testResults.integrationTests.ohifCompatible ? 'Yes' : 'No';
    }

    return summary;
  }

  /**
   * Generate recommendations based on validation results
   */
  generateRecommendations() {
    const recommendations = [];

    // Module structure recommendations
    if (this.testResults.moduleStructure && this.testResults.moduleStructure.errors.length > 0) {
      recommendations.push('Fix data source module structure errors before deployment');
    }

    // Performance recommendations
    if (this.testResults.performanceTests) {
      if (this.testResults.performanceTests.moduleLoadTime > 100) {
        recommendations.push('Module load time is high. Consider optimizing imports and initialization');
      }
      if (this.testResults.performanceTests.dataSourceCreationTime > 50) {
        recommendations.push('Data source creation time is high. Consider lazy initialization patterns');
      }
    }

    // Integration recommendations
    if (this.testResults.integrationTests && this.testResults.integrationTests.issues.length > 0) {
      recommendations.push('Address integration compatibility issues for better OHIF v3 compliance');
    }

    // Virtual Series recommendations
    if (this.testResults.virtualSeriesTests && !this.testResults.virtualSeriesTests.performanceMonitoring) {
      recommendations.push('Add performance monitoring to Virtual Series implementation');
    }

    return recommendations;
  }
}

// Export convenience function for quick validation
export async function validateDataSourceRegistration(getDataSourcesModule) {
  const validator = new DataSourceRegistrationValidator();
  return await validator.validateModule(getDataSourcesModule);
} 