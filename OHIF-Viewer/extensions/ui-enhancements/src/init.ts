import { ServicesManager } from '@ohif/core';
import GlobalPatientHeader from './components/GlobalPatientHeader/GlobalPatientHeader';
import StudyAwareViewport from './components/StudyAwareViewport/StudyAwareViewport';

/**
 * Pre-registration hook for the UI Enhancements extension
 * This is where we register custom components and override existing ones
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

    /* Study Comparison Highlighting (FR-3) */
    .viewport-current-study {
      border: 2px solid var(--color-primary) !important;
    }

    .viewport-prior-study {
      border: 2px solid var(--color-warning) !important;
    }

    .viewport-overlay-current {
      color: var(--color-primary) !important;
    }

    .viewport-overlay-prior {
      color: var(--color-warning) !important;
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