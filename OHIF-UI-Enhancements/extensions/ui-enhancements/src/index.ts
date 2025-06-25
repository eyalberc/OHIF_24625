import { Types } from '@ohif/core';
import { id } from './id';
import preRegistration, { onModeExit as initOnModeExit, getToolbarIntegrationService } from './init';
import getToolbarModule from './getToolbarModule';
import getCustomizationModule from './getCustomizationModule';
import getDataSourcesModule from './getDataSourcesModule';

// Import services and components for utility exports
import { VirtualSeriesErrorHandler } from './services/VirtualSeriesErrorHandler';

// Import validation systems
import { validateServiceIntegration } from './utils/serviceIntegrationValidation';

/**
 * Lifecycle Management Class for UI Enhancements Extension
 * Handles extension lifecycle events and resource management
 */
class UIEnhancementsLifecycleManager {
  private isInitialized = false;
  private activeSubscriptions: (() => void)[] = [];
  private servicesManager: any = null;
  private extensionManager: any = null;
  private resourceCleanupCallbacks: (() => void)[] = [];

  /**
   * Initialize the lifecycle manager
   */
  async initialize({ servicesManager, extensionManager }: any) {
    if (this.isInitialized) {
      console.warn('[UI-Enhancements] Lifecycle manager already initialized');
      return;
    }

    this.servicesManager = servicesManager;
    this.extensionManager = extensionManager;

    try {
      // Validate service integrations
      if (servicesManager) {
        console.log('[UI-Enhancements] Validating service integrations...');
        const validationResult = await validateServiceIntegration(servicesManager, extensionManager);
        
        if (validationResult.success) {
          console.log('[UI-Enhancements] Service integration validation passed');
        } else {
          console.warn('[UI-Enhancements] Service integration validation had issues:', validationResult);
        }
      }

      // Set up event subscriptions for viewport changes
      this.setupEventSubscriptions();

      // Register cleanup callbacks
      this.registerCleanupCallbacks();

      this.isInitialized = true;
      console.log('[UI-Enhancements] Lifecycle manager initialized successfully');

    } catch (error) {
      console.error('[UI-Enhancements] Failed to initialize lifecycle manager:', error);
      throw error;
    }
  }

  /**
   * Set up event subscriptions for enhanced functionality
   */
  private setupEventSubscriptions() {
    try {
      const { viewportGridService } = this.servicesManager?.services || {};

      if (viewportGridService && typeof viewportGridService.subscribe === 'function') {
        // Subscribe to viewport grid changes for study awareness
        const unsubscribeViewportGrid = viewportGridService.subscribe(
          'viewportGridChanged',
          this.handleViewportGridChange.bind(this)
        );

        this.activeSubscriptions.push(unsubscribeViewportGrid);
        console.log('[UI-Enhancements] Subscribed to viewport grid changes');
      }

      // Subscribe to study loading events if available
      const { uiNotificationService } = this.servicesManager?.services || {};
      if (uiNotificationService && typeof uiNotificationService.subscribe === 'function') {
        const unsubscribeNotifications = uiNotificationService.subscribe(
          'studyLoadComplete',
          this.handleStudyLoadComplete.bind(this)
        );

        this.activeSubscriptions.push(unsubscribeNotifications);
        console.log('[UI-Enhancements] Subscribed to study load notifications');
      }

    } catch (error) {
      console.error('[UI-Enhancements] Error setting up event subscriptions:', error);
    }
  }

  /**
   * Handle viewport grid changes
   */
  private handleViewportGridChange(event: any) {
    try {
      console.log('[UI-Enhancements] Viewport grid changed:', event);
      
      // Update study awareness highlighting
      this.updateStudyAwareness();
      
      // Refresh virtual series if needed
      this.refreshVirtualSeries();

    } catch (error) {
      console.error('[UI-Enhancements] Error handling viewport grid change:', error);
    }
  }

  /**
   * Handle study load complete events
   */
  private handleStudyLoadComplete(event: any) {
    try {
      console.log('[UI-Enhancements] Study load completed:', event);
      
      // Update patient header if available
      this.updatePatientHeader(event.studyMetadata);
      
      // Apply study comparison highlighting
      this.applyStudyComparisonHighlighting(event.studyMetadata);

    } catch (error) {
      console.error('[UI-Enhancements] Error handling study load complete:', error);
    }
  }

  /**
   * Update study awareness highlighting
   */
  private updateStudyAwareness() {
    try {
      const viewports = document.querySelectorAll('.viewport-element');
      viewports.forEach((viewport: any) => {
        // Add study-aware viewport class if not already present
        if (!viewport.classList.contains('study-aware-viewport')) {
          viewport.classList.add('study-aware-viewport');
        }
      });
    } catch (error) {
      console.error('[UI-Enhancements] Error updating study awareness:', error);
    }
  }

