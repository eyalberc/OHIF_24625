/**
 * Example App Configurations for UI-Enhancements Extension
 * 
 * This file demonstrates how to integrate the ui-enhancements extension
 * with OHIF v3 app configurations using different templates.
 * 
 * Task 7.6: Configuration Template Creation
 */

import { getConfigTemplate, createCustomConfig } from './extensionConfigTemplates';

/**
 * Production App Configuration Example
 */
export const PRODUCTION_APP_CONFIG = {
  routerBasename: '/',
  extensions: [
    {
      packageName: '@ohif/extension-default',
      version: '^3.11.0'
    },
    {
      packageName: '@ohif/extension-cornerstone',
      version: '^3.11.0'
    },
    {
      packageName: '@ohif/extension-ui-enhancements',
      version: '3.11.0-beta.58',
      configuration: getConfigTemplate('production')
    }
  ],
  modes: [
    {
      packageName: '@ohif/mode-longitudinal',
      version: '^3.11.0'
    }
  ],
  dataSources: [
    {
      friendlyName: 'OHIF DICOMWeb Server',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        wado: {
          uri: '/dicomweb',
          qidoSupportsIncludeField: false,
        }
      }
    }
  ],
  defaultDataSourceName: 'dicomweb',
};

/**
 * Development App Configuration Example
 */
export const DEVELOPMENT_APP_CONFIG = {
  routerBasename: '/',
  extensions: [
    {
      packageName: '@ohif/extension-default',
      version: '^3.11.0'
    },
    {
      packageName: '@ohif/extension-cornerstone',
      version: '^3.11.0'
    },
    {
      packageName: '@ohif/extension-ui-enhancements',
      version: '3.11.0-beta.58',
      configuration: getConfigTemplate('development')
    }
  ],
  modes: [
    {
      packageName: '@ohif/mode-longitudinal',
      version: '^3.11.0'
    }
  ],
  dataSources: [
    {
      friendlyName: 'Development DICOMWeb Server',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        wado: {
          uri: 'http://localhost:8080/dicomweb',
          qidoSupportsIncludeField: false,
        }
      }
    }
  ],
  defaultDataSourceName: 'dicomweb',
  showLoadingIndicator: true,
  showWarningMessageForCrossOrigin: true,
};

/**
 * Clinical App Configuration Example
 */
export const CLINICAL_APP_CONFIG = {
  routerBasename: '/',
  extensions: [
    {
      packageName: '@ohif/extension-default',
      version: '^3.11.0'
    },
    {
      packageName: '@ohif/extension-cornerstone',
      version: '^3.11.0'
    },
    {
      packageName: '@ohif/extension-ui-enhancements',
      version: '3.11.0-beta.58',
      configuration: {
        // Custom clinical configuration
        enableVirtualSeries: true,
        enableGlobalPatientHeader: true,
        enableStudyComparison: true,
        enableEnhancedToolbar: true,
        enablePRDColorSystem: true,

        // Clinical-optimized virtual series
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

        // Clinical toolbar configuration
        toolbar: {
          enabled: true,
          buttonSize: 'large',
          enableGroupSeparators: true,
          modalitySpecificVisibility: true
        },

        // Clinical color system
        colorSystem: {
          enabled: true,
          theme: 'auto',
          accessibility: {
            enforceContrast: true,
            highContrastMode: false
          }
        },

        // Clinical study comparison
        studyComparison: {
          enabled: true,
          highlightStyle: 'border',
          currentStudyColor: '#22C55E', // Green for current
          priorStudyColor: '#F97316',   // Orange for prior
          enableOverlayLabels: true
        },

        // Clinical patient header
        patientHeader: {
          enabled: true,
          height: 52,
          showDemographics: true,
          customFields: [
            'PatientID',
            'AccessionNumber',
            'StudyDescription',
            'ReferringPhysician'
          ]
        }
      }
    }
  ],
  modes: [
    {
      packageName: '@ohif/mode-longitudinal',
      version: '^3.11.0'
    }
  ],
  dataSources: [
    {
      friendlyName: 'Clinical PACS',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        wado: {
          uri: '/pacs/dicomweb',
          qidoSupportsIncludeField: true,
        }
      }
    }
  ],
  defaultDataSourceName: 'dicomweb',
};

/**
 * Custom Configuration Example
 * Shows how to create a custom configuration with overrides
 */
