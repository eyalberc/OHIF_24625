# Enhanced OHIF v3 Deployment Configuration Examples

## Overview

This document provides comprehensive deployment configuration examples for the Enhanced OHIF v3 system across various deployment scenarios and environments. Each configuration is designed to optimize the enhanced features for specific use cases.

## Environment Variables

### Core Environment Variables

Create a `.env` file in your project root:

```bash
# API Keys
ANTHROPIC_API_KEY=your_anthropic_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_key_here

# DICOM Web Configuration
DICOM_WEB_ROOT_URL=https://your-pacs-server.com/dicomweb
DICOM_WEB_QIDO_ROOT=https://your-pacs-server.com/dicomweb
DICOM_WEB_WADO_ROOT=https://your-pacs-server.com/dicomweb
DICOM_WEB_STOW_ROOT=https://your-pacs-server.com/dicomweb

# Authentication (if required)
OIDC_CLIENT_ID=your_oidc_client_id
OIDC_AUTHORITY=https://your-auth-server.com
OIDC_REDIRECT_URI=https://your-ohif-domain.com/auth-callback

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

# Logging and Monitoring
LOG_LEVEL=info
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_ERROR_TRACKING=true
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
    '@ohif/extension-cornerstone-dicom-sr',
    '@ohif/extension-cornerstone-dicom-seg',
    '@ohif/extension-cornerstone-dicom-rt',
    '@ohif/extension-ui-enhancements'
  ],
  
  modes: [
    '@ohif/mode-longitudinal',
    '@ohif/mode-basic-dev-mode'
  ],

  customizationService: {
    globalPatientHeader: {
      component: 'GlobalPatientHeader',
      props: {
        height: 60,
        demographics: ['name', 'id', 'birthDate', 'sex', 'accessionNumber'],
        customFields: ['studyDate', 'modality', 'bodyPartExamined'],
        showAvatar: true,
        enableSearch: true
      }
    },
    colorSystem: {
      theme: 'prd-clinical',
      accessibility: true,
      highContrast: false,
      customColors: {
        primary: '#2563eb',
        success: '#059669',
        warning: '#d97706',
        danger: '#dc2626'
      }
    }
  },

  // Enhanced UI-Enhancements Extension Configuration
  [id]: {
    virtualSeries: {
      enabled: true,
      chunkSize: 50,
      preloadThreshold: 10,
      maxConcurrentRequests: 6,
      memoryManagement: {
        maxCacheSize: 512, // MB
        evictionPolicy: 'lru'
      }
    },
    toolbar: {
      enabled: true,
      modalitySpecific: true,
      groupSeparators: true,
      showLabels: true,
      customActions: [
        {
          id: 'exportStudy',
          label: 'Export Study',
          icon: 'download',
          command: 'exportStudy'
        }
      ]
    },
    studyComparison: {
      enabled: true,
      highlightingStyle: 'border',
      colors: {
        current: '#4ade80',
        prior: '#60a5fa'
      },
      autoDetectPriorStudies: true,
      showComparisonIndicators: true
    },
    patientHeader: {
      enabled: true,
      height: 60,
      demographics: ['name', 'id', 'birthDate', 'sex'],
      customFields: ['accessionNumber', 'studyDate'],
      responsive: true
    },
    hangingProtocolEditor: {
      enabled: true,
      allowCustomProtocols: true,
      templateLibrary: true,
      realTimePreview: true
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
        wadoRoot: process.env.DICOM_WEB_WADO_ROOT,
        qidoSupportsIncludeField: true,
        supportsReject: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true
      }
    }
  ],

  httpErrorHandler: (error, request, response) => {
    console.error('HTTP Error:', error);
    // Enhanced error handling for UI components
    if (error.status === 401) {
      // Redirect to authentication
      window.location.href = '/auth';
    }
  },

  hotkeys: [
    {
      commandName: 'toggleVirtualSeriesMode',
      label: 'Toggle Virtual Series',
      keys: ['v']
    },
    {
      commandName: 'showGlobalPatientHeader',
      label: 'Toggle Patient Header',
      keys: ['h']
    },
    {
      commandName: 'highlightCurrentStudy',
      label: 'Highlight Current Study',
      keys: ['ctrl+h']
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
      args:
        APP_CONFIG: clinical
    container_name: ohif-enhanced-clinical
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
      - DICOM_WEB_ROOT_URL=${DICOM_WEB_ROOT_URL}
      - UI_ENHANCEMENTS_ENABLED=true
      - LOG_LEVEL=info
      - MEMORY_LIMIT_MB=2048
    volumes:
      - ./configs/clinical.env:/app/.env:ro
      - ./configs/clinical-app-config.js:/app/public/config/app-config.js:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - clinical-network
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
        reservations:
          memory: 2G
          cpus: '1.0'

  nginx-proxy:
    image: nginx:alpine
    container_name: nginx-clinical-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/clinical.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - ohif-enhanced
    networks:
      - clinical-network

networks:
  clinical-network:
    driver: bridge
```

