import React from 'react';
import { ValidationResult, ValidationError, ValidationWarning } from '../../../types/hangingProtocol.types';

export interface ValidationErrorDialogProps {
  validationResult: ValidationResult;
  onClose: () => void;
  onFix?: (item: ValidationError | ValidationWarning) => void;
}

/**
 * Validation Error Dialog Component
 * 
 * Displays structured validation errors and warnings for hanging protocols
 * with actionable feedback and optional fix suggestions.
 */
export const ValidationErrorDialog: React.FC<ValidationErrorDialogProps> = ({
  validationResult,
  onClose,
  onFix
}) => {
  const { errors, warnings, isValid } = validationResult;
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  const ErrorIcon = () => (
    <div style={{ color: '#ef4444', fontSize: '20px', marginRight: '8px' }}>⚠️</div>
  );

  const WarningIcon = () => (
    <div style={{ color: '#f59e0b', fontSize: '20px', marginRight: '8px' }}>⚠</div>
  );

  const renderValidationItem = (item: ValidationError | ValidationWarning, type: 'error' | 'warning') => (
    <div 
      key={`${type}-${item.code || Math.random()}`}
      style={{
        padding: '12px',
        marginBottom: '8px',
        border: `1px solid ${type === 'error' ? '#ef4444' : '#f59e0b'}`,
        borderRadius: '4px',
        backgroundColor: type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {type === 'error' ? <ErrorIcon /> : <WarningIcon />}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
            marginBottom: '4px'
          }}>
            {item.message}
          </div>
          {item.field && (
            <div style={{
              fontSize: '12px',
              color: '#a0a0a0',
              marginBottom: '4px'
            }}>
              Field: {item.field}
            </div>
          )}
          {item.code && (
            <div style={{
              fontSize: '12px',
              color: '#5acce6',
              fontStyle: 'italic'
            }}>
              Code: {item.code}
            </div>
          )}
        </div>
        {onFix && (
          <button
            onClick={() => onFix(item)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #5acce6',
              borderRadius: '4px',
              background: 'transparent',
              color: '#5acce6',
              cursor: 'pointer',
              marginLeft: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(90, 204, 230, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Fix
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px', minWidth: '500px', maxWidth: '700px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '20px',
          fontWeight: 600,
          color: '#ffffff'
        }}>
          Protocol Validation {isValid ? 'Warnings' : 'Errors'}
        </h3>
        <div style={{
          fontSize: '14px',
          color: '#a0a0a0'
        }}>
          {hasErrors && (
            <span>{errors.length} error{errors.length !== 1 ? 's' : ''}</span>
          )}
          {hasErrors && hasWarnings && ' • '}
          {hasWarnings && (
            <span>{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ 
        maxHeight: '400px', 
        overflowY: 'auto',
        marginBottom: '20px'
      }}>
        {/* Errors */}
        {hasErrors && (
          <div style={{ marginBottom: hasWarnings ? '16px' : '0' }}>
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: 600,
              color: '#ef4444'
            }}>
              Errors (Must Fix)
            </h4>
            {errors.map(error => renderValidationItem(error, 'error'))}
          </div>
        )}

        {/* Warnings */}
        {hasWarnings && (
          <div>
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: 600,
              color: '#f59e0b'
            }}>
              Warnings (Recommended)
            </h4>
            {warnings.map(warning => renderValidationItem(warning, 'warning'))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div style={{
        padding: '12px',
        backgroundColor: isValid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${isValid ? '#22c55e' : '#ef4444'}`,
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <div style={{
          fontSize: '14px',
          color: isValid ? '#22c55e' : '#ef4444',
          fontWeight: 500
        }}>
          {isValid 
            ? '✓ Protocol is valid and can be saved'
            : '✗ Protocol has errors that must be fixed before saving'
          }
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            border: '1px solid #5acce6',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            minWidth: '80px',
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
          {isValid ? 'Continue' : 'Close'}
        </button>
      </div>
    </div>
  );
};

export default ValidationErrorDialog; 