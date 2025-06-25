# Migration Guide: Standard OHIF to Enhanced OHIF v3

## Overview

This guide provides step-by-step instructions for migrating from standard OHIF v3 to the Enhanced OHIF v3 system. The enhanced version includes significant UI/UX improvements while maintaining full backward compatibility.

### What's New

- **Global Patient Header**: Persistent patient information display
- **Enhanced Toolbar**: Modality-specific tools and improved organization
- **Virtual Series "Scroll All"**: Synchronized scrolling across multiple series
- **Study Comparison Highlighting**: Visual indicators for current vs. prior studies
- **Hanging Protocol Editor**: Visual editor for creating custom protocols
- **PRD Color System**: Enhanced color scheme for better accessibility

### Migration Types

**In-Place Migration**: Upgrade existing installation
- Faster deployment
- Preserves existing configuration
- Minimal downtime
- Recommended for most installations

**Side-by-Side Migration**: Install alongside existing system
- Zero downtime during testing
- Easy rollback
- Gradual user migration
- Recommended for critical production systems

## Pre-Migration Planning

### System Requirements

**Minimum Requirements**:
- Node.js 18.0 or higher
- Memory: 4GB RAM minimum, 8GB recommended
- Storage: Additional 2GB for enhanced features
- Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

### Backup Procedures

#### Critical Backup Items

```bash
# Backup configuration files
mkdir -p ./backup/$(date +%Y%m%d_%H%M%S)
cp -r platform/app/public/config/ ./backup/$(date +%Y%m%d_%H%M%S)/config/
cp docker-compose*.yml ./backup/$(date +%Y%m%d_%H%M%S)/
cp .env ./backup/$(date +%Y%m%d_%H%M%S)/
```

#### Docker Images Backup
```bash
# Save current Docker images
docker save ohif-viewer:current > ./backup/$(date +%Y%m%d_%H%M%S)/ohif-current.tar
```

## Migration Procedures

### Method 1: In-Place Migration

#### Step 1: Prepare Environment
```bash
# Stop current services
docker-compose down

# Backup current installation
./scripts/backup-system.sh

# Verify Node.js version
node --version  # Should be 18.0+
```

#### Step 2: Update Codebase
```bash
# Pull enhanced OHIF code
git clone https://github.com/your-org/OHIF-UI-Enhancements.git ohif-enhanced
cd ohif-enhanced

# Install dependencies
yarn install

# Build enhanced version
yarn build
```

#### Step 3: Update Configuration
```bash
# Add enhanced extension to app-config.js
extensions: [
    '@ohif/extension-default',
    '@ohif/extension-cornerstone',
    '@ohif/extension-measurement-tracking',
    '@ohif/extension-ui-enhancements'  // Add this line
]
```

#### Step 4: Update Environment Variables
```bash
# Add enhanced features environment variables
cat >> .env << EOF
# Enhanced OHIF Features
UI_ENHANCEMENTS_ENABLED=true
VIRTUAL_SERIES_ENABLED=true
STUDY_COMPARISON_ENABLED=true
ENHANCED_TOOLBAR_ENABLED=true
PATIENT_HEADER_ENABLED=true
HANGING_PROTOCOL_EDITOR_ENABLED=true

# Performance Settings
VIRTUAL_SERIES_CHUNK_SIZE=50
VIRTUAL_SERIES_PRELOAD_THRESHOLD=10
MAX_CONCURRENT_REQUESTS=6
MEMORY_LIMIT_MB=2048
EOF
```

#### Step 5: Deploy Enhanced Version
```bash
# Build and start enhanced version
docker-compose build
docker-compose up -d

# Verify deployment
curl -f http://localhost:3000/health
```

### Method 2: Side-by-Side Migration

#### Step 1: Parallel Deployment
```bash
# Clone enhanced OHIF to separate directory
git clone https://github.com/your-org/OHIF-UI-Enhancements.git ohif-enhanced
cd ohif-enhanced

# Configure for parallel deployment
sed -i 's/3000:80/3001:80/' docker-compose.yml
sed -i 's/ohif-standard/ohif-enhanced/' docker-compose.yml
```

#### Step 2: Load Balancer Configuration
```nginx
upstream ohif-standard {
    server localhost:3000;
}

upstream ohif-enhanced {
    server localhost:3001;
}

server {
    listen 80;
    server_name your-ohif-domain.com;

    location / {
        # Default to standard version
        proxy_pass http://ohif-standard;
        
        # Enhanced version for testing
        if ($arg_enhanced = "1") {
            proxy_pass http://ohif-enhanced;
        }
    }
    
    # Enhanced version endpoint for testing
    location /enhanced/ {
        proxy_pass http://ohif-enhanced/;
    }
}
```

