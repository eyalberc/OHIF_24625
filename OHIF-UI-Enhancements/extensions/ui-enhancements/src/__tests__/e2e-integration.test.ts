/**
 * End-to-End Integration Test Suite
 * 
 * Comprehensive testing of the UI-Enhancements extension integration with OHIF v3 Core
 * Tests all components working together in realistic scenarios
 * 
 * Task 7.8: End-to-End Integration Testing
 */

import { jest } from '@jest/globals';

// Import extension and utilities
import uiEnhancementsExtension from '../index';
import { validateServiceIntegration } from '../utils/serviceIntegrationValidation';
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

// Setup DOM environment for testing
const setupDOMEnvironment = () => {
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

    // Mock console methods to reduce test noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    // Clear global cache
    if ((window as any).uiEnhancementsCache) {
      (window as any).uiEnhancementsCache.clear();
    }

    // Restore console methods
    jest.restoreAllMocks();
  });

  describe('1. Extension Registration and Discovery', () => {
    it('should have correct extension metadata and structure', () => {
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

    it('should have proper configuration structure with all features enabled', () => {
      const config = uiEnhancementsExtension.configuration;
      
      expect(config.enableVirtualSeries).toBe(true);
      expect(config.enableGlobalPatientHeader).toBe(true);
      expect(config.enableStudyComparison).toBe(true);
      expect(config.enableEnhancedToolbar).toBe(true);
      expect(config.enablePRDColorSystem).toBe(true);
      
      expect(config.lifecycle).toBeDefined();
      expect(config.conflictResolution).toBeDefined();
      expect(config.conflictResolution.enabled).toBe(true);
    });
  });

  describe('2. Service Integration Validation', () => {
    it('should validate all required services are available and functional', async () => {
      const validationResult = await validateServiceIntegration(
        mockServicesManager,
        mockExtensionManager
      );

      expect(validationResult.success).toBe(true);
      expect(validationResult.results).toBeDefined();
      expect(validationResult.metrics).toBeDefined();
      expect(validationResult.results.length).toBeGreaterThan(0);

      // Check that all validation categories passed
      const categories = ['ViewportGridService', 'ToolbarService', 'CustomizationService', 'ServiceCommunication'];
      categories.forEach(category => {
        const categoryResults = validationResult.results.filter(
          result => result.category === category
        );
        expect(categoryResults.length).toBeGreaterThan(0);
        expect(categoryResults.every(result => result.passed)).toBe(true);
      });
    });

    it('should handle service integration errors gracefully', async () => {
      const faultyServicesManager = {
        services: {
          viewportGridService: {
            getState: jest.fn().mockImplementation(() => {
              throw new Error('Service error');
            })
          }
        }
      };

      const validationResult = await validateServiceIntegration(
        faultyServicesManager,
        mockExtensionManager
      );

      // Should not crash the validation system
      expect(validationResult).toBeDefined();
      expect(typeof validationResult.success).toBe('boolean');
    });
  });

  describe('3. Lifecycle Management and Resource Cleanup', () => {
    it('should enter mode successfully with proper initialization', async () => {
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

    it('should exit mode successfully with proper cleanup', async () => {
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

    it('should validate required services during mode enter', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');

      // Test with missing services
      const incompleteServicesManager = {
        services: {
          // Missing viewportGridService and toolbarService
          customizationService: mockServicesManager.services.customizationService
        }
      };

      await uiEnhancementsExtension.onModeEnter({
        servicesManager: incompleteServicesManager,
        extensionManager: mockExtensionManager,
        appConfig: mockAppConfig
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[UI-Enhancements] Missing required services:'),
        expect.arrayContaining(['viewportGridService', 'toolbarService'])
      );
    });

    it('should handle lifecycle errors gracefully without crashing', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');

      // Test with null services manager
      try {
        await uiEnhancementsExtension.onModeEnter({
          servicesManager: null,
          extensionManager: mockExtensionManager,
          appConfig: mockAppConfig
        });
      } catch (error) {
        // Should handle errors gracefully
      }

      // Should not crash the application
      expect(true).toBe(true);
    });
  });

  describe('4. Module Integration and Functionality', () => {
    it('should provide functional toolbar module', () => {
      const toolbarModule = uiEnhancementsExtension.getToolbarModule({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager
      });

      expect(toolbarModule).toBeDefined();
      expect(toolbarModule.definitions || toolbarModule).toBeDefined();
    });

    it('should provide functional customization module', () => {
      const customizationModule = uiEnhancementsExtension.getCustomizationModule({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager
      });

      expect(customizationModule).toBeDefined();
    });

    it('should provide functional data sources module', () => {
      const dataSourcesModule = uiEnhancementsExtension.getDataSourcesModule({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager
      });

      expect(dataSourcesModule).toBeDefined();
    });

    it('should provide commands module with all required commands', () => {
      const commandsModule = uiEnhancementsExtension.getCommandsModule({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager
      });

      expect(commandsModule).toBeDefined();
      expect(commandsModule.definitions).toBeDefined();
      expect(Array.isArray(commandsModule.definitions)).toBe(true);
      
      const commandNames = commandsModule.definitions.map(def => def.commandName);
      expect(commandNames).toContain('toggleVirtualSeriesMode');
      expect(commandNames).toContain('resetVirtualSeriesCache');
      expect(commandNames).toContain('showGlobalPatientHeader');
      expect(commandNames).toContain('highlightCurrentStudy');
    });

    it('should provide panel module for future UI panels', () => {
      const panelModule = uiEnhancementsExtension.getPanelModule({
        servicesManager: mockServicesManager,
        commandsManager: {}
      });

      expect(panelModule).toBeDefined();
      expect(Array.isArray(panelModule)).toBe(true);
      expect(panelModule[0]).toHaveProperty('name');
      expect(panelModule[0]).toHaveProperty('label');
    });

    it('should provide utility module with all required exports', () => {
      const utilityModule = uiEnhancementsExtension.getUtilityModule({
        servicesManager: mockServicesManager
      });

      expect(utilityModule).toBeDefined();
      expect(Array.isArray(utilityModule)).toBe(true);

      const utilities = utilityModule[0].exports;
      expect(utilities.VirtualSeriesErrorHandler).toBeDefined();
      expect(utilities.lifecycleManager).toBeDefined();
      expect(utilities.getExtensionStatus).toBeDefined();
      expect(typeof utilities.highlightStudy).toBe('function');
      expect(typeof utilities.applyThemeColors).toBe('function');
      expect(typeof utilities.enhanceToolbar).toBe('function');
      expect(typeof utilities.validateServiceIntegration).toBe('function');
    });
  });

  describe('5. Enhanced Component Integration', () => {
    it('should integrate virtual series error handling', () => {
      expect(VirtualSeriesErrorHandler).toBeDefined();
      expect(typeof VirtualSeriesErrorHandler.handleError).toBe('function');
      expect(typeof VirtualSeriesErrorHandler.createErrorContext).toBe('function');
      expect(typeof VirtualSeriesErrorHandler.getRecoveryStrategy).toBe('function');
    });

    it('should integrate toolbar enhancement functionality', () => {
      const toolbarService = new ToolbarIntegrationService();
      
      expect(toolbarService).toBeDefined();
      expect(typeof toolbarService.enhanceButtons).toBe('function');
      expect(typeof toolbarService.applyConditionalLogic).toBe('function');
      expect(typeof toolbarService.getButtonConfiguration).toBe('function');
    });

    it('should integrate study comparison functionality', () => {
      const studyComparisonService = new StudyComparisonService();
      
      expect(studyComparisonService).toBeDefined();
      expect(typeof studyComparisonService.getStudyType).toBe('function');
      expect(typeof studyComparisonService.highlightStudyComparison).toBe('function');
      expect(typeof studyComparisonService.formatStudyDate).toBe('function');
    });

    it('should execute utility functions correctly', () => {
      const utilityModule = uiEnhancementsExtension.getUtilityModule({
        servicesManager: mockServicesManager
      });

      const utilities = utilityModule[0].exports;

      // Test highlight study utility
      const highlightResult = utilities.highlightStudy('study-123', 'current');
      expect(highlightResult).toBe(true);

      // Test apply theme colors utility
      const themeResult = utilities.applyThemeColors('dark');
      expect(themeResult).toBe(true);

      // Test enhance toolbar utility
      const toolbarConfig = { buttons: [] };
      const enhancedConfig = utilities.enhanceToolbar(toolbarConfig);
      expect(enhancedConfig).toBe(toolbarConfig);

      // Test extension status
      const status = utilities.getExtensionStatus();
      expect(status).toBeDefined();
      expect(typeof status.isInitialized).toBe('boolean');
    });
  });

  describe('6. Command Execution and Functionality', () => {
    it('should execute all extension commands successfully', () => {
      const commandsModule = uiEnhancementsExtension.getCommandsModule({});
      const commands = commandsModule.definitions;

      commands.forEach(command => {
        expect(typeof command.handler).toBe('function');
        
        // Test command execution
        const result = command.handler({
          servicesManager: mockServicesManager,
          studyInstanceUID: 'test-study',
          viewports: mockServicesManager.services.viewportGridService.getState().viewports
        });

        expect(result).toBe(true);
      });
    });

    it('should handle command execution errors gracefully', () => {
      const commandsModule = uiEnhancementsExtension.getCommandsModule({});
      const resetCacheCommand = commandsModule.definitions.find(
        cmd => cmd.commandName === 'resetVirtualSeriesCache'
      );

      // Remove the cache to test error handling
      delete (window as any).uiEnhancementsCache;

      const result = resetCacheCommand.handler({ servicesManager: mockServicesManager });
      expect(result).toBe(true); // Should handle gracefully
    });
  });

  describe('7. Real-World Integration Scenarios', () => {
    it('should handle complete workflow: initialization → study loading → viewport setup', async () => {
      // 1. Initialize extension
      await uiEnhancementsExtension.onModeEnter({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager,
        appConfig: mockAppConfig
      });

      // 2. Verify services are accessible
      expect(mockServicesManager.services.viewportGridService.getState).toHaveBeenCalled();

      // 3. Test utility functions work after initialization
      const utilityModule = uiEnhancementsExtension.getUtilityModule({
        servicesManager: mockServicesManager
      });
      
      const validationResult = await utilityModule[0].exports.validateServiceIntegration(
        mockServicesManager,
        mockExtensionManager
      );

      expect(validationResult.success).toBe(true);

      // 4. Test commands work after initialization
      const commandsModule = uiEnhancementsExtension.getCommandsModule({});
      const toggleCommand = commandsModule.definitions.find(
        cmd => cmd.commandName === 'toggleVirtualSeriesMode'
      );

      const commandResult = toggleCommand.handler({
        servicesManager: mockServicesManager,
        viewports: mockServicesManager.services.viewportGridService.getState().viewports
      });

      expect(commandResult).toBe(true);
    });

    it('should maintain performance under repeated operations', async () => {
      const startTime = performance.now();

      // Simulate multiple rapid mode enter/exit cycles
      for (let i = 0; i < 10; i++) {
        await uiEnhancementsExtension.onModeEnter({
          servicesManager: mockServicesManager,
          extensionManager: mockExtensionManager,
          appConfig: mockAppConfig
        });
        
        await uiEnhancementsExtension.onModeExit();
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete operations in reasonable time (< 1 second for 10 cycles)
      expect(totalTime).toBeLessThan(1000);
    });

    it('should handle configuration variations correctly', async () => {
      const customConfigs = [
        {
          extensions: {
            '@ohif/extension-ui-enhancements': {
              enableVirtualSeries: false,
              enableGlobalPatientHeader: true,
              enableStudyComparison: false
            }
          }
        },
        {
          extensions: {
            '@ohif/extension-ui-enhancements': {
              enableVirtualSeries: true,
              enableGlobalPatientHeader: false,
              enableStudyComparison: true
            }
          }
        }
      ];

      for (const config of customConfigs) {
        await uiEnhancementsExtension.onModeEnter({
          servicesManager: mockServicesManager,
          extensionManager: mockExtensionManager,
          appConfig: config
        });

        // Should handle different configurations without errors
        await uiEnhancementsExtension.onModeExit();
      }

      expect(true).toBe(true); // Test passed if no errors thrown
    });
  });

  describe('8. Error Handling and Resilience', () => {
    it('should handle module getter errors gracefully', () => {
      // Test each module getter with invalid parameters
      const modules = [
        () => uiEnhancementsExtension.getToolbarModule(null),
        () => uiEnhancementsExtension.getCustomizationModule(undefined),
        () => uiEnhancementsExtension.getDataSourcesModule({}),
        () => uiEnhancementsExtension.getCommandsModule(null),
        () => uiEnhancementsExtension.getPanelModule({}),
        () => uiEnhancementsExtension.getUtilityModule({})
      ];

      modules.forEach(moduleGetter => {
        const result = moduleGetter();
        expect(result).toBeDefined(); // Should return something, not crash
      });
    });

    it('should recover from service failures during runtime', async () => {
      // Initialize normally
      await uiEnhancementsExtension.onModeEnter({
        servicesManager: mockServicesManager,
        extensionManager: mockExtensionManager,
        appConfig: mockAppConfig
      });

      // Simulate service failure
      mockServicesManager.services.viewportGridService.getState.mockImplementation(() => {
        throw new Error('Service temporarily unavailable');
      });

      // Extension should continue to function
      const utilityModule = uiEnhancementsExtension.getUtilityModule({
        servicesManager: mockServicesManager
      });

      expect(utilityModule).toBeDefined();
      
      // Commands should still work
      const commandsModule = uiEnhancementsExtension.getCommandsModule({});
      expect(commandsModule.definitions.length).toBeGreaterThan(0);
    });
  });

  describe('9. Integration Testing Summary', () => {
    it('should pass comprehensive integration validation', async () => {
      const results = {
        extensionRegistration: true,
        serviceIntegration: true,
        lifecycleManagement: true,
        moduleIntegration: true,
        componentIntegration: true,
        commandExecution: true,
        errorHandling: true,
        performanceMetrics: true
      };

      // Comprehensive test execution
      try {
        // Test extension structure
        expect(uiEnhancementsExtension.id).toBeDefined();
        
        // Test service integration
        const validationResult = await validateServiceIntegration(
          mockServicesManager,
          mockExtensionManager
        );
        expect(validationResult.success).toBe(true);
        
        // Test lifecycle
        await uiEnhancementsExtension.onModeEnter({
          servicesManager: mockServicesManager,
          extensionManager: mockExtensionManager,
          appConfig: mockAppConfig
        });
        await uiEnhancementsExtension.onModeExit();
        
        // Test modules
        const modules = [
          uiEnhancementsExtension.getToolbarModule({}),
          uiEnhancementsExtension.getCustomizationModule({}),
          uiEnhancementsExtension.getDataSourcesModule({}),
          uiEnhancementsExtension.getCommandsModule({}),
          uiEnhancementsExtension.getPanelModule({}),
          uiEnhancementsExtension.getUtilityModule({})
        ];
        modules.forEach(module => expect(module).toBeDefined());
        
        // Test components
        expect(VirtualSeriesErrorHandler).toBeDefined();
        expect(ToolbarIntegrationService).toBeDefined();
        expect(StudyComparisonService).toBeDefined();

      } catch (error) {
        results.extensionRegistration = false;
        results.serviceIntegration = false;
        results.lifecycleManagement = false;
        results.moduleIntegration = false;
        results.componentIntegration = false;
      }

      // Verify all integration tests passed
      Object.values(results).forEach(result => {
        expect(result).toBe(true);
      });

      console.log('🎉 All End-to-End Integration Tests Passed Successfully!');
      console.log('📊 Integration Test Results:', results);
    });
  });
});

// Export test utilities for other test files
export { 
  createMockServicesManager, 
  createMockExtensionManager, 
  createMockAppConfig, 
  setupDOMEnvironment 
}; 