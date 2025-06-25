import { ServicesManager } from '@ohif/core';
import GlobalPatientHeader from './components/GlobalPatientHeader/GlobalPatientHeader';
import StudyAwareViewport from './components/StudyAwareViewport/StudyAwareViewport';
import { createToolbarIntegrationService, ToolbarIntegrationService } from './services/ToolbarIntegrationService';

// Global instance of toolbar integration service
let toolbarIntegrationService: ToolbarIntegrationService | null = null;

/**
 * Pre-registration hook for the UI Enhancements extension
 * This is where we register custom components and override existing ones
 * 
 * Task 2.4: Enhanced with ToolbarService integration
 */
export default function preRegistration({ 
  servicesManager, 
  appConfig, 
  commandsManager 
}: {
  servicesManager: ServicesManager;
  appConfig: any;
  commandsManager: any;
}) {
  // Initialize toolbar integration service
  try {
    toolbarIntegrationService = createToolbarIntegrationService(servicesManager);
    toolbarIntegrationService.initialize();
    
    // Store reference for other parts of the extension to use
    (global as any).__ohifUIEnhancementsToolbarService = toolbarIntegrationService;
    
    console.log('ToolbarIntegrationService initialized successfully');
  } catch (error) {
    console.error('Failed to initialize ToolbarIntegrationService:', error);
  }

  // Apply custom theme CSS
  const customTheme = document.createElement('style');
  customTheme.textContent = `
    :root {
      /* UI Enhancement Color Palette from PRD */
      --color-primary: #60A5FA;
      --color-background: #111827;
      --color-panel: #1F2937;
      --color-text-primary: #F9FAFB;
      --color-text-secondary: #9CA3AF;
      --color-border: #374151;
      --color-warning: #FACC15;
      --color-success: #22C55E;
      --color-error: #F87171;
    }

    /* Global Patient Header Styles */
    .global-patient-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 48px;
      background: var(--color-panel);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      z-index: 1000;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .patient-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .patient-demographics {
      font-size: 14px;
      color: var(--color-text-secondary);
      display: flex;
      gap: 12px;
    }

    .app-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Enhanced Toolbar Styles (FR-2) */
    .enhanced-toolbar {
      padding-top: 48px; /* Account for patient header */
    }

    .toolbar-button-enlarged {
      width: 40px !important;
      height: 40px !important;
      min-width: 40px !important;
      min-height: 40px !important;
    }

    /* FR-2.3: Toolbar Group Separators - Subtle dividers between tool groups */
    .toolbar-group-separator {
      width: 1px;
      height: 32px;
      background: var(--color-border);
      margin: 0 8px;
      opacity: 0.6;
      flex-shrink: 0;
    }

    /* Toolbar group visual enhancements */
    .enhanced-toolbar [data-group-id="view-tools"],
    .enhanced-toolbar [data-group-id="measurement-tools"],
    .enhanced-toolbar [data-group-id="actions-tools"],
    .enhanced-toolbar [data-group-id="contextual-tools"] {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Enhanced hover states for toolbar buttons */
    .toolbar-button-enlarged:hover {
      background-color: rgba(96, 165, 250, 0.1) !important;
      border-color: rgba(96, 165, 250, 0.3) !important;
      transition: all 0.2s ease-in-out;
    }

    .toolbar-button-enlarged:active,
    .toolbar-button-enlarged[data-active="true"] {
      background-color: rgba(96, 165, 250, 0.2) !important;
      border-color: var(--color-primary) !important;
    }

    /* Study Comparison Highlighting (FR-3) - Enhanced Version */
    .study-aware-viewport {
      position: relative;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 4px;
      overflow: hidden;
    }

    /* Current Study Styling */
    .viewport-current-study {
      border: 3px solid var(--color-primary) !important;
      box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.3), 
                  0 4px 6px -1px rgba(0, 0, 0, 0.4) !important;
      background: linear-gradient(135deg, rgba(96, 165, 250, 0.05) 0%, transparent 50%) !important;
    }

    .viewport-current-study:hover {
      border-color: rgba(96, 165, 250, 0.8) !important;
      box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.4), 
                  0 8px 25px -5px rgba(0, 0, 0, 0.5) !important;
      transform: translateY(-1px);
    }

    /* Prior Study Styling */
    .viewport-prior-study {
      border: 3px solid var(--color-warning) !important;
      box-shadow: 0 0 0 1px rgba(250, 204, 21, 0.3), 
                  0 4px 6px -1px rgba(0, 0, 0, 0.4) !important;
      background: linear-gradient(135deg, rgba(250, 204, 21, 0.05) 0%, transparent 50%) !important;
    }

    .viewport-prior-study:hover {
      border-color: rgba(250, 204, 21, 0.8) !important;
      box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.4), 
                  0 8px 25px -5px rgba(0, 0, 0, 0.5) !important;
      transform: translateY(-1px);
    }

    /* Study Label Overlays */
    .viewport-overlay {
      position: absolute;
      top: 8px;
      left: 8px;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.2;
      z-index: 100;
      pointer-events: none;
      transition: all 0.2s ease-in-out;
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .viewport-overlay-current {
      background: rgba(17, 24, 39, 0.85);
      color: var(--color-primary) !important;
      border-color: rgba(96, 165, 250, 0.3);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }

    .viewport-overlay-prior {
      background: rgba(17, 24, 39, 0.85);
      color: var(--color-warning) !important;
      border-color: rgba(250, 204, 21, 0.3);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }

    /* Animation for study type changes */
    .study-aware-viewport[data-study-type-changed="true"] {
      animation: studyTypeChange 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes studyTypeChange {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }

    /* Focus indicators for accessibility */
    .study-aware-viewport:focus-within {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .viewport-current-study {
        border-width: 4px !important;
      }
      
      .viewport-prior-study {
        border-width: 4px !important;
      }
      
      .viewport-overlay {
        background: rgba(0, 0, 0, 0.95) !important;
        border-width: 2px !important;
      }

      .toolbar-group-separator {
        opacity: 1;
        background: var(--color-text-secondary);
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .study-aware-viewport,
      .viewport-overlay {
        transition: none !important;
      }
      
      .viewport-current-study:hover,
      .viewport-prior-study:hover {
        transform: none !important;
      }
      
      .study-aware-viewport[data-study-type-changed="true"] {
        animation: none !important;
      }

      .toolbar-button-enlarged {
        transition: none !important;
      }
    }

    /* Dark mode optimizations */
    @media (prefers-color-scheme: dark) {
      .viewport-overlay {
        backdrop-filter: blur(6px);
      }
    }

    /* Touch device optimizations */
    @media (hover: none) and (pointer: coarse) {
      .viewport-current-study:hover,
      .viewport-prior-study:hover {
        transform: none;
        box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.3), 
                    0 4px 6px -1px rgba(0, 0, 0, 0.4) !important;
      }

      .toolbar-button-enlarged:hover {
        background-color: transparent !important;
      }
    }

    /* Multi-viewport grid integration */
    .viewport-grid .study-aware-viewport {
      margin: 2px;
    }

    .viewport-grid .study-aware-viewport:first-child {
      margin-left: 0;
    }

    .viewport-grid .study-aware-viewport:last-child {
      margin-right: 0;
    }

    /* Large screen optimizations */
    @media (min-width: 1200px) {
      .viewport-overlay {
        font-size: 12px;
        padding: 8px 12px;
      }
    }

    /* Small screen optimizations */
    @media (max-width: 768px) {
      .viewport-overlay {
        font-size: 10px;
        padding: 4px 6px;
        top: 4px;
        left: 4px;
      }
      
      .viewport-current-study,
      .viewport-prior-study {
        border-width: 2px !important;
      }

      .toolbar-group-separator {
        height: 24px;
        margin: 0 4px;
      }
    }
  `;
  document.head.appendChild(customTheme);

  // Register components with OHIF's component registry
  // Note: Component registration would typically be handled through 
  // the getCustomizationModule or other appropriate extension hooks
  console.log('Registering UI Enhancement components...');
  
  // Components will be available through the customization module
  // and can be used in app configuration

  console.log('UI Enhancements Extension pre-registration completed');
}

/**
 * Extension cleanup function
 * Called when the extension is being destroyed or mode is changed
 */
export function onModeExit() {
  try {
    if (toolbarIntegrationService) {
      toolbarIntegrationService.destroy();
      toolbarIntegrationService = null;
      (global as any).__ohifUIEnhancementsToolbarService = null;
      console.log('ToolbarIntegrationService cleaned up');
    }
  } catch (error) {
    console.error('Error during extension cleanup:', error);
  }
}

/**
 * Get the current toolbar integration service instance
 * @returns ToolbarIntegrationService instance or null if not initialized
 */
export function getToolbarIntegrationService(): ToolbarIntegrationService | null {
  return toolbarIntegrationService;
} 