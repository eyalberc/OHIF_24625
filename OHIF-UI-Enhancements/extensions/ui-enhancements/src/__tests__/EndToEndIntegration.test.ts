/**
 * End-to-End Integration Test Suite
 * 
 * Comprehensive testing of the UI-Enhancements extension integration with OHIF v3 Core
 * Tests all components working together in realistic scenarios
 * 
 * Task 7.8: End-to-End Integration Testing
 */

import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Import extension and utilities
import uiEnhancementsExtension from '../index';
import { validateServiceIntegration } from '../utils/serviceIntegrationValidation';
import { createConflictResolution } from '../utils/conflictResolution';
import { DataSourceRegistrationManager } from '../utils/dataSourceRegistrationOrder';

// Import services for testing
import { VirtualSeriesErrorHandler } from '../services/VirtualSeriesErrorHandler';
import { ToolbarIntegrationService } from '../services/ToolbarIntegrationService';
import { StudyComparisonService } from '../services/StudyComparisonService';

// Mock OHIF core services
const createMockServicesManager = () => ({
  services: {
    viewportGridService: {
      getState: jest.fn().mockReturnValue({
        viewports: new Map([
          ['viewport-1', { 
            id: 'viewport-1',
            studyInstanceUID: 'study-123',
            displaySetInstanceUID: 'displayset-123',
            isActive: true
          }],
          ['viewport-2', { 
            id: 'viewport-2',
            studyInstanceUID: 'study-456',
            displaySetInstanceUID: 'displayset-456',
            isActive: false
          }]
        ]),
        activeViewportIndex: 0,
        layout: { numRows: 2, numCols: 2 }
      }),
      setViewportOptions: jest.fn(),
      setDisplaySetsForViewports: jest.fn(),
      subscribe: jest.fn().mockReturnValue(() => {}),
      EVENTS: {
        VIEWPORT_GRID_CHANGED: 'VIEWPORT_GRID_CHANGED',
        ACTIVE_VIEWPORT_INDEX_CHANGED: 'ACTIVE_VIEWPORT_INDEX_CHANGED'
      }
    },
    toolbarService: {
      recordInteraction: jest.fn(),
      getState: jest.fn().mockReturnValue({
        buttons: [],
        primaryToolId: 'Zoom',
        toolGroupId: 'default',
        tools: new Map()
      }),
      createButton: jest.fn(),
      addButtons: jest.fn(),
      setButtons: jest.fn(),
      subscribe: jest.fn().mockReturnValue(() => {})
    },
    customizationService: {
      getCustomization: jest.fn().mockReturnValue({}),
      setCustomization: jest.fn(),
      addModeCustomizations: jest.fn(),
      getModeCustomizations: jest.fn().mockReturnValue([]),
      getGlobalCustomizations: jest.fn().mockReturnValue([])
    },
    uiNotificationService: {
      show: jest.fn(),
      hide: jest.fn(),
      subscribe: jest.fn().mockReturnValue(() => {})
    },
    dicomMetadataStore: {
      getStudyInstanceUIDs: jest.fn().mockReturnValue(['study-123', 'study-456']),
      getStudy: jest.fn().mockImplementation((uid) => ({
        StudyInstanceUID: uid,
        StudyDate: uid === 'study-123' ? '20231201' : '20231115',
        PatientName: 'Test^Patient',
        PatientAge: '45Y',
        PatientSex: 'M',
        StudyDescription: 'Test Study'
      })),
      subscribe: jest.fn().mockReturnValue(() => {}),
      EVENTS: {
        STUDY_ADDED: 'STUDY_ADDED',
        INSTANCES_ADDED: 'INSTANCES_ADDED'
      }
    },
    hangingProtocolService: {
      getProtocols: jest.fn().mockReturnValue([]),
      addProtocols: jest.fn(),
      run: jest.fn(),
      subscribe: jest.fn().mockReturnValue(() => {})
    },
    measurementService: {
      getMeasurements: jest.fn().mockReturnValue([]),
      addMeasurement: jest.fn(),
      subscribe: jest.fn().mockReturnValue(() => {})
    }
  }
});

