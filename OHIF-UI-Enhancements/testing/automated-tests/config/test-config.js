/**
 * Test Configuration
 * 
 * Centralized configuration for automated testing framework
 * Provides environment-specific settings and performance thresholds
 */

const path = require('path');

// Environment configuration
const environment = process.env.NODE_ENV || 'test';
const isCI = process.env.CI === 'true';
const isDebug = process.env.DEBUG === 'true';

// Base configuration
const config = {
  // Environment settings
  environment: environment,
  isCI: isCI,
  isDebug: isDebug,
  
  // Application settings
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
  
  // Test execution settings
  timeout: {
    default: 30000,      // 30 seconds default timeout
    long: 60000,         // 1 minute for complex operations
    veryLong: 120000,    // 2 minutes for stress tests
    critical: 10000      // 10 seconds for critical path tests
  },
  
  // Retry configuration
  retries: {
    default: isCI ? 2 : 1,
    flaky: isCI ? 3 : 2,
    critical: 0          // No retries for critical tests
  },
  
  // Parallel execution
  parallel: {
    enabled: !isDebug,
    maxWorkers: isCI ? 2 : 4,
    criticalMaxWorkers: 1  // Sequential for critical tests
  },
  
  // Performance thresholds
  performance: {
    // Study loading performance thresholds
    loadTime: {
      small: 1200,    // Small studies (<50 images): 1.2s target with 20% tolerance
      medium: 2400,   // Medium studies (51-200 images): 2.4s target
      large: 3600,    // Large studies (201-500 images): 3.6s target
      xlarge: 6000    // Extra large studies (500+ images): 6s target
    },
    
    // Memory usage thresholds
    memory: {
      peak: 2.4 * 1024 * 1024 * 1024,    // 2.4GB peak memory (20% tolerance on 2GB)
      baseline: 300 * 1024 * 1024,        // 300MB baseline memory
      leakThreshold: 0.5 * 1024 * 1024 * 1024  // 500MB memory leak threshold
    },
    
    // Frame rate thresholds
    frameRate: {
      minimum: 50,        // 50fps minimum (target: 60fps with tolerance)
      target: 60,         // 60fps target
      tolerance: 0.15     // 15% tolerance
    },
    
    // User interaction thresholds
    toolActivation: {
      maxTime: 200        // 200ms maximum tool activation time
    },
    
    // Virtual series performance
    virtualScroll: {
      maxTime: 500        // 500ms maximum scroll response time
    },
    
    // Study comparison highlighting
    highlighting: {
      maxTime: 500        // 500ms maximum highlighting time
    },
    
    // Layout changes
    layoutChange: {
      maxTime: 300        // 300ms maximum layout change time
    },
    
    // Full feature load (all enhanced features active)
    fullFeatureLoad: {
      maxTime: 15000      // 15 seconds maximum for all features to load
    },
    
    // Network performance
    network: {
      maxRequests: 100,           // Maximum requests per study
      maxRequestTime: 500,        // Maximum request time in ms
      cacheHitRateThreshold: 0.7  // 70% cache hit rate threshold
    }
  },
  
  // Browser configuration
  browsers: {
    chromium: {
      headless: isCI,
      slowMo: isDebug ? 50 : 0,
      viewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--enable-memory-info',
        '--js-flags=--expose-gc'
      ]
    },
    firefox: {
      headless: isCI,
      slowMo: isDebug ? 50 : 0,
      viewport: { width: 1920, height: 1080 }
    },
    webkit: {
      headless: isCI,
      slowMo: isDebug ? 50 : 0,
      viewport: { width: 1920, height: 1080 }
    }
  },
  
  // Test data configuration
  testData: {
    samplesPath: path.join(__dirname, '../test-data/dicom-samples'),
    mockDataPath: path.join(__dirname, '../test-data/mock-data'),
    fixturesPath: path.join(__dirname, '../test-data/test-fixtures'),
    
    // DICOM test data categories
    categories: {
      small: {
        name: 'Small Studies',
        imageCountRange: [1, 50],
        expectedCount: 20
      },
      medium: {
        name: 'Medium Studies',
        imageCountRange: [51, 200],
        expectedCount: 15
      },
      large: {
        name: 'Large Studies',
        imageCountRange: [201, 500],
        expectedCount: 10
      },
      xlarge: {
        name: 'Extra Large Studies',
        imageCountRange: [501, 2000],
        expectedCount: 5
      }
    },
    
    // Modality distribution
    modalities: {
      CT: { weight: 0.4, minStudies: 10 },
      MR: { weight: 0.3, minStudies: 8 },
      CR: { weight: 0.15, minStudies: 5 },
      US: { weight: 0.1, minStudies: 3 },
      NM: { weight: 0.05, minStudies: 2 }
    }
  },
  
  // Enhanced features configuration
  enhancedFeatures: {
    virtualSeries: {
      enabled: true,
      testSelector: '[data-testid="virtual-series-component"]',
      scrollButtonSelector: '[data-testid="scroll-all-button"]'
    },
    enhancedHeader: {
      enabled: true,
      testSelector: '[data-testid="enhanced-patient-header"]',
      patientNameSelector: '[data-testid="patient-name"]',
      patientIdSelector: '[data-testid="patient-id"]'
    },
    enhancedToolbar: {
      enabled: true,
      testSelector: '[data-testid="enhanced-toolbar"]',
      tools: [
        'enhanced-zoom-tool',
        'enhanced-pan-tool',
        'enhanced-windowing-tool',
        'enhanced-measurement-tool',
        'enhanced-annotation-tool'
      ]
    },
    studyComparison: {
      enabled: true,
      testSelector: '[data-testid="study-comparison-panel"]',
      comparisonButtonSelector: '[data-testid="comparison-mode-button"]',
      highlightsSelector: '[data-testid="difference-highlights"]'
    },
    hangingProtocols: {
      enabled: true,
      testSelector: '[data-testid="enhanced-layout"]',
      selectorSelector: '[data-testid="hanging-protocol-selector"]',
      protocols: [
        'enhanced-hanging-protocol',
        'comparison-hanging-protocol',
        'multi-series-protocol'
      ]
    },
    prioritySystem: {
      enabled: true,
      testSelector: '[data-testid="priority-indicator"]',
      headerSelector: '[data-testid="enhanced-patient-header"]'
    }
  },
  
  // Reporting configuration
  reporting: {
    outputDir: path.join(__dirname, '../reports'),
    formats: ['json', 'html', 'junit'],
    
    // Report retention
    retention: {
      days: 30,           // Keep reports for 30 days
      maxReports: 100     // Keep maximum 100 reports
    },
    
    // Screenshot configuration
    screenshots: {
      enabled: true,
      onFailure: true,
      onSuccess: isDebug,
      directory: path.join(__dirname, '../reports/screenshots'),
      format: 'png',
      fullPage: true
    },
    
    // Video recording
    videos: {
      enabled: isDebug || process.env.RECORD_VIDEO === 'true',
      directory: path.join(__dirname, '../reports/videos'),
      size: { width: 1920, height: 1080 }
    },
    
    // Performance monitoring
    performanceMetrics: {
      enabled: true,
      collectMemory: true,
      collectNetwork: true,
      collectFrameRate: true,
      collectCustomMetrics: true
    }
  },
  
  // Error handling configuration
  errorHandling: {
    // Failure classification
    failureTypes: {
      critical: {
        patterns: ['TypeError', 'ReferenceError', 'SyntaxError'],
        failFast: true
      },
      network: {
        patterns: ['NetworkError', 'TimeoutError', 'AbortError'],
        retry: true
      },
      performance: {
        patterns: ['PerformanceTimeout', 'MemoryError'],
        retry: false
      }
    },
    
    // Error recovery
    recovery: {
      pageReload: true,
      clearCache: true,
      resetState: true
    }
  },
  
  // CI/CD specific configuration
  cicd: {
    // Test strategies by branch/context
    strategies: {
      'pull-request': {
        suites: ['critical', 'regression'],
        timeout: 15 * 60 * 1000,  // 15 minutes
        failFast: true
      },
      'master-branch': {
        suites: ['critical', 'regression', 'performance', 'integration'],
        timeout: 30 * 60 * 1000,  // 30 minutes
        failFast: false
      },
      'develop-branch': {
        suites: ['critical', 'regression', 'integration'],
        timeout: 25 * 60 * 1000,  // 25 minutes
        failFast: false
      },
      'release-branch': {
        suites: ['critical', 'regression', 'performance', 'integration', 'cross-browser'],
        timeout: 45 * 60 * 1000,  // 45 minutes
        failFast: false
      },
      'nightly': {
        suites: ['all'],
        timeout: 60 * 60 * 1000,  // 60 minutes
        failFast: false
      },
      'feature-branch': {
        suites: ['critical'],
        timeout: 10 * 60 * 1000,  // 10 minutes
        failFast: true
      }
    },
    
    // Notification settings
    notifications: {
      slack: {
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        webhook: process.env.SLACK_WEBHOOK_URL,
        channels: {
          success: '#test-results',
          failure: '#test-failures'
        }
      },
      email: {
        enabled: !!process.env.EMAIL_NOTIFICATIONS,
        recipients: process.env.EMAIL_RECIPIENTS?.split(',') || []
      }
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || (isDebug ? 'debug' : 'info'),
    console: true,
    file: {
      enabled: true,
      path: path.join(__dirname, '../logs/test-execution.log'),
      maxSize: '10MB',
      maxFiles: 5
    },
    
    // Structured logging
    structured: {
      enabled: isCI,
      format: 'json'
    }
  },
  
  // Security and compliance
  security: {
    // Content Security Policy for tests
    csp: {
      enabled: false,  // Disabled for testing
      policy: "default-src 'self' 'unsafe-inline' 'unsafe-eval'"
    },
    
    // Data privacy
    privacy: {
      maskSensitiveData: true,
      anonymizeScreenshots: true,
      excludePersonalData: true
    }
  }
};

