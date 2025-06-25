/**
 * Enhanced Toolbar Integration Service
 * 
 * Handles integration between the enhanced toolbar module and OHIF's ToolbarService
 * Provides dynamic tool state management, service registration, and event handling
 * 
 * Task 2.4: ToolbarService Integration - Complete
 * Task 2.5: Code Organization - Enhanced with types and improved structure
 * Task 2.8: Accessibility Compliance - WCAG 2.1 AA compliant
 */

import { ServicesManager } from '@ohif/core';
import {
  ServiceToolbarButton,
  ToolbarServiceConfig,
  ServiceEventSubscription,
  ToolbarState,
  ToolbarErrorConfig,
  DEFAULT_ERROR_CONFIG
} from '../types/toolbar.types';
import { logToolbar, debounce } from '../utils/toolbarUtils';
import {
  AccessibilityConfig,
  DEFAULT_A11Y_CONFIG,
  createKeyboardNavigationController,
  announceToScreenReader,
  validateAccessibility,
  manageFocus
} from '../utils/accessibilityUtils';

/**
 * Enhanced Toolbar Integration Service with Accessibility Support
 * 
 * Provides comprehensive integration with OHIF services for the enhanced toolbar system,
 * including accessibility compliance, keyboard navigation, and screen reader support.
 */
export class ToolbarIntegrationService {
  private readonly _servicesManager: ServicesManager;
  private readonly _config: ToolbarServiceConfig;
  private readonly _errorConfig: ToolbarErrorConfig;
  private readonly _accessibilityConfig: AccessibilityConfig;

  // Service references
  private _toolbarService: any;
  private _displaySetService: any;
  private _viewportGridService: any;

  // State management
  private _registeredButtons = new Set<string>();
  private _subscriptions: ServiceEventSubscription[] = [];
  private _isInitialized = false;
  private _isDestroyed = false;

  // Accessibility features
  private _keyboardController: any = null;
  private _toolbarElement: HTMLElement | null = null;

  // Debounced refresh function
  private readonly _debouncedRefresh: () => void;

  constructor(
    servicesManager: ServicesManager,
    config: ToolbarServiceConfig = {},
    errorConfig: ToolbarErrorConfig = DEFAULT_ERROR_CONFIG,
    accessibilityConfig: AccessibilityConfig = DEFAULT_A11Y_CONFIG
  ) {
    this._servicesManager = servicesManager;
    this._config = {
      autoRegister: true,
      autoRefresh: true,
      subscribeToEvents: [
        'DISPLAY_SETS_ADDED',
        'DISPLAY_SETS_CHANGED',
        'DISPLAY_SETS_REMOVED',
        'ACTIVE_VIEWPORT_ID_CHANGED',
        'VIEWPORT_DATA_CHANGED'
      ],
      ...config
    };
    this._errorConfig = errorConfig;
    this._accessibilityConfig = accessibilityConfig;

    // Initialize service references
    this._initializeServiceReferences();

    // Create debounced refresh function (250ms delay)
    this._debouncedRefresh = debounce(() => this._performRefresh(), 250);

    logToolbar('info', 'Enhanced ToolbarIntegrationService initialized with accessibility support');
  }

  /**
   * Initialize the toolbar integration service with accessibility features
   */
  public async initialize(): Promise<void> {
    try {
      if (this._isInitialized) {
        logToolbar('warn', 'ToolbarIntegrationService already initialized');
        return;
      }

      if (this._isDestroyed) {
        logToolbar('error', 'Cannot initialize destroyed ToolbarIntegrationService');
        return;
      }

      if (!this._toolbarService) {
        logToolbar('warn', 'ToolbarService not available - enhanced toolbar integration disabled');
        return;
      }

      // Subscribe to service events if auto-refresh is enabled
      if (this._config.autoRefresh) {
        this._subscribeToServices();
      }

      // Initialize accessibility features
      await this._initializeAccessibilityFeatures();
      
      this._isInitialized = true;
      logToolbar('info', 'Enhanced ToolbarIntegrationService initialization complete');
      
      // Announce service readiness to screen readers
      if (this._accessibilityConfig.announceStateChanges) {
        announceToScreenReader('Toolbar accessibility features enabled', 'polite');
      }
      
    } catch (error) {
      logToolbar('error', 'Failed to initialize ToolbarIntegrationService', error);
      throw error;
    }
  }

  /**
   * Initialize accessibility features for the toolbar
   */
  private async _initializeAccessibilityFeatures(): Promise<void> {
    try {
      // Wait for DOM to be ready
      if (typeof document !== 'undefined') {
        await new Promise<void>(resolve => {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => resolve());
          } else {
            resolve();
          }
        });
      }