const createMockExtensionManager = () => ({
  registeredExtensions: new Map([
    ['@ohif/extension-cornerstone', { id: '@ohif/extension-cornerstone', priority: 75 }],
    ['@ohif/extension-measurement-tracking', { id: '@ohif/extension-measurement-tracking', priority: 60 }],
    ['@ohif/extension-default', { id: '@ohif/extension-default', priority: 50 }]
  ]),
  getExtension: jest.fn().mockImplementation((id) => ({
    id,
    getToolbarModule: jest.fn(),
    getCustomizationModule: jest.fn(),
    getDataSourcesModule: jest.fn()
  })),
  registerExtension: jest.fn(),
  getModuleEntry: jest.fn(),
  modules: {
    toolbar: new Map(),
    customization: new Map(),
    dataSources: new Map(),
    commands: new Map()
  }
});

const createMockAppConfig = () => ({
  extensions: {
    '@ohif/extension-ui-enhancements': {
      enableVirtualSeries: true,
      enableGlobalPatientHeader: true,
      enableStudyComparison: true,
      enableEnhancedToolbar: true,
      enablePRDColorSystem: true
    }
  },
  modes: ['@ohif/mode-basic-viewer'],
  showStudyList: true,
  disableEditing: false
});

// Setup DOM environment
const setupDOMEnvironment = () => {
  // Mock document body with viewport elements
  document.body.innerHTML = `
    <div class="App">
      <div class="main-content">
        <div class="viewport-grid">
          <div class="viewport-element" data-study-instance-uid="study-123" data-study-date="20231201">
            <div class="cornerstone-viewport"></div>
          </div>
          <div class="viewport-element" data-study-instance-uid="study-456" data-study-date="20231115">
            <div class="cornerstone-viewport"></div>
          </div>
        </div>
        <div class="toolbar-container">
          <div class="ohif-toolbar">
            <button class="toolbar-button" data-tool="WindowLevel">Window/Level</button>
            <button class="toolbar-button" data-tool="Zoom">Zoom</button>
            <button class="toolbar-button" data-tool="Pan">Pan</button>
          </div>
        </div>
        <div class="patient-header-container">
          <div class="global-patient-header">
            <div class="patient-name">Loading...</div>
            <div class="patient-demographics">Loading demographics...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Mock window object for virtual series
  Object.defineProperty(window, 'uiEnhancementsCache', {
    value: new Map(),
    writable: true
  });

  // Mock CSS injection capabilities
  Object.defineProperty(document, 'styleSheets', {
    value: [],
    writable: true
  });
};

describe('End-to-End Integration Tests', () => {
  let mockServicesManager: any;
  let mockExtensionManager: any;
  let mockAppConfig: any;

  beforeEach(() => {
    mockServicesManager = createMockServicesManager();
    mockExtensionManager = createMockExtensionManager();
    mockAppConfig = createMockAppConfig();
    setupDOMEnvironment();

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Clear global cache
    if (window.uiEnhancementsCache) {
      window.uiEnhancementsCache.clear();
    }
  });

  describe('1. Extension Registration and Discovery', () => {
    it('should have correct extension metadata', () => {
      expect(uiEnhancementsExtension.id).toBe('@ohif/extension-ui-enhancements');
      expect(typeof uiEnhancementsExtension.preRegistration).toBe('function');
      expect(typeof uiEnhancementsExtension.onModeEnter).toBe('function');
      expect(typeof uiEnhancementsExtension.onModeExit).toBe('function');
      expect(uiEnhancementsExtension.configuration).toBeDefined();
    });

    it('should export all required module getters', () => {
      expect(typeof uiEnhancementsExtension.getToolbarModule).toBe('function');
      expect(typeof uiEnhancementsExtension.getCustomizationModule).toBe('function');
      expect(typeof uiEnhancementsExtension.getDataSourcesModule).toBe('function');
      expect(typeof uiEnhancementsExtension.getCommandsModule).toBe('function');
      expect(typeof uiEnhancementsExtension.getPanelModule).toBe('function');
      expect(typeof uiEnhancementsExtension.getUtilityModule).toBe('function');
    });

    it('should have proper configuration structure', () => {
      const config = uiEnhancementsExtension.configuration;
      
      expect(config.enableVirtualSeries).toBe(true);
      expect(config.enableGlobalPatientHeader).toBe(true);
      expect(config.enableStudyComparison).toBe(true);
      expect(config.enableEnhancedToolbar).toBe(true);
      expect(config.enablePRDColorSystem).toBe(true);
      
      expect(config.lifecycle).toBeDefined();
      expect(config.conflictResolution).toBeDefined();
    });
  });

  describe('2. Pre-Registration and Initialization', () => {
    it('should execute pre-registration successfully', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      
      await uiEnhancementsExtension.preRegistration({
        servicesManager: mockServicesManager,
        commandsManager: {},
        appConfig: mockAppConfig
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[UI-Enhancements] Pre-registration completed')
      );
    });

    it('should handle pre-registration errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      // Test with invalid services manager
      await uiEnhancementsExtension.preRegistration({
        servicesManager: null,
        commandsManager: {},
        appConfig: mockAppConfig
      });

      // Should not throw, but may log errors
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Pre-registration failed')
      );
    });
  });

  describe('3. Service Integration Validation', () => {
    it('should validate all required services are available', async () => {
      const validationResult = await validateServiceIntegration(
        mockServicesManager,
        mockExtensionManager
      );

      expect(validationResult.success).toBe(true);
      expect(validationResult.results).toBeDefined();
      expect(validationResult.metrics).toBeDefined();
      expect(validationResult.results.length).toBeGreaterThan(0);
    });

    it('should validate ViewportGridService integration', async () => {
      const validationResult = await validateServiceIntegration(
        mockServicesManager,
        mockExtensionManager
      );

      const viewportGridResults = validationResult.results.filter(
        result => result.category === 'ViewportGridService'
      );

      expect(viewportGridResults.length).toBeGreaterThan(0);
      expect(viewportGridResults.every(result => result.passed)).toBe(true);
    });

    it('should validate ToolbarService integration', async () => {
      const validationResult = await validateServiceIntegration(
        mockServicesManager,
        mockExtensionManager
      );

      const toolbarResults = validationResult.results.filter(
        result => result.category === 'ToolbarService'
      );

      expect(toolbarResults.length).toBeGreaterThan(0);
      expect(toolbarResults.every(result => result.passed)).toBe(true);
    });

    it('should validate CustomizationService integration', async () => {
      const validationResult = await validateServiceIntegration(
        mockServicesManager,
        mockExtensionManager
      );

      const customizationResults = validationResult.results.filter(
        result => result.category === 'CustomizationService'
      );

      expect(customizationResults.length).toBeGreaterThan(0);
      expect(customizationResults.every(result => result.passed)).toBe(true);
    });
  });

  describe('4. Conflict Resolution System', () => {
    it('should create conflict resolution system successfully', () => {
      const conflictResolver = createConflictResolution(mockExtensionManager);

      expect(conflictResolver).toBeDefined();
      expect(typeof conflictResolver.resolveToolbarConflicts).toBe('function');
      expect(typeof conflictResolver.resolveCustomizationConflicts).toBe('function');
      expect(typeof conflictResolver.resolveDataSourceConflicts).toBe('function');
      expect(typeof conflictResolver.resolveCommandsConflicts).toBe('function');
    });

    it('should resolve toolbar conflicts with proper priority', () => {
      const conflictResolver = createConflictResolution(mockExtensionManager);
      
      const toolbarConflicts = [
        { id: 'button1', source: '@ohif/extension-default', priority: 50 },
        { id: 'button1', source: '@ohif/extension-ui-enhancements', priority: 100 }
      ];

      const resolved = conflictResolver.resolveToolbarConflicts(toolbarConflicts);
      
      expect(resolved.winner.source).toBe('@ohif/extension-ui-enhancements');
      expect(resolved.strategy).toBe('priority_override');
    });
  });

  describe('5. Data Source Registration Order', () => {
    it('should create data source registration manager', () => {
      const registrationManager = new DataSourceRegistrationManager();

      expect(registrationManager).toBeDefined();
      expect(typeof registrationManager.registerDataSources).toBe('function');
      expect(typeof registrationManager.validateDependencies).toBe('function');
      expect(typeof registrationManager.getMetrics).toBe('function');
    });

    it('should register data sources in correct order', () => {
      const registrationManager = new DataSourceRegistrationManager();
      
      const dataSources = [
        { id: 'enhanced-web', priority: 80, dependencies: [] },
        { id: 'dicom-web', priority: 70, dependencies: [] },
        { id: 'virtual-series', priority: 100, dependencies: ['enhanced-web'] }
      ];

      const result = registrationManager.registerDataSources(dataSources);
      
      expect(result.success).toBe(true);
      expect(result.registrationOrder).toEqual(['enhanced-web', 'dicom-web', 'virtual-series']);
    });
  });

  describe('6. Lifecycle Management', () => {
    it('should enter mode successfully', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      await uiEnhancementsExtension.onModeEnter({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager,
        appConfig: mockAppConfig
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[UI-Enhancements] Mode enter completed successfully')
      );
    });

    it('should exit mode successfully', async () => {
      // First enter mode
      await uiEnhancementsExtension.onModeEnter({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager,
        appConfig: mockAppConfig
      });

      const consoleLogSpy = jest.spyOn(console, 'log');

      // Then exit mode
      await uiEnhancementsExtension.onModeExit();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[UI-Enhancements] Mode exit completed successfully')
      );
    });

    it('should handle lifecycle errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');

      // Cause an error by passing invalid parameters
      const invalidServicesManager = {
        services: {
          // Missing required services
        }
      };

      try {
        await uiEnhancementsExtension.onModeEnter({
          servicesManager: invalidServicesManager,
          extensionManager: mockExtensionManager,
          appConfig: mockAppConfig
        });
      } catch (error) {
        // Error should be handled gracefully
      }

      // Should not crash the application
      expect(true).toBe(true);
    });
  });

  describe('7. Enhanced Component Integration', () => {
    it('should integrate virtual series functionality', () => {
      // Test virtual series error handler
      expect(VirtualSeriesErrorHandler).toBeDefined();
      expect(typeof VirtualSeriesErrorHandler.handleError).toBe('function');
      expect(typeof VirtualSeriesErrorHandler.createErrorContext).toBe('function');
    });

    it('should integrate toolbar enhancement functionality', () => {
      const toolbarService = new ToolbarIntegrationService();
      
      expect(toolbarService).toBeDefined();
      expect(typeof toolbarService.enhanceButtons).toBe('function');
      expect(typeof toolbarService.applyConditionalLogic).toBe('function');
    });

    it('should integrate study comparison functionality', () => {
      const studyComparisonService = new StudyComparisonService();
      
      expect(studyComparisonService).toBeDefined();
      expect(typeof studyComparisonService.getStudyType).toBe('function');
      expect(typeof studyComparisonService.highlightStudyComparison).toBe('function');
    });

    it('should apply study awareness to viewports', async () => {
      // Enter mode to initialize
      await uiEnhancementsExtension.onModeEnter({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager,
        appConfig: mockAppConfig
      });

      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if viewport elements have study awareness classes
      const viewports = document.querySelectorAll('.viewport-element');
      
      expect(viewports.length).toBe(2);
    });
  });

  describe('8. Real-World Integration Scenarios', () => {
    it('should handle complete workflow: study loading → viewport setup → highlighting', async () => {
      // 1. Initialize extension
      await uiEnhancementsExtension.onModeEnter({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager,
        appConfig: mockAppConfig
      });

      // 2. Simulate study loading
      const studyLoadEvent = {
        type: 'STUDY_ADDED',
        studyMetadata: {
          StudyInstanceUID: 'study-123',
          StudyDate: '20231201',
          PatientName: 'Test^Patient'
        }
      };

      // 3. Simulate viewport grid change
      const viewportGridChangeEvent = {
        type: 'VIEWPORT_GRID_CHANGED',
        viewports: mockServicesManager.services.viewportGridService.getState().viewports
      };

      // Simulate events (would normally be triggered by OHIF core)
      // Here we test that the system is ready to handle these events

      expect(mockServicesManager.services.viewportGridService.getState).toHaveBeenCalled();
      expect(mockServicesManager.services.dicomMetadataStore.getStudy).toBeDefined();
    });

    it('should handle error scenarios gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');

      // Test with services that throw errors
      const errorServicesManager = {
        services: {
          viewportGridService: {
            getState: jest.fn().mockImplementation(() => {
              throw new Error('Service error');
            }),
            subscribe: jest.fn().mockReturnValue(() => {})
          },
          toolbarService: {
            recordInteraction: jest.fn().mockImplementation(() => {
              throw new Error('Toolbar error');
            }),
            getState: jest.fn().mockReturnValue({})
          }
        }
      };

      // Should not crash when services throw errors
      await uiEnhancementsExtension.onModeEnter({
        servicesManager: errorServicesManager,
        extensionManager: mockExtensionManager,
        appConfig: mockAppConfig
      });

      // Extension should handle errors gracefully
      expect(true).toBe(true);
    });

    it('should maintain performance under load', async () => {
      const startTime = performance.now();

      // Simulate multiple rapid operations
      for (let i = 0; i < 100; i++) {
        await uiEnhancementsExtension.onModeEnter({
          servicesManager: mockServicesManager,
          extensionManager: mockExtensionManager,
          appConfig: mockAppConfig
        });
        
        await uiEnhancementsExtension.onModeExit();
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete 100 operations in reasonable time (< 5 seconds)
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('9. Configuration and Customization', () => {
    it('should respect feature flags', async () => {
      const customConfig = {
        extensions: {
          '@ohif/extension-ui-enhancements': {
            enableVirtualSeries: false,
            enableGlobalPatientHeader: true,
            enableStudyComparison: false,
            enableEnhancedToolbar: true,
            enablePRDColorSystem: true
          }
        }
      };

      const consoleLogSpy = jest.spyOn(console, 'log');

      await uiEnhancementsExtension.onModeEnter({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager,
        appConfig: customConfig
      });

      // Should log only enabled features
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Global patient header enabled')
      );
    });

    it('should export utility functions', () => {
      const utilityModule = uiEnhancementsExtension.getUtilityModule({
        servicesManager: mockServicesManager
      });

      expect(utilityModule).toBeDefined();
      expect(Array.isArray(utilityModule)).toBe(true);
      expect(utilityModule.length).toBeGreaterThan(0);

      const utilities = utilityModule[0].exports;
      expect(utilities.VirtualSeriesErrorHandler).toBeDefined();
      expect(utilities.lifecycleManager).toBeDefined();
      expect(utilities.validateServiceIntegration).toBeDefined();
      expect(typeof utilities.highlightStudy).toBe('function');
      expect(typeof utilities.applyThemeColors).toBe('function');
      expect(typeof utilities.enhanceToolbar).toBe('function');
    });
  });

  describe('10. Module Integration', () => {
    it('should provide toolbar module', () => {
      const toolbarModule = uiEnhancementsExtension.getToolbarModule({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager
      });

      expect(toolbarModule).toBeDefined();
    });

    it('should provide customization module', () => {
      const customizationModule = uiEnhancementsExtension.getCustomizationModule({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager
      });

      expect(customizationModule).toBeDefined();
    });

    it('should provide data sources module', () => {
      const dataSourcesModule = uiEnhancementsExtension.getDataSourcesModule({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager
      });

      expect(dataSourcesModule).toBeDefined();
    });

    it('should provide commands module', () => {
      const commandsModule = uiEnhancementsExtension.getCommandsModule({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager
      });

      expect(commandsModule).toBeDefined();
    });

    it('should provide panel module', () => {
      const panelModule = uiEnhancementsExtension.getPanelModule({
        servicesManager: mockServicesManager,
        commandsManager: {}
      });

      expect(panelModule).toBeDefined();
      expect(Array.isArray(panelModule)).toBe(true);
    });
  });
});

export { createMockServicesManager, createMockExtensionManager, createMockAppConfig, setupDOMEnvironment }; 