# Enhanced OHIF v3 Architecture Documentation

## Overview

The Enhanced OHIF v3 system builds upon the standard OHIF v3 architecture with advanced UI/UX enhancements designed to improve clinical workflows and user experience. This document provides comprehensive architectural details for deployment and maintenance.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Enhanced OHIF v3 System                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ Global Patient  │  │ Enhanced        │  │ Study           │     │
│  │ Header          │  │ Toolbar         │  │ Comparison      │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ Virtual Series  │  │ Hanging         │  │ PRD Color       │     │
│  │ "Scroll All"    │  │ Protocol Editor │  │ System          │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
├─────────────────────────────────────────────────────────────────────┤
│                    OHIF v3 Core Platform                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ Extension       │  │ Service         │  │ Viewport        │     │
│  │ Manager         │  │ Manager         │  │ Grid Service    │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
├─────────────────────────────────────────────────────────────────────┤
│                     Data Layer & Services                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ DICOM Data      │  │ Hanging         │  │ Custom Theme    │     │
│  │ Sources         │  │ Protocols       │  │ Service         │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. UI-Enhancements Extension (`@ohif/extension-ui-enhancements`)

**Location**: `extensions/ui-enhancements/`
**Purpose**: Central extension providing all enhanced UI/UX features
**Registration Priority**: 100 (Highest - overrides default components)

**Key Modules**:
- **Toolbar Module**: Enhanced toolbar with modality-specific tools
- **Customization Module**: PRD color system and theme customizations  
- **Data Sources Module**: Virtual series data source with "Scroll All" functionality
- **Commands Module**: Extension-specific commands for feature control
- **Panels Module**: UI panels for hanging protocol editor
- **Utility Module**: Shared utilities and services

### 2. Enhanced Components

#### Global Patient Header Component
- **File**: `extensions/ui-enhancements/src/components/GlobalPatientHeader.tsx`
- **Purpose**: Persistent patient information display across all viewports
- **Integration**: Registers with CustomizationService as `globalPatientHeader`
- **Features**: Demographics display, custom DICOM fields, responsive design

#### Study-Aware Viewport Wrapper  
- **File**: `extensions/ui-enhancements/src/components/StudyAwareViewport.tsx`
- **Purpose**: Viewport wrapper providing study comparison highlighting
- **Integration**: Wraps standard viewports via ViewportGridService
- **Features**: Current/prior study highlighting, temporal comparison

#### Enhanced Toolbar Service
- **File**: `extensions/ui-enhancements/src/services/ToolbarIntegrationService.js`
- **Purpose**: Manages enhanced toolbar functionality
- **Integration**: Extends ToolbarService with modality-specific tools
- **Features**: Dynamic tool groups, modality detection, custom actions

#### Hanging Protocol Editor
- **File**: `extensions/ui-enhancements/src/components/HangingProtocolEditor.tsx`
- **Purpose**: Visual editor for hanging protocol creation and modification
- **Integration**: Registers as UI panel component
- **Features**: Visual protocol builder, real-time preview, template management

## Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ DICOM Web       │───▶│ Enhanced Data   │───▶│ Virtual Series  │
│ Services        │    │ Sources         │    │ Manager         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Study Metadata  │───▶│ Hanging         │───▶│ Viewport Grid   │
│ Store           │    │ Protocol        │    │ Service         │
│                 │    │ Service         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Enhanced UI     │───▶│ Study           │───▶│ Enhanced        │
│ Components      │    │ Comparison      │    │ Rendering       │
│                 │    │ Service         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Service Integration Points

### ViewportGridService Integration
- **Enhanced Viewport Management**: Study-aware viewport creation
- **Virtual Series Support**: Specialized viewport handling for virtual series  
- **Study Comparison**: Viewport highlighting based on study relationships

### CustomizationService Integration
- **Theme System**: PRD color palette integration
- **Component Registration**: Enhanced component registration with priority
- **Layout Customization**: Responsive layout configurations

### ToolbarService Integration
- **Enhanced Toolbar Buttons**: Modality-specific tool registration
- **Tool State Management**: Enhanced tool activation/deactivation
- **Custom Tool Groups**: Dynamic tool grouping based on context

