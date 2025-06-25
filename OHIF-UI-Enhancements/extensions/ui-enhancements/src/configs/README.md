# UI-Enhancements Extension Configuration Guide

This directory contains standardized configuration templates for deploying the ui-enhancements extension across different environments and use cases.

## Overview

The UI-Enhancements extension provides a comprehensive configuration system that allows you to customize the behavior and appearance of enhanced OHIF features. The configuration system includes:

- **Feature Flags**: Enable/disable specific enhancements
- **Performance Settings**: Optimize for different deployment scenarios
- **UI Customization**: Customize appearance and behavior
- **Template System**: Pre-configured templates for common scenarios

## Configuration Templates

### Available Templates

| Template | Use Case | Description |
|----------|----------|-------------|
| `production` | Production deployments | Optimized for performance and stability |
| `development` | Development environment | Enhanced debugging and monitoring |
| `minimal` | Lightweight deployments | Only essential features enabled |
| `research` | Research environments | Advanced features for research workflows |
| `clinical` | Clinical environments | Optimized for clinical workflows |

### Template Usage

```javascript
import { getConfigTemplate, createCustomConfig } from './configs/extensionConfigTemplates';

// Use a pre-defined template
const productionConfig = getConfigTemplate('production');

// Create custom configuration with overrides
const customConfig = createCustomConfig('production', {
  enableVirtualSeries: false,
  toolbar: {
    buttonSize: 'medium'
  }
});
```

## Configuration Schema

### Core Feature Flags

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableVirtualSeries` | boolean | true | Enable virtual series functionality |
| `enableGlobalPatientHeader` | boolean | true | Show global patient header |
| `enableStudyComparison` | boolean | true | Enable study comparison highlighting |
| `enableEnhancedToolbar` | boolean | true | Use enhanced toolbar features |
| `enablePRDColorSystem` | boolean | true | Apply PRD color palette |

### Virtual Series Configuration

```javascript
virtualSeries: {
  enabled: true,
  performance: {
    enableOptimizations: true,
    chunkSize: 50,           // 10-200 instances per chunk
    preloadThreshold: 10     // 1-50 instances to preload
  },
  validation: {
    enableErrorHandling: true,
    logLevel: 'info'         // debug, info, warn, error
  }
}
```

### Toolbar Configuration

```javascript
toolbar: {
  enabled: true,
  buttonSize: 'large',              // small, medium, large
  enableGroupSeparators: true,
  modalitySpecificVisibility: true,
  customGroups: []                  // Custom button groups
}
```

### Color System Configuration

```javascript
colorSystem: {
  enabled: true,
  theme: 'auto',                    // light, dark, auto
  customColors: {},
  accessibility: {
    enforceContrast: true,
    highContrastMode: false
  }
}
```

### Study Comparison Configuration

```javascript
studyComparison: {
  enabled: true,
  highlightStyle: 'border',         // border, glow, overlay
  currentStudyColor: '#60A5FA',
  priorStudyColor: '#FACC15',
  enableOverlayLabels: true
}
```

### Patient Header Configuration

```javascript
patientHeader: {
  enabled: true,
  height: 48,                       // 32-80 pixels
  showDemographics: true,
  customFields: []                  // Additional DICOM fields
}
```

## Environment-Specific Configurations

### Production Environment

```javascript
{
  // Optimized for performance and stability
  enableVirtualSeries: true,
  virtualSeries: {
    performance: {
      chunkSize: 50,
      preloadThreshold: 10
    },
    validation: {
      logLevel: 'warn'              // Minimal logging
    }
  },
  debug: {
    enableLogging: false,
    enablePerformanceMetrics: false
  }
}
```

### Development Environment

```javascript
{
  // Enhanced debugging and monitoring
  virtualSeries: {
    performance: {
      chunkSize: 25,                // Smaller for testing
      preloadThreshold: 5
    },
    validation: {
      logLevel: 'debug'             // Verbose logging
    }
  },
  debug: {
    enableLogging: true,
    enablePerformanceMetrics: true
  }
}
```

### Clinical Environment

```javascript
{
  // Optimized for clinical workflows
  studyComparison: {
    currentStudyColor: '#22C55E',   // Green for current
    priorStudyColor: '#F97316'      // Orange for prior
  },
  patientHeader: {
    customFields: [
      'PatientID',
      'AccessionNumber',
      'StudyDescription',
      'ReferringPhysician'
    ]
  }
}
```

## Integration with OHIF App Configuration

### Method 1: Direct Configuration

```javascript
// In your OHIF app configuration
const extensions = [
  {
    packageName: '@ohif/extension-ui-enhancements',
    version: '3.11.0-beta.58',
    configuration: {
      enableVirtualSeries: true,
      enableGlobalPatientHeader: true,
      toolbar: {
        buttonSize: 'large',
        enableGroupSeparators: true
      }
    }
  }
];
```

### Method 2: Template-Based Configuration

```javascript
import { getConfigTemplate } from '@ohif/extension-ui-enhancements/configs';