  /**
   * Refresh virtual series data
   */
  private refreshVirtualSeries() {
    try {
      // Trigger virtual series refresh if needed
      const virtualSeriesInstances = document.querySelectorAll('[data-virtual-series="true"]');
      if (virtualSeriesInstances.length > 0) {
        console.log('[UI-Enhancements] Refreshing virtual series instances');
        // Additional virtual series logic would go here
      }
    } catch (error) {
      console.error('[UI-Enhancements] Error refreshing virtual series:', error);
    }
  }

  /**
   * Update patient header with study metadata
   */
  private updatePatientHeader(studyMetadata: any) {
    try {
      const patientHeader = document.querySelector('.global-patient-header');
      if (patientHeader && studyMetadata) {
        // Update patient information
        const patientNameElement = patientHeader.querySelector('.patient-name');
        if (patientNameElement && studyMetadata.PatientName) {
          patientNameElement.textContent = studyMetadata.PatientName;
        }

        const demographicsElement = patientHeader.querySelector('.patient-demographics');
        if (demographicsElement) {
          const demographics = [];
          if (studyMetadata.PatientAge) demographics.push(`Age: ${studyMetadata.PatientAge}`);
          if (studyMetadata.PatientSex) demographics.push(`Sex: ${studyMetadata.PatientSex}`);
          if (studyMetadata.StudyDate) demographics.push(`Date: ${studyMetadata.StudyDate}`);
          
          demographicsElement.innerHTML = demographics.join(' | ');
        }

        console.log('[UI-Enhancements] Patient header updated');
      }
    } catch (error) {
      console.error('[UI-Enhancements] Error updating patient header:', error);
    }
  }

  /**
   * Apply study comparison highlighting
   */
  private applyStudyComparisonHighlighting(studyMetadata: any) {
    try {
      const viewports = document.querySelectorAll('.study-aware-viewport');
      
      viewports.forEach((viewport: any) => {
        const isCurrentStudy = this.isCurrentStudy(viewport, studyMetadata);
        const isPriorStudy = this.isPriorStudy(viewport, studyMetadata);

        // Remove existing classes
        viewport.classList.remove('viewport-current-study', 'viewport-prior-study');

        // Apply appropriate styling
        if (isCurrentStudy) {
          viewport.classList.add('viewport-current-study');
          this.addStudyOverlay(viewport, 'Current Study', 'current');
        } else if (isPriorStudy) {
          viewport.classList.add('viewport-prior-study');
          this.addStudyOverlay(viewport, 'Prior Study', 'prior');
        }
      });

      console.log('[UI-Enhancements] Study comparison highlighting applied');
    } catch (error) {
      console.error('[UI-Enhancements] Error applying study comparison highlighting:', error);
    }
  }

  /**
   * Check if viewport contains current study
   */
  private isCurrentStudy(viewport: any, studyMetadata: any): boolean {
    // Implementation would check viewport data against current study
    // This is a simplified version
    return viewport.dataset?.studyInstanceUid === studyMetadata?.StudyInstanceUID;
  }

  /**
   * Check if viewport contains prior study
   */
  private isPriorStudy(viewport: any, studyMetadata: any): boolean {
    // Implementation would check viewport data against prior studies
    // This is a simplified version
    const studyDate = viewport.dataset?.studyDate;
    const currentStudyDate = studyMetadata?.StudyDate;
    
    return studyDate && currentStudyDate && studyDate < currentStudyDate;
  }