### 2. Research Environment Deployment

**Use Case**: Research institution with advanced features and experimental tools
**Features**: All features enabled with research-specific optimizations

#### App Configuration (`app-config.research.js`)

```javascript
import { id } from '@ohif/extension-ui-enhancements';

const appConfig = {
  routerBasename: '/research/',
  extensions: [
    '@ohif/extension-default',
    '@ohif/extension-cornerstone',
    '@ohif/extension-measurement-tracking',
    '@ohif/extension-cornerstone-dicom-sr',
    '@ohif/extension-cornerstone-dicom-seg',
    '@ohif/extension-cornerstone-dicom-rt',
    '@ohif/extension-ui-enhancements',
    '@ohif/extension-dicom-microscopy' // Additional research extensions
  ],

  [id]: {
    virtualSeries: {
      enabled: true,
      chunkSize: 100, // Larger chunks for research workstations
      preloadThreshold: 20,
      maxConcurrentRequests: 10,
      advancedFeatures: {
        enableExperimentalAlgorithms: true,
        enablePerformanceAnalytics: true
      }
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
      enableAdvancedComparison: true,
      multiModalityComparison: true
    },
    hangingProtocolEditor: {
      enabled: true,
      allowCustomProtocols: true,
      enableScripting: true,
      researchTemplates: true
    },
    analytics: {
      enabled: true,
      trackUserInteractions: true,
      performanceMetrics: true,
      usageStatistics: true
    }
  },

  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'research-pacs',
      configuration: {
        friendlyName: 'Research PACS',
        wadoUriRoot: process.env.RESEARCH_DICOM_WEB_ROOT,
        qidoRoot: process.env.RESEARCH_DICOM_QIDO_ROOT,
        wadoRoot: process.env.RESEARCH_DICOM_WADO_ROOT,
        enableStudyLazyLoad: false, // Preload for research
        supportsInstanceMetadata: true,
        enableBulkDataURI: true
      }
    }
  ]
};

export default appConfig;
```

### 3. Teaching/Educational Deployment

**Use Case**: Medical education institution with teaching-focused features
**Features**: Educational optimizations with reduced complexity

#### App Configuration (`app-config.education.js`)

```javascript
import { id } from '@ohif/extension-ui-enhancements';

const appConfig = {
  routerBasename: '/education/',
  
  [id]: {
    virtualSeries: {
      enabled: true,
      chunkSize: 25, // Smaller chunks for teaching scenarios
      preloadThreshold: 5,
      educationMode: true
    },
    toolbar: {
      enabled: true,
      modalitySpecific: false, // Simplified for education
      educationMode: true,
      hiddenTools: ['advancedMeasurements', 'aiTools'], // Hide complex tools
      helpTooltips: true
    },
    studyComparison: {
      enabled: true,
      highlightingStyle: 'subtle',
      showEducationalIndicators: true
    },
    patientHeader: {
      enabled: true,
      educationMode: true,
      anonymizeData: true, // Protect patient privacy in education
      showOnlyBasicInfo: true
    },
    hangingProtocolEditor: {
      enabled: false, // Disabled for student environments
      templateLibrary: true,
      readOnlyMode: true
    }
  },

  userPreferencesManager: {
    windowLevelPresets: [
      {
        name: 'Soft Tissue',
        window: 400,
        level: 40
      },
      {
        name: 'Lung',
        window: 1500,
        level: -600
      },
      {
        name: 'Bone',
        window: 1000,
        level: 400
      }
    ]
  }
};

export default appConfig;
```

