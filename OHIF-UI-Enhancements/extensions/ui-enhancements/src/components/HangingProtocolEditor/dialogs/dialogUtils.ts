import { ConfirmationDialog, ConfirmationDialogProps } from './ConfirmationDialog';
import { ValidationErrorDialog, ValidationErrorDialogProps } from './ValidationErrorDialog';
import { UnsavedChangesDialog, UnsavedChangesDialogProps } from './UnsavedChangesDialog';
import { ValidationResult } from '../../../types/hangingProtocol.types';

/**
 * Dialog utility functions for UIDialogService integration
 * 
 * These utilities provide promise-based interfaces for showing dialogs
 * with consistent behavior and styling throughout the Hanging Protocol Editor.
 */

export interface DialogResponse {
  action: 'confirm' | 'cancel' | 'save' | 'discard';
  data?: any;
}

/**
 * Show a confirmation dialog using UIDialogService
 */
export function createConfirmationDialog(
  uiDialogService: any,
  options: Omit<ConfirmationDialogProps, 'onConfirm' | 'onCancel'>
): Promise<DialogResponse> {
  return new Promise((resolve) => {
    const dialogId = `confirmation-dialog-${Date.now()}`;

    uiDialogService.show({
      id: dialogId,
      title: options.title || 'Confirm Action',
      content: ConfirmationDialog,
      shouldCloseOnEsc: true,
      contentProps: {
        ...options,
        onConfirm: () => {
          uiDialogService.hide(dialogId);
          resolve({ action: 'confirm' });
        },
        onCancel: () => {
          uiDialogService.hide(dialogId);
          resolve({ action: 'cancel' });
        }
      }
    });
  });
}

/**
 * Show a validation error dialog using UIDialogService
 */
export function createValidationErrorDialog(
  uiDialogService: any,
  validationResult: ValidationResult,
  onFix?: (item: any) => void
): Promise<DialogResponse> {
  return new Promise((resolve) => {
    const dialogId = `validation-error-dialog-${Date.now()}`;

    uiDialogService.show({
      id: dialogId,
      title: validationResult.isValid ? 'Protocol Warnings' : 'Protocol Validation Errors',
      content: ValidationErrorDialog,
      shouldCloseOnEsc: true,
      contentProps: {
        validationResult,
        onFix,
        onClose: () => {
          uiDialogService.hide(dialogId);
          resolve({ action: 'cancel' });
        }
      }
    });
  });
}

/**
 * Show an unsaved changes dialog using UIDialogService
 */
export function createUnsavedChangesDialog(
  uiDialogService: any,
  protocolName: string
): Promise<DialogResponse> {
  return new Promise((resolve) => {
    const dialogId = `unsaved-changes-dialog-${Date.now()}`;

    uiDialogService.show({
      id: dialogId,
      title: 'Unsaved Changes',
      content: UnsavedChangesDialog,
      shouldCloseOnEsc: false, // Prevent accidental dismissal
      contentProps: {
        protocolName,
        onSave: () => {
          uiDialogService.hide(dialogId);
          resolve({ action: 'save' });
        },
        onDiscard: () => {
          uiDialogService.hide(dialogId);
          resolve({ action: 'discard' });
        },
        onCancel: () => {
          uiDialogService.hide(dialogId);
          resolve({ action: 'cancel' });
        }
      }
    });
  });
}

/**
 * Show a simple confirmation dialog with custom message
 */
export function createSimpleConfirmDialog(
  uiDialogService: any,
  message: string,
  title: string = 'Confirm',
  confirmText: string = 'Yes',
  cancelText: string = 'No',
  variant: 'primary' | 'danger' = 'primary'
): Promise<boolean> {
  return new Promise(async (resolve) => {
    const result = await createConfirmationDialog(uiDialogService, {
      title,
      message,
      confirmText,
      cancelText,
      confirmVariant: variant
    });
    
    resolve(result.action === 'confirm');
  });
}

/**
 * Show a deletion confirmation dialog
 */
export function createDeleteConfirmDialog(
  uiDialogService: any,
  itemName: string,
  itemType: string = 'item'
): Promise<boolean> {
  return createSimpleConfirmDialog(
    uiDialogService,
    `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    `Delete ${itemType}`,
    'Delete',
    'Cancel',
    'danger'
  );
}

/**
 * Dialog constants for consistent behavior
 */
export const DIALOG_ACTIONS = {
  CONFIRM: 'confirm' as const,
  CANCEL: 'cancel' as const,
  SAVE: 'save' as const,
  DISCARD: 'discard' as const
};

/**
 * Dialog configuration presets
 */
export const DIALOG_PRESETS = {
  DELETE_PROTOCOL: {
    title: 'Delete Hanging Protocol',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    confirmVariant: 'danger' as const
  },
  VALIDATION_ERROR: {
    title: 'Protocol Validation',
    confirmText: 'Fix Issues',
    cancelText: 'Close',
    confirmVariant: 'primary' as const
  },
  UNSAVED_CHANGES: {
    title: 'Unsaved Changes',
    confirmText: 'Save Changes',
    cancelText: 'Cancel',
    confirmVariant: 'primary' as const
  }
}; 