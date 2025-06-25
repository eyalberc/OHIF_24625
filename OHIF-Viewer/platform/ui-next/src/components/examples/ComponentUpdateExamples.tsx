/**
 * Component Update Examples
 * 
 * Task 6.6: Update Component Library - Practical Examples
 * 
 * These examples show before/after implementations of components
 * updated to use the PRD color palette consistently
 */

import React from 'react';

/**
 * ❌ BEFORE: Button with hardcoded colors
 */
export const ButtonBefore = ({ children, variant = 'primary' }) => {
  const styles = {
    primary: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      border: 'none'
    },
    secondary: {
      backgroundColor: '#6b7280',
      color: '#ffffff',
      border: 'none'
    },
    danger: {
      backgroundColor: '#ef4444',
      color: '#ffffff',
      border: 'none'
    }
  };

  return (
    <button 
      style={{
        ...styles[variant],
        padding: '8px 16px',
        borderRadius: '6px',
        fontWeight: '500'
      }}
    >
      {children}
    </button>
  );
};

/**
 * ✅ AFTER: Button using PRD color system
 */
export const ButtonAfter = ({ children, variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80', 
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground'
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * ❌ BEFORE: Status Alert with hardcoded colors
 */
export const StatusAlertBefore = ({ type, children }) => {
  const alertStyles = {
    error: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5',
      padding: '12px',
      borderRadius: '6px'
    },
    warning: {
      backgroundColor: '#fef3c7',
      color: '#92400e', 
      border: '1px solid #fcd34d',
      padding: '12px',
      borderRadius: '6px'
    },
    success: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      border: '1px solid #86efac',
      padding: '12px',
      borderRadius: '6px'
    }
  };

  return (
    <div style={alertStyles[type]}>
      {children}
    </div>
  );
};

/**
 * ✅ AFTER: Status Alert using PRD color system
 */
export const StatusAlertAfter = ({ type, children, className = '' }) => {
  const baseClasses = 'p-3 rounded-lg border';
  
  const typeClasses = {
    error: 'bg-error-bg text-error-text border-error-border',
    warning: 'bg-warning-bg text-warning-text border-warning-border',
    success: 'bg-success-bg text-success-text border-success-border',
    info: 'bg-info-bg text-info-text border-info-border'
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      {children}
    </div>
  );
};

/**
 * ❌ BEFORE: Medical Panel with hardcoded styling
 */
export const MedicalPanelBefore = ({ title, children }) => {
  return (
    <div style={{
      backgroundColor: '#1f2937',
      border: '1px solid #374151',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <h3 style={{ 
        color: '#f9fafb', 
        fontSize: '18px', 
        fontWeight: '600',
        marginBottom: '12px'
      }}>
        {title}
      </h3>
      <div style={{ color: '#d1d5db' }}>
        {children}
      </div>
    </div>
  );
};

/**
 * ✅ AFTER: Medical Panel using PRD color system
 */
export const MedicalPanelAfter = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-prd-panel border border-prd-border rounded-lg p-4 ${className}`}>
      <h3 className="text-prd-text-primary text-lg font-semibold mb-3">
        {title}
      </h3>
      <div className="text-prd-text-secondary">
        {children}
      </div>
    </div>
  );
};

/**
 * ❌ BEFORE: Study Browser Item with mixed color approaches
 */
export const StudyBrowserItemBefore = ({ study, isSelected, onClick }) => {
  const itemStyle = {
    backgroundColor: isSelected ? '#3b82f6' : '#ffffff',
    color: isSelected ? '#ffffff' : '#000000',
    border: isSelected ? '2px solid #1d4ed8' : '1px solid #e5e7eb',
    padding: '12px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '8px'
  };

  return (
    <div style={itemStyle} onClick={onClick}>
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
        {study.patientName}
      </div>
      <div style={{ 
        fontSize: '14px', 
        color: isSelected ? '#e0e7ff' : '#6b7280' 
      }}>
        {study.studyDate} • {study.modality}
      </div>
    </div>
  );
};

/**
 * ✅ AFTER: Study Browser Item using PRD color system
 */
export const StudyBrowserItemAfter = ({ study, isSelected, onClick, className = '' }) => {
  const baseClasses = 'p-3 rounded-lg cursor-pointer mb-2 transition-colors';
  const selectionClasses = isSelected 
    ? 'bg-primary text-primary-foreground border-primary' 
    : 'bg-card text-card-foreground border-border hover:bg-accent hover:text-accent-foreground';

  return (
    <div 
      className={`${baseClasses} ${selectionClasses} border ${className}`}
      onClick={onClick}
    >
      <div className="font-semibold mb-1">
        {study.patientName}
      </div>
      <div className={`text-sm ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
        {study.studyDate} • {study.modality}
      </div>
    </div>
  );
};