## Configuration Migration

### Enhanced Features Configuration

Add to your app-config.js:

```javascript
// Enhanced UI-Enhancements Extension Configuration
'@ohif/extension-ui-enhancements': {
    virtualSeries: {
        enabled: true,
        chunkSize: 50,
        preloadThreshold: 10,
        maxConcurrentRequests: 6
    },
    toolbar: {
        enabled: true,
        modalitySpecific: true,
        groupSeparators: true
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
        allowCustomProtocols: true
    }
}
```

## Testing and Validation

### Pre-Migration Testing

```bash
# Test environment setup
docker-compose -f docker-compose.test.yml up -d

# Load test data
curl -X POST http://localhost:3001/api/test-data/load \
  -H "Content-Type: application/json" \
  -d '{"dataset": "sample-studies"}'
```

### Post-Migration Validation

```bash
# Application health check
curl -f http://localhost:3000/health

# Enhanced features check
curl -f http://localhost:3000/api/features

# DICOM connectivity test
curl -f http://localhost:3000/api/dicomweb/studies?limit=1
```

## Rollback Procedures

### Emergency Rollback

```bash
#!/bin/bash
# emergency-rollback.sh

echo "EMERGENCY ROLLBACK INITIATED"

# Stop current services
docker-compose down

# Restore previous Docker images
docker load < backup/ohif-previous.tar

# Restore configuration
cp backup/config/* platform/app/public/config/

# Restart with previous version
docker-compose -f docker-compose.rollback.yml up -d

echo "Emergency rollback completed"
```

## Breaking Changes

### Configuration Changes

**Required**: Enhanced extension must be added to configuration
```javascript
// Add to extensions array
'@ohif/extension-ui-enhancements'
```

### Environment Variables

**New Required Variables**:
- `UI_ENHANCEMENTS_ENABLED=true`
- `VIRTUAL_SERIES_ENABLED=true`
- Performance tuning variables

### System Requirements

**Increased Requirements**:
- Memory: 4GB minimum (was 2GB)
- Browser: Higher minimum versions
- Network: Additional bandwidth for enhanced features

## Post-Migration Tasks

### User Training

1. **Basic Introduction** (30 minutes)
   - Enhanced features overview
   - New interface elements

2. **Advanced Features** (45 minutes)
   - Virtual Series usage
   - Hanging Protocol Editor
   - Study Comparison workflows

3. **Hands-on Practice** (60 minutes)
   - Guided exercises
   - Common scenarios

### Performance Monitoring

Monitor key metrics:
- Application load times
- Virtual series performance
- Memory usage
- User feature adoption

### Documentation Updates

- Update user guides
- Create troubleshooting documentation
- Update training materials

## Troubleshooting

### Common Issues

#### Enhanced Extension Not Loading
**Solution**: Verify extension registration in app-config.js

#### Virtual Series Performance Issues
**Solutions**:
- Reduce chunk size: `VIRTUAL_SERIES_CHUNK_SIZE=25`
- Increase memory: Add more RAM
- Check network stability

#### Study Comparison Not Working
**Solutions**:
- Verify patient ID matching
- Check DICOM metadata completeness
- Enable feature in settings

#### Configuration Migration Failed
**Solutions**:
- Validate configuration syntax
- Use configuration merger script
- Rollback and retry

### Performance Optimization

```javascript
// Memory-optimized configuration
const memoryOptimizedConfig = {
  virtualSeries: {
    chunkSize: 25,
    aggressiveCleanup: true,
    memoryThreshold: 512 // MB
  },
  caching: {
    maxCacheSize: 256, // MB
    evictionPolicy: 'aggressive-lru'
  }
};
```

### Getting Help

**Support Escalation Path**:
1. **Level 1**: Local IT Support
2. **Level 2**: System Administrator  
3. **Level 3**: Development Team

**Diagnostic Information Collection**:
```bash
# Collect system information
uname -a > diagnostic-info.txt
docker --version >> diagnostic-info.txt
docker-compose logs --tail=100 >> diagnostic-info.txt
```

## Conclusion

This migration guide provides the essential steps for transitioning to Enhanced OHIF v3. The enhanced version offers significant improvements while maintaining compatibility with existing systems.

### Key Success Factors

1. **Thorough Planning**: Complete assessment and preparation
2. **Proper Testing**: Comprehensive testing in isolated environment
3. **Gradual Rollout**: Consider side-by-side migration for critical systems
4. **User Training**: Ensure users understand new features
5. **Monitoring**: Continuous performance monitoring

For additional support, contact your system administrator or development team.