const extensions = [
  {
    packageName: '@ohif/extension-ui-enhancements',
    version: '3.11.0-beta.58',
    configuration: getConfigTemplate('production')
  }
];
```

### Method 3: Custom Configuration

```javascript
import { createCustomConfig } from '@ohif/extension-ui-enhancements/configs';

const { config } = createCustomConfig('clinical', {
  virtualSeries: {
    performance: {
      chunkSize: 75  // Larger chunks for clinical datasets
    }
  }
});

const extensions = [
  {
    packageName: '@ohif/extension-ui-enhancements',
    version: '3.11.0-beta.58',
    configuration: config
  }
];
```

## Configuration Validation

The configuration system includes automatic validation:

```javascript
import { ConfigurationValidator } from './configs/extensionConfigTemplates';

const validation = ConfigurationValidator.validate(myConfig);

if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Configuration warnings:', validation.warnings);
}
```

## Performance Considerations

### Memory Management

- **`chunkSize`**: Larger values improve performance but use more memory
- **`preloadThreshold`**: Higher values improve responsiveness but use more memory
- **`enableOptimizations`**: Enable for production deployments

### Logging Impact

- **Production**: Use `warn` or `error` log levels
- **Development**: Use `debug` or `info` for detailed information
- **Performance Monitoring**: Disable in production unless needed

## Troubleshooting

### Common Issues

1. **Extension not loading**: Check that configuration is valid JSON/JavaScript
2. **Features not working**: Verify feature flags are enabled
3. **Performance issues**: Adjust `chunkSize` and `preloadThreshold`
4. **UI not updating**: Check theme and color system configuration

### Debugging

Enable debug logging to troubleshoot issues:

```javascript
{
  debug: {
    enableLogging: true,
    logLevel: 'debug',
    enablePerformanceMetrics: true
  }
}
```

## Migration Guide

### From Previous Versions

If upgrading from a previous version:

1. Update your configuration to use the new schema
2. Test with the `development` template first
3. Migrate to appropriate production template
4. Validate configuration using the built-in validator

### Configuration Changes

- Virtual series configuration moved to nested `virtualSeries` object
- Toolbar configuration consolidated under `toolbar` object
- New accessibility options in `colorSystem.accessibility`

## Examples

### Minimal Configuration

```javascript
{
  enableVirtualSeries: false,
  enableGlobalPatientHeader: true,
  enableStudyComparison: false,
  enableEnhancedToolbar: true,
  enablePRDColorSystem: true
}
```

### Research Configuration

```javascript
{
  enableVirtualSeries: true,
  virtualSeries: {
    performance: {
      chunkSize: 100,
      preloadThreshold: 20
    }
  },
  colorSystem: {
    theme: 'dark',
    accessibility: {
      highContrastMode: true
    }
  },
  patientHeader: {
    customFields: [
      'AccessionNumber',
      'StudyDescription',
      'InstitutionName',
      'Modality'
    ]
  }
}
```

## Support

For configuration assistance:

1. Check the validation output for specific errors
2. Review template configurations for examples
3. Consult the schema documentation for available options
4. Test changes in development environment first 