/**
 * ❌ BEFORE: Toolbar with inconsistent styling
 */
export const ToolbarBefore = ({ tools }) => {
  return (
    <div style={{
      backgroundColor: '#111827',
      padding: '8px 12px',
      borderBottom: '1px solid #374151',
      display: 'flex',
      gap: '8px'
    }}>
      {tools.map((tool, index) => (
        <button
          key={index}
          style={{
            backgroundColor: tool.active ? '#3b82f6' : 'transparent',
            color: tool.active ? '#ffffff' : '#d1d5db',
            border: '1px solid #4b5563',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={tool.onClick}
        >
          {tool.icon} {tool.label}
        </button>
      ))}
    </div>
  );
};

/**
 * ✅ AFTER: Toolbar using PRD color system
 */
export const ToolbarAfter = ({ tools, className = '' }) => {
  return (
    <div className={`bg-prd-background border-b border-prd-border p-2 flex gap-2 ${className}`}>
      {tools.map((tool, index) => (
        <button
          key={index}
          className={`
            px-3 py-1.5 rounded border transition-colors
            ${tool.active 
              ? 'bg-primary text-primary-foreground border-primary' 
              : 'bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground'
            }
          `}
          onClick={tool.onClick}
        >
          {tool.icon} {tool.label}
        </button>
      ))}
    </div>
  );
};

/**
 * Demo showcasing all updated components
 */
export const ComponentShowcase = () => {
  const mockStudy = {
    patientName: 'John Doe',
    studyDate: '2024-06-25',
    modality: 'CT'
  };

  const mockTools = [
    { label: 'Pan', icon: '📐', active: true, onClick: () => {} },
    { label: 'Zoom', icon: '🔍', active: false, onClick: () => {} },
    { label: 'Measure', icon: '📏', active: false, onClick: () => {} }
  ];

  return (
    <div className="p-6 bg-background text-foreground space-y-6">
      <h2 className="text-2xl font-bold text-prd-text-primary mb-4">
        Updated Component Examples
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buttons */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Buttons</h3>
          <div className="space-y-2">
            <ButtonAfter variant="primary">Primary Action</ButtonAfter>
            <ButtonAfter variant="secondary">Secondary Action</ButtonAfter>
            <ButtonAfter variant="destructive">Delete</ButtonAfter>
            <ButtonAfter variant="outline">Cancel</ButtonAfter>
          </div>
        </div>

        {/* Status Alerts */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Status Alerts</h3>
          <div className="space-y-2">
            <StatusAlertAfter type="success">Study loaded successfully</StatusAlertAfter>
            <StatusAlertAfter type="warning">Large study detected</StatusAlertAfter>
            <StatusAlertAfter type="error">Failed to load DICOM data</StatusAlertAfter>
          </div>
        </div>

        {/* Medical Panel */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Medical Panel</h3>
          <MedicalPanelAfter title="Patient Information">
            <p>Patient ID: 12345</p>
            <p>Study Date: 2024-06-25</p>
            <p>Modality: CT Chest</p>
          </MedicalPanelAfter>
        </div>

        {/* Study Browser Item */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Study Browser</h3>
          <div className="space-y-2">
            <StudyBrowserItemAfter study={mockStudy} isSelected={true} onClick={() => {}} />
            <StudyBrowserItemAfter study={{...mockStudy, patientName: 'Jane Smith', modality: 'MR'}} isSelected={false} onClick={() => {}} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Toolbar</h3>
        <ToolbarAfter tools={mockTools} />
      </div>
    </div>
  );
};

/**
 * Migration checklist for developers
 */
export const migrationChecklist = {
  immediate: [
    '✅ Replace all hardcoded hex colors with CSS custom properties',
    '✅ Update button components to use bg-primary/secondary/destructive',
    '✅ Fix accessibility issues with proper color pairing'
  ],
  
  verification: [
    '🔍 Run component color validation tool',
    '🔍 Test in both light and dark themes', 
    '🔍 Verify accessibility compliance',
    '🔍 Check medical imaging backgrounds are sufficiently dark'
  ],

  testing: [
    '🧪 Visual regression testing',
    '🧪 Cross-browser compatibility',
    '🧪 Accessibility testing with screen readers',
    '🧪 Medical professional user testing'
  ]
};

export default {
  ButtonAfter,
  StatusAlertAfter,
  MedicalPanelAfter,
  StudyBrowserItemAfter,
  ToolbarAfter,
  ComponentShowcase,
  migrationChecklist
}; 