/**
 * UI-Enhancements Extension Configuration Templates
 * 
 * This module provides standardized configuration templates for deploying
 * the ui-enhancements extension across different environments and use cases.
 * 
 * Task 7.6: Configuration Template Creation
 */

/**
 * Base Configuration Schema
 * Defines all available configuration options with their default values
 */
export const BASE_CONFIG_SCHEMA = {
  // Core Feature Flags
  enableVirtualSeries: {
    type: 'boolean',
    default: true,
    description: 'Enable virtual series functionality for "scroll all" behavior'
  },
  enableGlobalPatientHeader: {
    type: 'boolean',
    default: true,
    description: 'Show global patient header at the top of the application'
  },
  enableStudyComparison: {
    type: 'boolean',
    default: true,
    description: 'Enable study comparison highlighting for current vs prior studies'
  },
  enableEnhancedToolbar: {
    type: 'boolean',
    default: true,
    description: 'Use enhanced toolbar with improved sizing and grouping'
  },
  enablePRDColorSystem: {
    type: 'boolean',
    default: true,
    description: 'Apply PRD color palette integration with light/dark themes'
  },

  // Virtual Series Configuration
  virtualSeries: {
    enabled: {
      type: 'boolean',
      default: true,
      description: 'Enable virtual series data source'
    },
    performance: {
      enableOptimizations: {
        type: 'boolean',
        default: true,
        description: 'Enable performance optimizations for large studies'
      },
      chunkSize: {
        type: 'number',
        default: 50,
        min: 10,
        max: 200,
        description: 'Number of instances to process in each chunk'
      },
      preloadThreshold: {
        type: 'number',
        default: 10,
        min: 1,
        max: 50,
        description: 'Number of instances to preload ahead'
      }
    },
    validation: {
      enableErrorHandling: {
        type: 'boolean',
        default: true,
        description: 'Enable comprehensive error handling and recovery'
      },
      logLevel: {
        type: 'string',
        default: 'info',
        options: ['debug', 'info', 'warn', 'error'],
        description: 'Logging level for virtual series operations'
      }
    }
  },

  // Toolbar Configuration
  toolbar: {
    enabled: {
      type: 'boolean',
      default: true,
      description: 'Enable enhanced toolbar functionality'
    },
    buttonSize: {
      type: 'string',
      default: 'large',
      options: ['small', 'medium', 'large'],
      description: 'Size of toolbar buttons'
    },
    enableGroupSeparators: {
      type: 'boolean',
      default: true,
      description: 'Show visual separators between toolbar groups'
    },
    modalitySpecificVisibility: {
      type: 'boolean',
      default: true,
      description: 'Show/hide tools based on current modality'
    }
  }
};

/**
 * Production Configuration Template
 * Optimized for production deployments with performance and stability
 */
export const PRODUCTION_CONFIG = {
  // Core features enabled with production optimizations
  enableVirtualSeries: true,
  enableGlobalPatientHeader: true,
  enableStudyComparison: true,
  enableEnhancedToolbar: true,
  enablePRDColorSystem: true,

  // Virtual Series - Production optimized
  virtualSeries: {
    enabled: true,
    performance: {
      enableOptimizations: true,
      chunkSize: 50,
      preloadThreshold: 10
    },
    validation: {
      enableErrorHandling: true,
      logLevel: 'warn'
    }
  },

  // Toolbar - Standard configuration
  toolbar: {
    enabled: true,
    buttonSize: 'large',
    enableGroupSeparators: true,
    modalitySpecificVisibility: true
  }
};

/**
 * Development Configuration Template
 * Optimized for development with debugging and monitoring enabled
 */
export const DEVELOPMENT_CONFIG = {
  // Core features enabled
  enableVirtualSeries: true,
  enableGlobalPatientHeader: true,
  enableStudyComparison: true,
  enableEnhancedToolbar: true,
  enablePRDColorSystem: true,

  // Virtual Series - Development with verbose logging
  virtualSeries: {
    enabled: true,
    performance: {
      enableOptimizations: true,
      chunkSize: 25, // Smaller chunks for testing
      preloadThreshold: 5
    },
    validation: {
      enableErrorHandling: true,
      logLevel: 'debug'
    }
  },

  // Toolbar - Development settings
  toolbar: {
    enabled: true,
    buttonSize: 'large',
    enableGroupSeparators: true,
    modalitySpecificVisibility: true
  }
};

/**
 * Configuration Templates Export
 */
export const CONFIG_TEMPLATES = {
  production: PRODUCTION_CONFIG,
  development: DEVELOPMENT_CONFIG
};

/**
 * Get configuration template by name
 */
export function getConfigTemplate(templateName) {
  const template = CONFIG_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Configuration template "${templateName}" not found`);
  }
  return { ...template }; // Return a copy
}

export default {
  BASE_CONFIG_SCHEMA,
  CONFIG_TEMPLATES,
  getConfigTemplate
};
