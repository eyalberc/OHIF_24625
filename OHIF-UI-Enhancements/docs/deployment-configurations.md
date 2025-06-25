# Enhanced OHIF v3 Deployment Configuration Examples

## Overview

This document provides comprehensive deployment configuration examples for the Enhanced OHIF v3 system across various deployment scenarios and environments.

## Environment Variables

### Core Environment Variables

Create a `.env` file in your project root:

```bash
# API Keys
ANTHROPIC_API_KEY=your_anthropic_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
OPENAI_API_KEY=your_openai_key_here

# DICOM Web Configuration
DICOM_WEB_ROOT_URL=https://your-pacs-server.com/dicomweb
DICOM_WEB_QIDO_ROOT=https://your-pacs-server.com/dicomweb
DICOM_WEB_WADO_ROOT=https://your-pacs-server.com/dicomweb

# Enhanced Features Configuration
UI_ENHANCEMENTS_ENABLED=true
VIRTUAL_SERIES_ENABLED=true
STUDY_COMPARISON_ENABLED=true
ENHANCED_TOOLBAR_ENABLED=true
PATIENT_HEADER_ENABLED=true
HANGING_PROTOCOL_EDITOR_ENABLED=true

# Performance Configuration
VIRTUAL_SERIES_CHUNK_SIZE=50
VIRTUAL_SERIES_PRELOAD_THRESHOLD=10
MAX_CONCURRENT_REQUESTS=6
MEMORY_LIMIT_MB=2048
```

## Deployment Configurations

### 1. Standard Clinical Deployment

**Use Case**: Primary clinical imaging workstation in hospital environment
**Features**: All enhanced features enabled with clinical optimizations

#### App Configuration (`app-config.js`)

```javascript
import { id } from '@ohif/extension-ui-enhancements';

const appConfig = {
  routerBasename: '/',
  extensions: [
    '@ohif/extension-default',
    '@ohif/extension-cornerstone',
    '@ohif/extension-measurement-tracking',
    '@ohif/extension-ui-enhancements'
  ],
  
  modes: [
    '@ohif/mode-longitudinal',
    '@ohif/mode-basic-dev-mode'
  ],

  // Enhanced UI-Enhancements Extension Configuration
  [id]: {
    virtualSeries: {
      enabled: true,
      chunkSize: 50,
      preloadThreshold: 10,
      maxConcurrentRequests: 6
    },
    toolbar: {
      enabled: true,
      modalitySpecific: true,
      groupSeparators: true,
      showLabels: true
    },
    studyComparison: {
      enabled: true,
      highlightingStyle: 'border',
      colors: {
        current: '#4ade80',
        prior: '#60a5fa'
      }
    },
    patientHeader: {
      enabled: true,
      height: 60,
      demographics: ['name', 'id', 'birthDate', 'sex']
    },
    hangingProtocolEditor: {
      enabled: true,
      allowCustomProtocols: true,
      templateLibrary: true
    }
  },

  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'Clinical PACS',
        name: 'DCM4CHEE',
        wadoUriRoot: process.env.DICOM_WEB_WADO_ROOT,
        qidoRoot: process.env.DICOM_WEB_QIDO_ROOT,
        wadoRoot: process.env.DICOM_WEB_WADO_ROOT
      }
    }
  ]
};

export default appConfig;
```

#### Docker Configuration (`docker-compose.clinical.yml`)

```yaml
version: '3.8'

services:
  ohif-enhanced:
    build:
      context: .
      dockerfile: Dockerfile.production
    container_name: ohif-enhanced-clinical
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
      - DICOM_WEB_ROOT_URL=${DICOM_WEB_ROOT_URL}
      - UI_ENHANCEMENTS_ENABLED=true
    volumes:
      - ./configs/clinical.env:/app/.env:ro
      - ./configs/clinical-app-config.js:/app/public/config/app-config.js:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 2. Research Environment Deployment

**Use Case**: Research institution with advanced features
**Features**: All features enabled with research-specific optimizations

#### App Configuration (`app-config.research.js`)

```javascript
import { id } from '@ohif/extension-ui-enhancements';