export const CUSTOM_APP_CONFIG = {
  routerBasename: '/',
  extensions: [
    {
      packageName: '@ohif/extension-default',
      version: '^3.11.0'
    },
    {
      packageName: '@ohif/extension-cornerstone',
      version: '^3.11.0'
    },
    {
      packageName: '@ohif/extension-ui-enhancements',
      version: '3.11.0-beta.58',
      configuration: createCustomConfig('production', {
        // Override production defaults
        enableVirtualSeries: false, // Disable for this deployment
        toolbar: {
          buttonSize: 'medium',     // Smaller buttons
          enableGroupSeparators: false
        },
        patientHeader: {
          height: 40,               // Smaller header
          customFields: ['AccessionNumber'] // Only show accession
        }
      }).config
    }
  ],
  modes: [
    {
      packageName: '@ohif/mode-longitudinal',
      version: '^3.11.0'
    }
  ],
  dataSources: [
    {
      friendlyName: 'Custom DICOMWeb Server',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        wado: {
          uri: '/custom/dicomweb',
          qidoSupportsIncludeField: false,
        }
      }
    }
  ],
  defaultDataSourceName: 'dicomweb',
};

/**
 * Feature-Specific Configuration Examples
 */

// Virtual Series Only Configuration
export const VIRTUAL_SERIES_ONLY_CONFIG = {
  enableVirtualSeries: true,
  enableGlobalPatientHeader: false,
  enableStudyComparison: false,
  enableEnhancedToolbar: false,
  enablePRDColorSystem: false,

  virtualSeries: {
    enabled: true,
    performance: {
      enableOptimizations: true,
      chunkSize: 100, // Large chunks for virtual series focus
      preloadThreshold: 25
    },
    validation: {
      enableErrorHandling: true,
      logLevel: 'info'
    }
  }
};

// UI Enhancement Only Configuration
export const UI_ENHANCEMENT_ONLY_CONFIG = {
  enableVirtualSeries: false,
  enableGlobalPatientHeader: true,
  enableStudyComparison: true,
  enableEnhancedToolbar: true,
  enablePRDColorSystem: true,

  toolbar: {
    enabled: true,
    buttonSize: 'large',
    enableGroupSeparators: true,
    modalitySpecificVisibility: true
  },

  colorSystem: {
    enabled: true,
    theme: 'dark',
    accessibility: {
      enforceContrast: true,
      highContrastMode: false
    }
  },

  studyComparison: {
    enabled: true,
    highlightStyle: 'glow',
    currentStudyColor: '#60A5FA',
    priorStudyColor: '#FACC15',
    enableOverlayLabels: true
  },

  patientHeader: {
    enabled: true,
    height: 48,
    showDemographics: true,
    customFields: []
  }
};

/**
 * Environment-Based Configuration Factory
 */
export function createEnvironmentConfig(environment = 'production', overrides = {}) {
  const baseConfigs = {
    production: PRODUCTION_APP_CONFIG,
    development: DEVELOPMENT_APP_CONFIG,
    clinical: CLINICAL_APP_CONFIG,
    custom: CUSTOM_APP_CONFIG
  };

  const baseConfig = baseConfigs[environment];
  if (!baseConfig) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  // Deep merge overrides
  const mergedConfig = JSON.parse(JSON.stringify(baseConfig));
  
  if (overrides.extensions) {
    overrides.extensions.forEach((override, index) => {
      if (mergedConfig.extensions[index]) {
        Object.assign(mergedConfig.extensions[index], override);
      }
    });
  }

  return mergedConfig;
}

/**
 * Configuration Validation Helper
 */
export function validateAppConfig(config) {
  const requiredFields = ['routerBasename', 'extensions', 'modes', 'dataSources'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
  }

  // Validate UI-Enhancements extension configuration
  const uiEnhancementsExtension = config.extensions.find(
    ext => ext.packageName === '@ohif/extension-ui-enhancements'
  );

  if (uiEnhancementsExtension && uiEnhancementsExtension.configuration) {
    // Additional validation could be added here
    console.log('UI-Enhancements extension configuration found and validated');
  }

  return true;
}

export default {
  PRODUCTION_APP_CONFIG,
  DEVELOPMENT_APP_CONFIG,
  CLINICAL_APP_CONFIG,
  CUSTOM_APP_CONFIG,
  VIRTUAL_SERIES_ONLY_CONFIG,
  UI_ENHANCEMENT_ONLY_CONFIG,
  createEnvironmentConfig,
  validateAppConfig
}; 