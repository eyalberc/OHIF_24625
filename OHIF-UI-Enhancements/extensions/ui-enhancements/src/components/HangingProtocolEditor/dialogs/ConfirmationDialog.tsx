import React from 'react';

export interface ConfirmationDialogProps {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  icon?: React.ReactNode;
}

/**
 * Reusable Confirmation Dialog Component
 * 
 * A standardized confirmation dialog that follows OHIF design patterns
 * for use with UIDialogService in the Hanging Protocol Editor.
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  icon
}) => {
  return (
    <div style={{ padding: '24px', minWidth: '400px', maxWidth: '500px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
        {icon && (
          <div style={{ 
            flexShrink: 0, 
            color: '#f59e0b', 
            fontSize: '24px' 
          }}>
            {icon}
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#ffffff' 
          }}>
            {title}
          </h3>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            lineHeight: 1.5, 
            color: '#a0a0a0' 
          }}>
            {message}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button 
          onClick={onCancel}
          type="button"
          style={{
            padding: '8px 16px',
            border: '1px solid #404040',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            minWidth: '80px',
            background: 'transparent',
            color: '#a0a0a0',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2a2a2a';
            e.currentTarget.style.borderColor = '#505050';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = '#404040';
          }}
        >
          {cancelText}
        </button>
        <button 
          onClick={onConfirm}
          type="button"
          style={{
            padding: '8px 16px',
            border: '1px solid transparent',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            minWidth: '80px',
            background: confirmVariant === 'danger' ? '#ef4444' : '#5acce6',
            color: confirmVariant === 'danger' ? '#ffffff' : '#000000',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (confirmVariant === 'danger') {
              e.currentTarget.style.background = '#dc2626';
            } else {
              e.currentTarget.style.background = '#4bb8d6';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = confirmVariant === 'danger' ? '#ef4444' : '#5acce6';
          }}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationDialog; 