const appConfig = {
  routerBasename: '/research/',
  
  [id]: {
    virtualSeries: {
      enabled: true,
      chunkSize: 100, // Larger chunks for research workstations
      preloadThreshold: 20,
      maxConcurrentRequests: 10
    },
    toolbar: {
      enabled: true,
      modalitySpecific: true,
      researchMode: true,
      advancedTools: [
        'volumeRendering',
        'aiAnalysis',
        'customMeasurements'
      ]
    },
    studyComparison: {
      enabled: true,
      highlightingStyle: 'glow',
      enableAdvancedComparison: true
    },
    analytics: {
      enabled: true,
      trackUserInteractions: true,
      performanceMetrics: true
    }
  }
};

export default appConfig;
```

### 3. Emergency/Trauma Deployment

**Use Case**: Emergency department with rapid access requirements
**Features**: Performance-optimized with critical workflow enhancements

#### App Configuration (`app-config.emergency.js`)

```javascript
import { id } from '@ohif/extension-ui-enhancements';

const appConfig = {
  routerBasename: '/emergency/',
  
  [id]: {
    virtualSeries: {
      enabled: true,
      chunkSize: 75,
      preloadThreshold: 15,
      fastMode: true,
      priorityLoading: true
    },
    toolbar: {
      enabled: true,
      modalitySpecific: true,
      emergencyMode: true,
      quickActions: [
        'windowLevel',
        'zoom',
        'pan',
        'measurement'
      ]
    },
    studyComparison: {
      enabled: true,
      highlightingStyle: 'urgent',
      autoComparison: true
    },
    patientHeader: {
      enabled: true,
      height: 50, // Compact for more viewing space
      emergencyLayout: true
    }
  }
};

export default appConfig;
```

## Container Orchestration

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ohif-enhanced
  namespace: medical-imaging
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ohif-enhanced
  template:
    metadata:
      labels:
        app: ohif-enhanced
    spec:
      containers:
      - name: ohif-enhanced
        image: your-registry/ohif-enhanced:latest
        ports:
        - containerPort: 80
        env:
        - name: NODE_ENV
          value: "production"
        - name: UI_ENHANCEMENTS_ENABLED
          value: "true"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

## Performance Optimization Configurations

### High-Performance Configuration

```javascript
const performanceConfig = {
  virtualSeries: {
    chunkSize: 200,
    preloadThreshold: 50,
    maxConcurrentRequests: 12,
    useWebWorkers: true
  },
  rendering: {
    enableWebGL2: true,
    useOffscreenCanvas: true,
    maxTextureSize: 4096
  },
  caching: {
    maxCacheSize: 1024, // MB
    enablePersistentCache: true
  }
};
```

### Memory-Optimized Configuration

```javascript
const memoryOptimizedConfig = {
  virtualSeries: {
    chunkSize: 25,
    preloadThreshold: 5,
    aggressiveCleanup: true
  },
  rendering: {
    enableTextureCaching: false,
    reduceQuality: true
  },
  caching: {
    maxCacheSize: 256, // MB
    evictionPolicy: 'aggressive-lru'
  }
};
```

## Security Configuration

### Content Security Policy

```javascript
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'blob:'],
    connectSrc: ["'self'", 'https://your-pacs.com']
  }
};
```

## Monitoring Configuration

```javascript
const monitoringConfig = {
  performance: {
    enabled: true,
    metrics: [
      'component-render-time',
      'service-response-time',
      'memory-usage'
    ]
  },
  errorTracking: {
    enabled: true,
    provider: 'sentry'
  }
};
```

## Next Steps

1. Choose the appropriate configuration template for your deployment scenario
2. Customize environment variables and configuration parameters  
3. Test the configuration in a staging environment
4. Deploy to production with monitoring enabled
5. Monitor performance and adjust configuration as needed 