### 4. Emergency/Trauma Deployment

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
      chunkSize: 75, // Optimized for quick loading
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
      ],
      hideNonEssentialTools: true
    },
    studyComparison: {
      enabled: true,
      highlightingStyle: 'urgent',
      autoComparison: true,
      emergencyIndicators: true
    },
    patientHeader: {
      enabled: true,
      height: 50, // Compact for more viewing space
      emergencyLayout: true,
      showCriticalInfo: ['name', 'id', 'age', 'trauma_code']
    },
    performance: {
      fastRender: true,
      reducedAnimations: true,
      prioritizeSpeed: true
    }
  },

  hotkeys: [
    {
      commandName: 'toggleVirtualSeriesMode',
      label: 'Quick Series Navigation',
      keys: ['space']
    },
    {
      commandName: 'emergencyMeasurement',
      label: 'Quick Measurement',
      keys: ['m']
    }
  ]
};

export default appConfig;
```

## Nginx Configuration Examples

### Standard Clinical Nginx Configuration

```nginx
# /etc/nginx/sites-available/ohif-clinical
server {
    listen 80;
    listen [::]:80;
    server_name your-clinical-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-clinical-domain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/clinical.crt;
    ssl_certificate_key /etc/nginx/ssl/clinical.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # OHIF Specific Headers
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Root Directory
    root /var/www/ohif-clinical;
    index index.html;

    # Main Application
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Proxy to PACS
    location /dicomweb/ {
        proxy_pass http://your-pacs-server.com/dicomweb/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # DICOM Web specific settings
        proxy_buffering off;
        proxy_request_buffering off;
        client_max_body_size 100M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health Check Endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

## Container Orchestration

### Kubernetes Deployment

```yaml
# kubernetes/ohif-enhanced-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ohif-enhanced
  namespace: medical-imaging
  labels:
    app: ohif-enhanced
    tier: frontend
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
        - name: DICOM_WEB_ROOT_URL
          valueFrom:
            configMapKeyRef:
              name: ohif-config
              key: dicom-web-root
        - name: UI_ENHANCEMENTS_ENABLED
          value: "true"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: config-volume
          mountPath: /app/public/config
          readOnly: true
      volumes:
      - name: config-volume
        configMap:
          name: ohif-app-config
---
apiVersion: v1
kind: Service
metadata:
  name: ohif-enhanced-service
  namespace: medical-imaging
spec:
  selector:
    app: ohif-enhanced
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ohif-enhanced-ingress
  namespace: medical-imaging
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - ohif.your-domain.com
    secretName: ohif-tls
  rules:
  - host: ohif.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ohif-enhanced-service
            port:
              number: 80
```

### ConfigMap for Kubernetes

```yaml
# kubernetes/ohif-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ohif-app-config
  namespace: medical-imaging
data:
  app-config.js: |
    window.config = {
      routerBasename: '/',
      extensions: [
        '@ohif/extension-default',
        '@ohif/extension-cornerstone',
        '@ohif/extension-measurement-tracking',
        '@ohif/extension-ui-enhancements'
      ],
      modes: [
        '@ohif/mode-longitudinal'
      ],
      showStudyList: true,
      dataSources: [
        {
          namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
          sourceName: 'dicomweb',
          configuration: {
            friendlyName: 'Clinical PACS',
            name: 'DCM4CHEE',
            wadoUriRoot: 'https://your-pacs.com/dicomweb',
            qidoRoot: 'https://your-pacs.com/dicomweb',
            wadoRoot: 'https://your-pacs.com/dicomweb'
          }
        }
      ]
    };
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: ohif-config
  namespace: medical-imaging
data:
  dicom-web-root: "https://your-pacs.com/dicomweb"
  log-level: "info"
  memory-limit: "2048"
```

## Performance Optimization Configurations

### High-Performance Configuration

```javascript
// For high-performance workstations
const performanceConfig = {
  virtualSeries: {
    chunkSize: 200,
    preloadThreshold: 50,
    maxConcurrentRequests: 12,
    useWebWorkers: true,
    enableGPUAcceleration: true
  },
  rendering: {
    enableWebGL2: true,
    useOffscreenCanvas: true,
    maxTextureSize: 4096,
    enableParallelRendering: true
  },
  caching: {
    maxCacheSize: 1024, // MB
    enablePersistentCache: true,
    compressionLevel: 6
  }
};
```

### Memory-Optimized Configuration

```javascript
// For memory-constrained environments
const memoryOptimizedConfig = {
  virtualSeries: {
    chunkSize: 25,
    preloadThreshold: 5,
    aggressiveCleanup: true,
    memoryThreshold: 512 // MB
  },
  rendering: {
    enableTextureCaching: false,
    reduceQuality: true,
    maxConcurrentRenders: 2
  },
  caching: {
    maxCacheSize: 256, // MB
    evictionPolicy: 'aggressive-lru'
  }
};
```

## Monitoring and Logging Configuration

### Application Monitoring

```javascript
// monitoring-config.js
const monitoringConfig = {
  performance: {
    enabled: true,
    sampleRate: 0.1,
    metrics: [
      'component-render-time',
      'service-response-time',
      'memory-usage',
      'network-requests'
    ]
  },
  errorTracking: {
    enabled: true,
    provider: 'sentry',
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV
  },
  analytics: {
    enabled: true,
    provider: 'google-analytics',
    trackingId: process.env.GA_TRACKING_ID,
    anonymizeIP: true
  }
};
```

### Log4js Configuration

```javascript
// log4js.config.js
module.exports = {
  appenders: {
    out: { type: 'stdout' },
    app: {
      type: 'file',
      filename: '/var/log/ohif/application.log',
      maxLogSize: 10485760,
      backups: 5,
      compress: true
    },
    performance: {
      type: 'file',
      filename: '/var/log/ohif/performance.log',
      maxLogSize: 10485760,
      backups: 3
    }
  },
  categories: {
    default: { appenders: ['out', 'app'], level: 'info' },
    performance: { appenders: ['performance'], level: 'debug' }
  }
};
```

## Security Configuration

### Content Security Policy

```javascript
// CSP Configuration for enhanced security
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://trusted-cdn.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
    connectSrc: ["'self'", 'https://your-pacs.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"]
  }
};
```

## Backup and Recovery Configuration

### Automated Backup Script

```bash
#!/bin/bash
# backup-ohif-config.sh

# Configuration backup script
BACKUP_DIR="/backup/ohif-configs"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="ohif-config-${DATE}.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup configuration files
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
  /app/public/config/ \
  /etc/nginx/sites-available/ohif* \
  /docker-compose*.yml \
  .env

# Keep only last 30 backups
find $BACKUP_DIR -name "ohif-config-*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

## Troubleshooting Configuration

### Debug Configuration

```javascript
// debug-config.js
const debugConfig = {
  logging: {
    level: 'debug',
    enableConsoleOutput: true,
    enableFileOutput: true,
    components: [
      'VirtualSeriesManager',
      'ToolbarIntegrationService',
      'StudyComparisonService',
      'HangingProtocolService'
    ]
  },
  performance: {
    enableProfiling: true,
    enableMemoryTracking: true,
    enableNetworkLogging: true
  },
  development: {
    enableHotReload: true,
    enableSourceMaps: true,
    enableReactDevTools: true
  }
};
```

## Next Steps

1. Choose the appropriate configuration template for your deployment scenario
2. Customize environment variables and configuration parameters
3. Test the configuration in a staging environment
4. Deploy to production with monitoring enabled
5. Monitor performance and adjust configuration as needed

These configuration examples provide a solid foundation for deploying the Enhanced OHIF v3 system across various environments and use cases. 