// Environment-specific overrides
const environmentConfigs = {
  development: {
    baseUrl: 'http://localhost:3000',
    performance: {
      // Relaxed thresholds for development
      loadTime: {
        small: 2000,
        medium: 4000,
        large: 6000,
        xlarge: 10000
      }
    },
    parallel: {
      maxWorkers: 1  // Sequential execution for debugging
    }
  },
  
  staging: {
    baseUrl: process.env.STAGING_URL || 'https://staging.ohif.com',
    performance: {
      // Slightly relaxed thresholds for staging
      loadTime: {
        small: 1500,
        medium: 3000,
        large: 4500,
        xlarge: 7500
      }
    }
  },
  
  production: {
    baseUrl: process.env.PRODUCTION_URL || 'https://app.ohif.com',
    // Use strict production thresholds (default config)
    retries: {
      default: 0,  // No retries in production testing
      flaky: 1,
      critical: 0
    }
  }
};

// Merge environment-specific configuration
if (environmentConfigs[environment]) {
  Object.assign(config, mergeDeep(config, environmentConfigs[environment]));
}

/**
 * Deep merge utility function
 */
function mergeDeep(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Validate configuration on load
 */
function validateConfig() {
  const requiredFields = [
    'baseUrl',
    'performance.loadTime',
    'testData.samplesPath'
  ];
  
  for (const field of requiredFields) {
    const value = field.split('.').reduce((obj, key) => obj?.[key], config);
    if (value === undefined) {
      throw new Error(`Required configuration field missing: ${field}`);
    }
  }
  
  console.log(`✅ Test configuration validated for environment: ${environment}`);
}

// Validate configuration on module load
validateConfig();

module.exports = config; 