      // Find toolbar element
      this._toolbarElement = document.querySelector('[data-testid="enhanced-toolbar"]') as HTMLElement;
      
      if (this._toolbarElement && this._accessibilityConfig.enableKeyboardNav) {
        // Initialize keyboard navigation controller
        this._keyboardController = createKeyboardNavigationController(
          this._toolbarElement,
          this._accessibilityConfig
        );
        
        this._keyboardController.activate();
        logToolbar('info', 'Keyboard navigation controller activated');
      }

      // Validate accessibility compliance
      if (this._toolbarElement) {
        const validation = validateAccessibility(this._toolbarElement);
        
        if (!validation.isCompliant) {
          logToolbar('warn', `Accessibility issues detected: ${validation.issues.join(', ')}`);
        } else {
          logToolbar('info', `Accessibility validation passed with score: ${validation.score}%`);
        }
      }

    } catch (error) {
      logToolbar('error', 'Error initializing accessibility features', error);
    }
  }

  /**
   * Register enhanced toolbar buttons with the ToolbarService
   * @param buttons - Array of button definitions
   * @param sectionId - Optional section identifier for grouping
   */
  public registerButtons(buttons: ServiceToolbarButton[], sectionId?: string): void {
    if (!this._validateInitialized() || !Array.isArray(buttons)) {
      return;
    }

    try {
      // Convert our button format to OHIF ToolbarService format
      const toolbarButtons = buttons.map(button => this._convertToOHIFButton(button));

      // Register buttons with the service
      this._toolbarService.register(toolbarButtons, true); // replace existing

      // Track registered buttons
      buttons.forEach(button => {
        this._registeredButtons.add(button.id);
      });

      // Create button section if specified
      if (sectionId) {
        const buttonIds = buttons.map(b => b.id);
        this._toolbarService.updateSection(sectionId, buttonIds);
      }

      logToolbar('info', `Registered ${buttons.length} enhanced toolbar buttons with accessibility support`);

      // Trigger refresh if auto-refresh is enabled
      if (this._config.autoRefresh) {
        this._debouncedRefresh();
      }

      // Re-initialize accessibility features for new buttons
      this._initializeAccessibilityFeatures();

    } catch (error) {
      logToolbar('error', 'Error registering toolbar buttons', error);
      this._handleError(error);
    }
  }

  /**
   * Focus a specific button by ID with accessibility support
   */
  public focusButton(buttonId: string): boolean {
    try {
      if (!this._toolbarElement) {
        logToolbar('warn', 'Toolbar element not found for focus operation');
        return false;
      }

      const button = this._toolbarElement.querySelector(`[data-testid="toolbar-button-${buttonId.toLowerCase()}"]`) as HTMLElement;
      
      if (!button) {
        logToolbar('warn', `Button not found: ${buttonId}`);
        return false;
      }

      // Use keyboard controller if available
      if (this._keyboardController) {
        const buttons = this._toolbarElement.querySelectorAll('[role="button"]:not([aria-disabled="true"])');
        const buttonIndex = Array.from(buttons).indexOf(button);
        
        if (buttonIndex >= 0) {
          this._keyboardController.focusButton(buttonIndex);
          return true;
        }
      }

      // Fallback to direct focus management
      manageFocus(this._toolbarElement, 0);
      return true;

    } catch (error) {
      logToolbar('error', `Error focusing button ${buttonId}`, error);
      return false;
    }
  }

  /**
   * Get accessibility status and compliance information
   */
  public getAccessibilityStatus(): {
    isCompliant: boolean;
    features: string[];
    issues: string[];
    score: number;
  } {
    const features: string[] = [];
    const issues: string[] = [];
    
    // Check enabled features
    if (this._accessibilityConfig.enableKeyboardNav) features.push('Keyboard Navigation');
    if (this._accessibilityConfig.enableScreenReader) features.push('Screen Reader Support');
    if (this._accessibilityConfig.enableFocusManagement) features.push('Focus Management');
    if (this._accessibilityConfig.enableHighContrast) features.push('High Contrast Support');
    
    // Validate toolbar element if available
    let validation = { isCompliant: true, issues: [], score: 100 };
    if (this._toolbarElement) {
      validation = validateAccessibility(this._toolbarElement);
      issues.push(...validation.issues);
    }
    
    return {
      isCompliant: validation.isCompliant,
      features,
      issues,
      score: validation.score
    };
  }

  /**
   * Refresh toolbar state - typically called after viewport or study changes
   * @param refreshProps - Properties to pass to button evaluation functions
   */
  public refreshToolbarState(refreshProps?: any): void {
    if (!this._validateInitialized()) {
      return;
    }

    try {
      this._performRefresh(refreshProps);
    } catch (error) {
      logToolbar('error', 'Error refreshing toolbar state', error);
      this._handleError(error);
    }
  }

  /**
   * Handle toolbar button interactions with accessibility announcements
   * @param interaction - The interaction object from the button
   */
  public handleInteraction(interaction: any): void {
    if (!this._validateInitialized()) {
      return;
    }

    try {
      // Record the interaction with the service
      this._toolbarService.recordInteraction(interaction);
      logToolbar('info', `Interaction handled: ${interaction.itemId || interaction.id}`);

      // Announce interaction to screen readers
      if (this._accessibilityConfig.announceStateChanges) {
        const buttonName = interaction.label || interaction.itemId || interaction.id;
        announceToScreenReader(`${buttonName} activated`, 'polite');
      }

    } catch (error) {
      logToolbar('error', 'Error handling toolbar interaction', error);
      this._handleError(error);
    }
  }

  /**
   * Remove registered buttons from the toolbar
   * @param buttonIds - Array of button IDs to remove
   */
  public removeButtons(buttonIds: string[]): void {
    if (!this._validateInitialized() || !Array.isArray(buttonIds)) {
      return;
    }

    try {
      buttonIds.forEach(buttonId => {
        this._toolbarService.removeButton(buttonId);
        this._registeredButtons.delete(buttonId);
      });

      logToolbar('info', `Removed ${buttonIds.length} toolbar buttons`);

    } catch (error) {
      logToolbar('error', 'Error removing toolbar buttons', error);
      this._handleError(error);
    }
  }

  /**
   * Cleanup and destroy the service
   */
  public destroy(): void {
    if (this._isDestroyed) {
      logToolbar('warn', 'ToolbarIntegrationService already destroyed');
      return;
    }

    try {
      // Unsubscribe from all service events
      this._unsubscribeFromServices();

      // Clear registered buttons
      this._registeredButtons.clear();

      // Reset state
      this._isInitialized = false;
      this._isDestroyed = true;

      // Deactivate keyboard controller
      if (this._keyboardController) {
        this._keyboardController.deactivate();
      }

      // Clear references
      this._keyboardController = null;
      this._toolbarElement = null;

      logToolbar('info', 'ToolbarIntegrationService destroyed successfully');

    } catch (error) {
      logToolbar('error', 'Error destroying ToolbarIntegrationService', error);
    }
  }

  /**
   * Check if a button is currently registered
   * @param buttonId - The button ID to check
   * @returns True if the button is registered
   */
  public isButtonRegistered(buttonId: string): boolean {
    return this._registeredButtons.has(buttonId);
  }

  /**
   * Get current toolbar state
   * @returns Current toolbar state or null if not initialized
   */
  public getToolbarState(): ToolbarState | null {
    if (!this._isInitialized) {
      return null;
    }

    try {
      return this._toolbarService?.getState() || null;
    } catch (error) {
      logToolbar('error', 'Error getting toolbar state', error);
      return null;
    }
  }

  /**
   * Get service status and debugging information
   */
  public getStatus(): {
    isInitialized: boolean;
    isDestroyed: boolean;
    servicesAvailable: {
      toolbarService: boolean;
      displaySetService: boolean;
      viewportGridService: boolean;
    };
    registeredButtonCount: number;
    activeSubscriptions: number;
    accessibilityFeatures: string[];
  } {
    return {
      isInitialized: this._isInitialized,
      isDestroyed: this._isDestroyed,
      servicesAvailable: {
        toolbarService: !!this._toolbarService,
        displaySetService: !!this._displaySetService,
        viewportGridService: !!this._viewportGridService
      },
      registeredButtonCount: this._registeredButtons.size,
      activeSubscriptions: this._subscriptions.length,
      accessibilityFeatures: Object.entries(this._accessibilityConfig)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature)
    };
  }

  // Private Methods

  private _initializeServiceReferences(): void {
    const { services } = this._servicesManager;
    
    this._toolbarService = services.toolbarService;
    this._displaySetService = services.displaySetService;
    this._viewportGridService = services.viewportGridService;

    logToolbar('info', 'Service references initialized', {
      toolbarService: !!this._toolbarService,
      displaySetService: !!this._displaySetService,
      viewportGridService: !!this._viewportGridService
    });
  }

  private _validateInitialized(): boolean {
    if (this._isDestroyed) {
      logToolbar('error', 'ToolbarIntegrationService has been destroyed');
      return false;
    }

    if (!this._isInitialized) {
      logToolbar('error', 'ToolbarIntegrationService not initialized');
      return false;
    }

    if (!this._toolbarService) {
      logToolbar('error', 'ToolbarService not available');
      return false;
    }

    return true;
  }

  private _convertToOHIFButton(button: ServiceToolbarButton): any {
    return {
      id: button.id,
      uiType: button.uiType || 'ohif.splitButton',
      props: {
        ...button.props,
        groupId: button.groupId,
        itemId: button.itemId,
        interactionType: button.interactionType,
        evaluate: this._wrapEvaluateFunction(button.evaluate)
      }
    };
  }

  private _performRefresh(refreshProps?: any): void {
    try {
      if (!this._toolbarService.refresh) {
        logToolbar('warn', 'ToolbarService refresh method not available');
        return;
      }

      this._toolbarService.refresh(refreshProps);
      logToolbar('info', 'Toolbar state refreshed successfully');

      // Re-validate accessibility after refresh
      if (this._toolbarElement) {
        setTimeout(() => {
          const validation = validateAccessibility(this._toolbarElement!);
          if (!validation.isCompliant) {
            logToolbar('warn', `Post-refresh accessibility issues: ${validation.issues.join(', ')}`);
          }
        }, 100);
      }

    } catch (error) {
      logToolbar('error', 'Error performing toolbar refresh', error);
      this._handleError(error);
    }
  }

  private _subscribeToServices(): void {
    try {
      const { services } = this._servicesManager;
      
      // Subscribe to DisplaySetService events
      if (this._displaySetService && this._config.subscribeToEvents.includes('DISPLAY_SETS_ADDED')) {
        this._subscribeToService(this._displaySetService, ['DISPLAY_SETS_ADDED', 'DISPLAY_SETS_CHANGED']);
      }

      // Subscribe to ViewportGridService events  
      if (this._viewportGridService && this._config.subscribeToEvents.includes('ACTIVE_VIEWPORT_ID_CHANGED')) {
        this._subscribeToService(this._viewportGridService, ['ACTIVE_VIEWPORT_ID_CHANGED', 'VIEWPORT_DATA_CHANGED']);
      }

      logToolbar('info', `Subscribed to ${this._subscriptions.length} service events`);

    } catch (error) {
      logToolbar('error', 'Error subscribing to services', error);
    }
  }

  private _subscribeToService(service: any, events: string[]): void {
    try {
      events.forEach(eventName => {
        const callback = (data: unknown) => {
          try {
            logToolbar('debug', `Service event received: ${eventName}`, data);
            
            // Trigger refresh on relevant events
            this._debouncedRefresh();

            // Announce changes to screen readers
            if (this._accessibilityConfig.announceStateChanges) {
              if (eventName.includes('DISPLAY_SETS')) {
                announceToScreenReader('Images updated', 'polite');
              } else if (eventName.includes('VIEWPORT')) {
                announceToScreenReader('Viewport changed', 'polite');
              }
            }

          } catch (error) {
            logToolbar('error', `Error handling service event ${eventName}`, error);
          }
        };

        service.subscribe(eventName, callback);
        
        this._subscriptions.push({
          service,
          events: [eventName],
          callback,
          unsubscribe: () => service.unsubscribe(eventName, callback)
        });
      });

    } catch (error) {
      logToolbar('error', `Error subscribing to service events: ${events.join(', ')}`, error);
    }
  }

  private _unsubscribeFromServices(): void {
    try {
      this._subscriptions.forEach(subscription => {
        if (typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });

      this._subscriptions = [];
      logToolbar('info', 'Unsubscribed from all service events');

    } catch (error) {
      logToolbar('error', 'Error unsubscribing from services', error);
    }
  }

  private _wrapEvaluateFunction(originalEvaluate: Function | undefined): Function | undefined {
    if (!originalEvaluate || typeof originalEvaluate !== 'function') {
      return undefined;
    }

    return (context: any) => {
      try {
        const result = originalEvaluate(context);
        logToolbar('debug', 'Button evaluation completed successfully');
        return result;
      } catch (error) {
        logToolbar('error', 'Error in button evaluation function', error);
        this._handleError(error);
        
        // Return safe fallback result
        return {
          visible: true,
          disabled: false,
          active: false
        };
      }
    };
  }

  private _handleError(error: any): void {
    if (!this._errorConfig.enableRecovery) {
      throw error;
    }

    logToolbar('error', 'Error handled by recovery mechanism', error);

    try {
      if (this._errorConfig.onError && typeof this._errorConfig.onError === 'function') {
        this._errorConfig.onError(error);
      }
    } catch (handlerError) {
      logToolbar('error', 'Error in error handler', handlerError);
    }
  }
}

/**
 * Factory function to create a ToolbarIntegrationService instance
 */
export function createToolbarIntegrationService(
  servicesManager: ServicesManager,
  config?: ToolbarServiceConfig,
  errorConfig?: ToolbarErrorConfig
): ToolbarIntegrationService {
  return new ToolbarIntegrationService(servicesManager, config, errorConfig);
} 