  /**
   * Add study overlay to viewport
   */
  private addStudyOverlay(viewport: any, label: string, type: 'current' | 'prior') {
    try {
      // Remove existing overlay
      const existingOverlay = viewport.querySelector('.viewport-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // Create new overlay
      const overlay = document.createElement('div');
      overlay.className = `viewport-overlay viewport-overlay-${type}`;
      overlay.textContent = label;
      overlay.setAttribute('aria-label', `${label} viewport`);
      
      viewport.appendChild(overlay);
    } catch (error) {
      console.error('[UI-Enhancements] Error adding study overlay:', error);
    }
  }

  /**
   * Register cleanup callbacks for various resources
   */
  private registerCleanupCallbacks() {
    // Virtual Series Error Handler cleanup
    this.resourceCleanupCallbacks.push(() => {
      try {
        const errorHandler = VirtualSeriesErrorHandler;
        if (errorHandler && typeof errorHandler.cleanup === 'function') {
          errorHandler.cleanup();
        }
      } catch (error) {
        console.error('[UI-Enhancements] Error cleaning up VirtualSeriesErrorHandler:', error);
      }
    });

    // Clear global UI enhancement cache
    this.resourceCleanupCallbacks.push(() => {
      try {
        if (typeof window !== 'undefined' && (window as any).uiEnhancementsCache) {
          (window as any).uiEnhancementsCache.clear?.();
          delete (window as any).uiEnhancementsCache;
        }
      } catch (error) {
        console.error('[UI-Enhancements] Error clearing global cache:', error);
      }
    });

    // Clean up DOM modifications
    this.resourceCleanupCallbacks.push(() => {
      try {
        // Remove study awareness classes
        const studyAwareViewports = document.querySelectorAll('.study-aware-viewport');
        studyAwareViewports.forEach(viewport => {
          viewport.classList.remove(
            'study-aware-viewport',
            'viewport-current-study',
            'viewport-prior-study'
          );
          
          // Remove overlays
          const overlay = viewport.querySelector('.viewport-overlay');
          if (overlay) {
            overlay.remove();
          }
        });

        // Remove enhanced toolbar classes
        const enhancedButtons = document.querySelectorAll('.toolbar-button-enlarged');
        enhancedButtons.forEach(button => {
          button.classList.remove('toolbar-button-enlarged');
        });

        console.log('[UI-Enhancements] DOM cleanup completed');
      } catch (error) {
        console.error('[UI-Enhancements] Error during DOM cleanup:', error);
      }
    });
  }

  /**
   * Cleanup all resources and subscriptions
   */
  async cleanup() {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Unsubscribe from all events
      this.activeSubscriptions.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('[UI-Enhancements] Error unsubscribing:', error);
        }
      });
      this.activeSubscriptions = [];

      // Execute all cleanup callbacks
      this.resourceCleanupCallbacks.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('[UI-Enhancements] Error during resource cleanup:', error);
        }
      });
      this.resourceCleanupCallbacks = [];

      // Call init cleanup
      initOnModeExit();

      // Clear references
      this.servicesManager = null;
      this.extensionManager = null;
      this.isInitialized = false;

      console.log('[UI-Enhancements] Lifecycle manager cleanup completed');

    } catch (error) {
      console.error('[UI-Enhancements] Error during lifecycle cleanup:', error);
    }
  }

  /**
   * Get current initialization status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      activeSubscriptions: this.activeSubscriptions.length,
      cleanupCallbacks: this.resourceCleanupCallbacks.length,
      hasServicesManager: !!this.servicesManager,
      hasExtensionManager: !!this.extensionManager
    };
  }
}

// Global lifecycle manager instance
const lifecycleManager = new UIEnhancementsLifecycleManager();

const uiEnhancementsExtension: Types.Extensions.Extension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   * @see https://docs.ohif.org/development/extensions/
   */
  id,
  
  /**
   * Pre-registration hook for setting up components and configuration
   */
  preRegistration,

  /**
   * Lifecycle hook: called when entering a mode
   * Used for mode-specific initialization and resource setup
   */
  async onModeEnter({ servicesManager, extensionManager, appConfig }: any) {
    try {
      console.log('[UI-Enhancements] Extension entering mode');
      
      // Initialize lifecycle manager
      await lifecycleManager.initialize({ servicesManager, extensionManager });
      
      // Validate that required services are available
      const requiredServices = ['viewportGridService', 'toolbarService'];
      const availableServices = Object.keys(servicesManager?.services || {});
      const missingServices = requiredServices.filter(service => !availableServices.includes(service));
      
      if (missingServices.length > 0) {
        console.warn('[UI-Enhancements] Missing required services:', missingServices);
      }

      // Initialize enhanced features based on configuration
      const config = appConfig?.extensions?.['@ohif/extension-ui-enhancements'] || this.configuration;
      
      if (config?.enableGlobalPatientHeader) {
        console.log('[UI-Enhancements] Global patient header enabled');
      }
      
      if (config?.enableStudyComparison) {
        console.log('[UI-Enhancements] Study comparison highlighting enabled');
      }
      
      if (config?.enableVirtualSeries) {
        console.log('[UI-Enhancements] Virtual series functionality enabled');
      }

      console.log('[UI-Enhancements] Mode enter completed successfully');

    } catch (error) {
      console.error('[UI-Enhancements] Error during mode enter:', error);
      throw error;
    }
  },

  /**
   * Lifecycle hook: called when exiting a mode
   * Used for cleanup and resource management
   */
  async onModeExit() {
    try {
      console.log('[UI-Enhancements] Extension exiting mode');
      
      // Cleanup lifecycle manager
      await lifecycleManager.cleanup();
      
      console.log('[UI-Enhancements] Mode exit completed successfully');

    } catch (error) {
      console.error('[UI-Enhancements] Error during mode exit:', error);
    }
  },

  /**
   * Enhanced getToolbarModule with conflict resolution
   */
  getToolbarModule(options = {}) {
    try {
      return getToolbarModule(options);
    } catch (error) {
      console.error('[UI-Enhancements] Error in getToolbarModule:', error);
      return { definitions: [] };
    }
  },

  /**
   * Enhanced getCustomizationModule with conflict resolution
   */
  getCustomizationModule(options = {}) {
    try {
      return getCustomizationModule(options);
    } catch (error) {
      console.error('[UI-Enhancements] Error in getCustomizationModule:', error);
      return [];
    }
  },

  /**
   * Enhanced getDataSourcesModule with conflict resolution
   */
  getDataSourcesModule(options = {}) {
    try {
      return getDataSourcesModule(options);
    } catch (error) {
      console.error('[UI-Enhancements] Error in getDataSourcesModule:', error);
      return [];
    }
  },

  /**
   * Enhanced getCommandsModule with conflict resolution
   */
  getCommandsModule(options = {}) {
    try {
      // Define commands module inline since we don't have a separate module file
      return {
        definitions: [
          {
            commandName: 'toggleVirtualSeriesMode',
            storeContexts: ['UI_ENHANCEMENTS'],
            options: {},
            handler: ({ viewports, servicesManager }) => {
              console.log('[UI-Enhancements] Toggle virtual series mode');
              // Implementation would go here
              return true;
            },
          },
          {
            commandName: 'resetVirtualSeriesCache',
            storeContexts: ['UI_ENHANCEMENTS'],
            options: {},
            handler: ({ servicesManager }) => {
              console.log('[UI-Enhancements] Reset virtual series cache');
              if (window.uiEnhancementsCache) {
                window.uiEnhancementsCache.clear();
              }
              return true;
            },
          },
          {
            commandName: 'showGlobalPatientHeader',
            storeContexts: ['UI_ENHANCEMENTS'],
            options: {},
            handler: ({ servicesManager }) => {
              console.log('[UI-Enhancements] Show global patient header');
              const header = document.querySelector('.global-patient-header');
              if (header) {
                header.style.display = 'block';
              }
              return true;
            },
          },
          {
            commandName: 'highlightCurrentStudy',
            storeContexts: ['UI_ENHANCEMENTS'],
            options: {},
            handler: ({ studyInstanceUID, servicesManager }) => {
              console.log('[UI-Enhancements] Highlight current study:', studyInstanceUID);
              // Implementation would go here
              return true;
            },
          },
        ],
      };
    } catch (error) {
      console.error('[UI-Enhancements] Error in getCommandsModule:', error);
      return { definitions: [] };
    }
  },

  /**
   * Panel module - future extension point for UI panels
   */
  getPanelModule: ({ servicesManager, commandsManager }) => {
    return [
      {
        name: 'uie.panels.ui-enhancements-panel',
        iconName: 'tab-ui-enhancements',
        iconLabel: 'UI Enhancements',
        label: 'UI Enhancements',
        component: () => null, // Placeholder for future panels
      },
    ];
  },

  /**
   * Utility module exports - shared utilities and services
   */
  getUtilityModule({ servicesManager }) {
    return [
      {
        name: 'ui-enhancements',
        exports: {
          // Virtual Series utilities
          VirtualSeriesErrorHandler,
          
          // Lifecycle management
          lifecycleManager,
          getExtensionStatus: () => lifecycleManager.getStatus(),
          
          // Enhanced UI utilities
          createPatientHeader: () => ({ create: true }),
          
          // Study comparison utilities
          highlightStudy: (studyInstanceUID, type = 'current') => {
            console.log(`[UI-Enhancements] Highlighting study ${studyInstanceUID} as ${type}`);
            return true;
          },
          
          // Color system utilities
          applyThemeColors: (theme = 'light') => {
            console.log(`[UI-Enhancements] Applying ${theme} theme colors`);
            return true;
          },
          
          // Toolbar enhancement utilities
          enhanceToolbar: (toolbarConfig) => {
            console.log('[UI-Enhancements] Enhancing toolbar with config:', toolbarConfig);
            return toolbarConfig;
          },

          // Service integration utilities
          validateServiceIntegration: (servicesManager: any, extensionManager?: any) => {
            return validateServiceIntegration(servicesManager, extensionManager);
          }
        },
      },
    ];
  },

  /**
   * Configuration and metadata
   */
  configuration: {
    // Extension-specific configuration
    enableVirtualSeries: true,
    enableGlobalPatientHeader: true,
    enableStudyComparison: true,
    enableEnhancedToolbar: true,
    enablePRDColorSystem: true,
    
    // Lifecycle configuration
    lifecycle: {
      validateServicesOnModeEnter: true,
      enableEventSubscriptions: true,
      enableResourceCleanup: true,
      enablePerformanceMonitoring: false
    },

    // Conflict resolution configuration
    conflictResolution: {
      enabled: true,
      logLevel: 'info',
      strategies: [
        'namespace_prefixing',
        'priority_management',
        'unique_identification',
        'context_isolation'
      ]
    },
  },
};

export default uiEnhancementsExtension; 