## Extension Lifecycle

### 1. Pre-Registration Phase
```javascript
preRegistration({ servicesManager, appConfig, commandsManager }) {
  // Initialize core services
  // Set up conflict resolution  
  // Configure feature flags
}
```

### 2. Mode Entry Phase
```javascript
onModeEnter({ servicesManager, extensionManager }) {
  // Initialize enhanced components
  // Set up service integrations
  // Apply theme customizations
}
```

### 3. Mode Exit Phase
```javascript
onModeExit() {
  // Clean up resources
  // Reset service states
  // Remove event listeners
}
```

## Configuration Architecture

### Extension Configuration Schema
```javascript
{
  virtualSeries: {
    enabled: true,
    chunkSize: 50,
    preloadThreshold: 10
  },
  toolbar: {
    enabled: true, 
    modalitySpecific: true,
    customActions: []
  },
  colorSystem: {
    enabled: true,
    theme: 'prd-clinical',
    accessibility: true
  },
  studyComparison: {
    enabled: true,
    highlightingStyle: 'border',
    colors: { current: '#4ade80', prior: '#60a5fa' }
  },
  patientHeader: {
    enabled: true,
    height: 60,
    demographics: ['name', 'id', 'birthDate', 'sex']
  }
}
```

### Environment-Specific Configurations
- **Production**: Optimized performance, minimal logging
- **Development**: Enhanced debugging, verbose logging
- **Clinical**: Clinical workflow optimizations
- **Research**: Advanced features enabled

## Performance Architecture

### Memory Management
- **Component Lifecycle**: Proper cleanup on mode transitions
- **Event Listener Management**: Automatic cleanup prevention of memory leaks
- **Cache Management**: Intelligent caching for virtual series

### Performance Optimizations
- **Lazy Loading**: Components loaded on demand
- **Virtual Scrolling**: Efficient handling of large series
- **Debounced Updates**: UI updates optimized for performance
- **Resource Pooling**: Efficient resource reuse

## Deployment Architecture

### Build Process
1. **Extension Building**: Webpack compilation of enhanced components
2. **Asset Optimization**: CSS/JS minification and bundling
3. **Package Generation**: NPM package creation with proper exports
4. **Integration Testing**: Automated testing of extension integration

### Runtime Integration
1. **Extension Discovery**: Automatic extension detection and loading
2. **Service Registration**: Enhanced service registration with conflict resolution
3. **Component Mounting**: Dynamic component registration and mounting
4. **Configuration Application**: Runtime configuration application

## Compatibility Matrix

### OHIF Version Compatibility
- **OHIF v3.8.0+**: Core compatibility
- **OHIF v3.11.0+**: Full feature compatibility
- **React 18.0+**: Required React version
- **Node.js 18+**: Development/build requirements

### Browser Compatibility
- **Chrome 90+**: Full support
- **Firefox 88+**: Full support  
- **Safari 14+**: Full support
- **Edge 90+**: Full support

## Architecture Decision Records (ADRs)

### ADR-001: Extension Architecture Pattern
- **Decision**: Use OHIF v3 extension pattern for all enhancements
- **Rationale**: Ensures compatibility and maintainability
- **Status**: Approved

### ADR-002: Service Integration Strategy
- **Decision**: Extend existing services rather than replace
- **Rationale**: Maintains compatibility with other extensions
- **Status**: Approved

### ADR-003: Component Override Strategy
- **Decision**: Use priority-based component registration
- **Rationale**: Allows graceful enhancement without breaking existing functionality
- **Status**: Approved

### ADR-004: Virtual Series Implementation
- **Decision**: Implement as enhanced data source
- **Rationale**: Leverages existing OHIF data architecture
- **Status**: Approved

## Next Steps

1. Review architecture documentation with development team
2. Validate architectural decisions against requirements
3. Create deployment-specific architecture diagrams
4. Document any architecture modifications during deployment

This architecture documentation provides the foundation for successful deployment and maintenance of the Enhanced OHIF v3 system. 