/**
 * Accessibility Utility Functions for Enhanced Toolbar
 * 
 * Provides comprehensive accessibility support for the OHIF UI Enhancements
 * enhanced toolbar system, ensuring WCAG 2.1 AA compliance and screen reader compatibility.
 * 
 * Task 2.8: Accessibility Compliance Implementation
 */

import { ToolbarGroupId, OHIFContext } from '../types/toolbar.types';
import { logToolbar } from './toolbarUtils';

/**
 * ARIA role definitions for toolbar elements
 */
export const ARIA_ROLES = {
  TOOLBAR: 'toolbar',
  BUTTON: 'button',
  SEPARATOR: 'separator',
  GROUP: 'group'
} as const;

/**
 * Keyboard navigation key codes
 */
export const KEYBOARD_KEYS = {
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_UP: 'ArrowUp', 
  ARROW_DOWN: 'ArrowDown',
  HOME: 'Home',
  END: 'End',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab'
} as const;

/**
 * Accessibility configuration interface
 */
export interface AccessibilityConfig {
  /** Enable keyboard navigation */
  enableKeyboardNav?: boolean;
  /** Enable screen reader announcements */
  enableScreenReader?: boolean;
  /** Enable focus management */
  enableFocusManagement?: boolean;
  /** Enable high contrast support */
  enableHighContrast?: boolean;
  /** Announce state changes */
  announceStateChanges?: boolean;
}

/**
 * Default accessibility configuration
 */
export const DEFAULT_A11Y_CONFIG: AccessibilityConfig = {
  enableKeyboardNav: true,
  enableScreenReader: true,
  enableFocusManagement: true,
  enableHighContrast: true,
  announceStateChanges: true
};

/**
 * Creates accessible ARIA attributes for toolbar buttons
 * 
 * @param config - Button configuration object
 * @returns Object containing ARIA attributes
 */
export function createButtonAriaAttributes(config: {
  id: string;
  label: string;
  description?: string;
  groupId: ToolbarGroupId;
  isPressed?: boolean;
  isDisabled?: boolean;
  hasPopup?: boolean;
  controlsId?: string;
}): Record<string, string | boolean | undefined> {
  const groupLabels: Record<ToolbarGroupId, string> = {
    'view-tools': 'View Tools',
    'measurement-tools': 'Measurement Tools',
    'actions-tools': 'Action Tools',
    'contextual-tools': 'Contextual Tools'
  };

  return {
    'role': ARIA_ROLES.BUTTON,
    'aria-label': config.label,
    'aria-describedby': config.description ? `${config.id}-description` : undefined,
    'aria-pressed': config.isPressed !== undefined ? config.isPressed : undefined,
    'aria-disabled': config.isDisabled || false,
    'aria-haspopup': config.hasPopup || false,
    'aria-controls': config.controlsId,
    'aria-group': groupLabels[config.groupId],
    'data-group-id': config.groupId,
    'data-testid': `toolbar-button-${config.id.toLowerCase()}`
  };
}

/**
 * Creates accessible ARIA attributes for toolbar container
 * 
 * @param config - Toolbar configuration
 * @returns Object containing ARIA attributes
 */
export function createToolbarAriaAttributes(config: {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
}): Record<string, string> {
  return {
    'role': ARIA_ROLES.TOOLBAR,
    'aria-label': config.label || 'Enhanced Medical Imaging Toolbar',
    'aria-orientation': config.orientation || 'horizontal',
    'data-testid': 'enhanced-toolbar'
  };
}

/**
 * Creates accessible ARIA attributes for group separators
 * 
 * @param groupName - Name of the group being separated
 * @returns Object containing ARIA attributes
 */
export function createSeparatorAriaAttributes(groupName: string): Record<string, string> {
  return {
    'role': ARIA_ROLES.SEPARATOR,
    'aria-label': `${groupName} separator`,
    'aria-orientation': 'vertical',
    'data-testid': `separator-${groupName.toLowerCase().replace(/\s+/g, '-')}`
  };
}

/**
 * Generates contextual tooltip text for toolbar buttons
 * 
 * @param config - Button configuration
 * @param context - Optional OHIF context for dynamic content
 * @returns Accessible tooltip text
 */
