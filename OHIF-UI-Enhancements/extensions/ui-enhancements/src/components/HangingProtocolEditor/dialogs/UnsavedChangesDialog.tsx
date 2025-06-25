import React from 'react';

export interface UnsavedChangesDialogProps {
  protocolName: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

/**
 * Unsaved Changes Dialog Component
 * 
 * Prompts user when they attempt to navigate away from a protocol
 * with unsaved changes, offering save, discard, or cancel options.
 */
export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  protocolName,
  onSave,
  onDiscard,
  onCancel
}) => {
  const WarningIcon = () => (
    <div style={{ 
      color: '#f59e0b', 
      fontSize: '48px', 
      textAlign: 'center' as const, 
      marginBottom: '16px' 
    }}>
      ⚠️
    </div>
  );

  return (
    <div style={{ padding: '32px', minWidth: '450px', maxWidth: '550px', textAlign: 'center' as const }}>
      <WarningIcon />
      
      <h3 style={{
        margin: '0 0 12px 0',
        fontSize: '20px',
        fontWeight: 600,
        color: '#ffffff'
      }}>
        Unsaved Changes
      </h3>
      
      <p style={{
        margin: '0 0 24px 0',
        fontSize: '16px',
        lineHeight: 1.5,
        color: '#a0a0a0'
      }}>
        You have unsaved changes to <strong style={{ color: '#ffffff' }}>"{protocolName}"</strong>. 
        <br />
        What would you like to do?
      </p>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '12px',
        flexWrap: 'wrap' as const
      }}>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            border: '1px solid #404040',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            minWidth: '100px',
            background: 'transparent',
            color: '#a0a0a0',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2a2a2a';
            e.currentTarget.style.borderColor = '#505050';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = '#404040';
            e.currentTarget.style.color = '#a0a0a0';
          }}
        >
          Cancel
        </button>

        <button
          onClick={onDiscard}
          style={{
            padding: '10px 20px',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            minWidth: '100px',
            background: 'transparent',
            color: '#ef4444',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#ef4444';
          }}
        >
          Discard Changes
        </button>

        <button
          onClick={onSave}
          style={{
            padding: '10px 20px',
            border: '1px solid #5acce6',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            minWidth: '100px',
            background: '#5acce6',
            color: '#000000',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4bb8d6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#5acce6';
          }}
        >
          Save & Continue
        </button>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid #f59e0b',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#f59e0b'
      }}>
        💡 <strong>Tip:</strong> Save your work regularly to avoid losing changes
      </div>
    </div>
  );
};

export default UnsavedChangesDialog; 