export function generateAccessibleTooltip(config: {
  baseName: string;
  action?: string;
  shortcut?: string;
  groupId: ToolbarGroupId;
  isDisabled?: boolean;
  disabledReason?: string;
}, context?: OHIFContext): string {
  const groupDescriptions: Record<ToolbarGroupId, string> = {
    'view-tools': 'viewport display',
    'measurement-tools': 'image measurement',
    'actions-tools': 'image manipulation',
    'contextual-tools': 'specialized imaging'
  };

  let tooltip = config.baseName;

  // Add action description
  if (config.action) {
    tooltip += ` - ${config.action}`;
  }

  // Add group context
  tooltip += ` (${groupDescriptions[config.groupId]} tool)`;

  // Add keyboard shortcut if available
  if (config.shortcut) {
    tooltip += `. Keyboard shortcut: ${config.shortcut}`;
  }

  // Add disabled state information
  if (config.isDisabled) {
    tooltip += '. Currently disabled';
    if (config.disabledReason) {
      tooltip += `: ${config.disabledReason}`;
    }
  }

  // Add contextual information if available
  if (context) {
    const displaySetInfo = extractContextualInfo(context);
    if (displaySetInfo.modalityInfo) {
      tooltip += `. Available for: ${displaySetInfo.modalityInfo}`;
    }
  }

  return tooltip;
}

/**
 * Handles keyboard navigation for toolbar buttons
 * 
 * @param event - Keyboard event
 * @param currentIndex - Current button index
 * @param totalButtons - Total number of buttons
 * @param onNavigate - Callback for navigation
 * @param onActivate - Callback for activation
 */
export function handleToolbarKeyboardNavigation(
  event: KeyboardEvent,
  currentIndex: number,
  totalButtons: number,
  onNavigate: (newIndex: number) => void,
  onActivate: () => void
): void {
  let handled = false;
  
  switch (event.key) {
    case KEYBOARD_KEYS.ARROW_LEFT:
    case KEYBOARD_KEYS.ARROW_UP:
      // Move to previous button (circular)
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : totalButtons - 1;
      onNavigate(prevIndex);
      handled = true;
      break;
      
    case KEYBOARD_KEYS.ARROW_RIGHT:
    case KEYBOARD_KEYS.ARROW_DOWN:
      // Move to next button (circular)
      const nextIndex = currentIndex < totalButtons - 1 ? currentIndex + 1 : 0;
      onNavigate(nextIndex);
      handled = true;
      break;
      
    case KEYBOARD_KEYS.HOME:
      // Move to first button
      onNavigate(0);
      handled = true;
      break;
      
    case KEYBOARD_KEYS.END:
      // Move to last button
      onNavigate(totalButtons - 1);
      handled = true;
      break;
      
    case KEYBOARD_KEYS.ENTER:
    case KEYBOARD_KEYS.SPACE:
      // Activate current button
      onActivate();
      handled = true;
      break;
  }
  
  if (handled) {
    event.preventDefault();
    event.stopPropagation();
  }
}

/**
 * Manages focus for toolbar elements
 * 
 * @param toolbarElement - Toolbar container element
 * @param buttonIndex - Index of button to focus
 */
export function manageFocus(toolbarElement: HTMLElement, buttonIndex: number): void {
  try {
    const buttons = toolbarElement.querySelectorAll('[role="button"]:not([aria-disabled="true"])');
    
    if (buttons.length === 0) {
      logToolbar('warn', 'No focusable buttons found in toolbar');
      return;
    }
    
    // Ensure button index is within bounds
    const safeIndex = Math.max(0, Math.min(buttonIndex, buttons.length - 1));
    const targetButton = buttons[safeIndex] as HTMLElement;
    
    if (targetButton) {
      // Remove tabindex from all buttons
      buttons.forEach(button => {
        (button as HTMLElement).setAttribute('tabindex', '-1');
      });
      
      // Set tabindex and focus on target button
      targetButton.setAttribute('tabindex', '0');
      targetButton.focus();
      
      logToolbar('info', `Focus moved to button at index ${safeIndex}`);
    }
  } catch (error) {
    logToolbar('error', 'Error managing toolbar focus', error);
  }
}

/**
 * Announces state changes to screen readers
 * 
 * @param message - Message to announce
 * @param priority - Announcement priority level
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  try {
    // Create or get existing announcement element
    let announcer = document.getElementById('toolbar-screen-reader-announcer');
    
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'toolbar-screen-reader-announcer';
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      document.body.appendChild(announcer);
    }
    
    // Update the aria-live region
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (announcer) {
        announcer.textContent = '';
      }
    }, 1000);
    
    logToolbar('info', `Screen reader announcement: ${message}`);
  } catch (error) {
    logToolbar('error', 'Error announcing to screen reader', error);
  }
}

/**
 * Checks if user prefers reduced motion
 * 
 * @returns true if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Checks if user prefers high contrast
 * 
 * @returns true if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Creates a keyboard navigation controller for the toolbar
 * 
 * @param toolbarElement - Toolbar container element
 * @param config - Accessibility configuration
 * @returns Controller object with navigation methods
 */
export function createKeyboardNavigationController(
  toolbarElement: HTMLElement,
  config: AccessibilityConfig = DEFAULT_A11Y_CONFIG
) {
  let currentFocusIndex = 0;
  let isActive = false;
  
  const getButtons = () => {
    return Array.from(toolbarElement.querySelectorAll('[role="button"]:not([aria-disabled="true"])')) as HTMLElement[];
  };
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive || !config.enableKeyboardNav) return;
    
    const buttons = getButtons();
    if (buttons.length === 0) return;
    
    handleToolbarKeyboardNavigation(
      event,
      currentFocusIndex,
      buttons.length,
      (newIndex) => {
        currentFocusIndex = newIndex;
        manageFocus(toolbarElement, newIndex);
        
        if (config.announceStateChanges) {
          const button = buttons[newIndex];
          const label = button.getAttribute('aria-label') || button.textContent || 'button';
          announceToScreenReader(`Focused: ${label}`);
        }
      },
      () => {
        const button = buttons[currentFocusIndex];
        if (button) {
          button.click();
          
          if (config.announceStateChanges) {
            const label = button.getAttribute('aria-label') || button.textContent || 'button';
            announceToScreenReader(`Activated: ${label}`);
          }
        }
      }
    );
  };
  
  const activate = () => {
    if (isActive) return;
    
    isActive = true;
    toolbarElement.addEventListener('keydown', handleKeyDown);
    
    // Set initial focus
    const buttons = getButtons();
    if (buttons.length > 0) {
      manageFocus(toolbarElement, 0);
    }
    
    logToolbar('info', 'Keyboard navigation controller activated');
  };
  
  const deactivate = () => {
    if (!isActive) return;
    
    isActive = false;
    toolbarElement.removeEventListener('keydown', handleKeyDown);
    
    logToolbar('info', 'Keyboard navigation controller deactivated');
  };
  
  const focusButton = (index: number) => {
    const buttons = getButtons();
    if (index >= 0 && index < buttons.length) {
      currentFocusIndex = index;
      manageFocus(toolbarElement, index);
    }
  };
  
  return {
    activate,
    deactivate,
    focusButton,
    getCurrentIndex: () => currentFocusIndex,
    getButtonCount: () => getButtons().length,
    isActive: () => isActive
  };
}

/**
 * Validates accessibility compliance for toolbar elements
 * 
 * @param toolbarElement - Toolbar container element
 * @returns Validation results with issues and recommendations
 */
export function validateAccessibility(toolbarElement: HTMLElement): {
  isCompliant: boolean;
  issues: string[];
  recommendations: string[];
  score: number;
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check toolbar role
  if (toolbarElement.getAttribute('role') !== ARIA_ROLES.TOOLBAR) {
    issues.push('Toolbar missing required role="toolbar" attribute');
  }
  
  // Check aria-label
  if (!toolbarElement.getAttribute('aria-label')) {
    issues.push('Toolbar missing aria-label attribute');
  }
  
  // Check buttons
  const buttons = toolbarElement.querySelectorAll('[role="button"]');
  buttons.forEach((button, index) => {
    const label = button.getAttribute('aria-label');
    if (!label) {
      issues.push(`Button ${index + 1} missing aria-label attribute`);
    }
    
    const tabindex = button.getAttribute('tabindex');
    if (index === 0 && tabindex !== '0') {
      issues.push('First button should have tabindex="0"');
    } else if (index > 0 && tabindex !== '-1') {
      recommendations.push(`Button ${index + 1} should have tabindex="-1" for keyboard navigation`);
    }
  });
  
  // Check separators
  const separators = toolbarElement.querySelectorAll('[role="separator"]');
  separators.forEach((separator, index) => {
    if (!separator.getAttribute('aria-label')) {
      recommendations.push(`Separator ${index + 1} should have aria-label for better screen reader support`);
    }
  });
  
  // Calculate compliance score
  const totalChecks = 4 + buttons.length * 2 + separators.length;
  const failedChecks = issues.length;
  const score = Math.max(0, Math.round(((totalChecks - failedChecks) / totalChecks) * 100));
  
  return {
    isCompliant: issues.length === 0,
    issues,
    recommendations,
    score
  };
}

/**
 * Extracts contextual information for accessibility descriptions
 * @private
 */
function extractContextualInfo(context: OHIFContext): {
  modalityInfo?: string;
  studyInfo?: string;
} {
  try {
    const { DisplaySetService } = context.services;
    const displaySets = DisplaySetService?.getActiveDisplaySets?.() || [];
    
    const modalities = [...new Set(displaySets.map((ds: any) => ds.Modality).filter(Boolean))];
    
    return {
      modalityInfo: modalities.length > 0 ? modalities.join(', ') : undefined,
      studyInfo: displaySets.length > 0 ? `${displaySets.length} series` : undefined
    };
  } catch (error) {
    logToolbar('warn', 'Error extracting contextual info for accessibility', error);
    return {};
  }
} 