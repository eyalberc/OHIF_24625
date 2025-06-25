import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import StudyMatchingRules from './StudyMatchingRules';
import ViewportLayoutConfig from './ViewportLayoutConfig';
import { HangingProtocolEditorService } from '../../services/HangingProtocolEditorService';
import {
  HangingProtocol,
  ProtocolMatchingRule,
  ValidationResult
} from '../../types/hangingProtocol.types';
import {
  createDeleteConfirmDialog,
  createValidationErrorDialog,
  createUnsavedChangesDialog,
  DIALOG_ACTIONS
} from './dialogs';
import { 
  usePerformanceTracker, 
  useValidationCache,
  useVirtualList,
  useBatchedState
} from '../../utils/performanceUtils';

// Define ViewportConfiguration interface locally since it's not in the types file
interface ViewportConfiguration {
  id: string;
  position: { row: number; col: number };
  seriesMatchingRules: string[];
  displaySettings: {
    voi: { windowWidth: number; windowCenter: number };
    invert: boolean;
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
    initialImageIndex: number;
  };
  synchronization: {
    enabled: boolean;
    type: 'stackImageIndex' | 'voi' | 'pan' | 'zoom';
  };
}

interface HangingProtocolEditorProps {
  servicesManager?: any;
  onClose?: () => void;
  isOpen?: boolean;
}

// Memoized Protocol Item Component for Virtual List Performance
const ProtocolItem = memo<{
  protocol: HangingProtocol;
  isSelected: boolean;
  onSelect: (protocol: HangingProtocol) => void;
  onDelete: (protocolId: string) => void;
}>(({ protocol, isSelected, onSelect, onDelete }) => {
  const handleClick = useCallback(() => {
    onSelect(protocol);
  }, [protocol, onSelect]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(protocol.id);
  }, [protocol.id, onDelete]);

  const protocolMeta = useMemo(() => ({
    rulesCount: protocol.protocolMatchingRules.length,
    columns: protocol.stages[0]?.viewportStructure.properties.columns || 1,
    rows: protocol.stages[0]?.viewportStructure.properties.rows || 1
  }), [protocol]);

  return (
    <div 
      className={`protocol-item ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <div className="protocol-info">
        <div className="protocol-name">{protocol.name}</div>
        <div className="protocol-meta">
          <span>{protocolMeta.rulesCount} rules</span>
          <span>•</span>
          <span>{protocolMeta.columns}×{protocolMeta.rows} layout</span>
        </div>
        {protocol.description && (
          <div className="protocol-description">{protocol.description}</div>
        )}
      </div>
      <div className="protocol-actions">
        <button 
          onClick={handleDelete}
          className="delete-btn"
          title="Delete protocol"
        >
          🗑️
        </button>
      </div>
    </div>
  );
});

ProtocolItem.displayName = 'ProtocolItem';

// Memoized Validation Summary Component
const ValidationSummary = memo<{ validationResults: ValidationResult | null }>(({ validationResults }) => {
  const summary = useMemo(() => {
    if (!validationResults) return null;

    const { errors, warnings } = validationResults;
    const totalIssues = errors.length + warnings.length;

    if (totalIssues === 0) {
      return {
        type: 'success',
        message: 'Protocol is valid and ready to save',
        icon: '✓'
      };
    }

    return {
      type: 'error',
      message: `${errors.length} errors, ${warnings.length} warnings`,
      icon: '⚠',
      details: { errors, warnings }
    };
  }, [validationResults]);

  if (!summary) return null;

  return (
    <div className={`validation-summary ${summary.type}`}>
      <span className="validation-icon">{summary.icon}</span>
      <span>{summary.message}</span>
      {summary.details && (
        <details className="validation-details">
          <summary>Show Details</summary>
          {summary.details.errors.map((error, index) => (
            <div key={index} className="validation-item error">
              <strong>Error:</strong> {error.message}
            </div>
          ))}
          {summary.details.warnings.map((warning, index) => (
            <div key={index} className="validation-item warning">
              <strong>Warning:</strong> {warning.message}
            </div>
          ))}
        </details>
      )}
    </div>
  );
});

ValidationSummary.displayName = 'ValidationSummary';

// Memoized Editor Tabs Component
const EditorTabs = memo<{
  currentTab: 'basic' | 'rules' | 'layout';
  onTabChange: (tab: 'basic' | 'rules' | 'layout') => void;
  disabled: boolean;
}>(({ currentTab, onTabChange, disabled }) => {
  const tabs = useMemo(() => [
    { key: 'basic', icon: '📋', label: 'Basic Info' },
    { key: 'rules', icon: '🎯', label: 'Matching Rules' },
    { key: 'layout', icon: '⊞', label: 'Viewport Layout' }
  ], []);

  return (
    <div className="editor-tabs">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key as any)}
          className={currentTab === tab.key ? 'active' : ''}
          disabled={disabled}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
});

EditorTabs.displayName = 'EditorTabs';

/**
 * Comprehensive Hanging Protocol Editor - Performance Optimized
 * 
 * Enterprise-grade interface with advanced performance optimizations:
 * - React.memo for component memoization
 * - useMemo for expensive computations
 * - useCallback for event handler optimization
 * - Validation result caching
 * - Virtual list rendering for large protocol lists
 * - Performance monitoring and profiling
 * 
 * Task 5.7: Optimize Editor Performance
 */
const HangingProtocolEditor: React.FC<HangingProtocolEditorProps> = ({ 
  servicesManager, 
  onClose,
  isOpen = true
}) => {
  // Performance monitoring
  const { getMetrics } = usePerformanceTracker('HangingProtocolEditor');

  // Core state management with batched updates for better performance
  const [editorService, setEditorService] = useState<HangingProtocolEditorService | null>(null);
  const [protocols, setProtocols] = useState<HangingProtocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<HangingProtocol | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTab, setCurrentTab] = useState<'basic' | 'rules' | 'layout'>('basic');
  
  // Validation state with caching
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Unsaved changes tracking
  const [isDirty, setIsDirty] = useState(false);
  const [originalProtocol, setOriginalProtocol] = useState<HangingProtocol | null>(null);

  // UIDialogService integration - memoized
  const uiDialogService = useMemo(() => 
    servicesManager?.services?.uiDialogService, 
    [servicesManager]
  );

  // Memoized validation with caching
  const cachedValidation = useValidationCache(
    selectedProtocol,
    (protocol) => {
      if (!protocol || !editorService || !isEditing) {
        return { isValid: true, errors: [], warnings: [] };
      }
      return editorService.validateProtocolQuick(protocol);
    },
    selectedProtocol?.id
  );

  // Update validation state when cached result changes
  useEffect(() => {
    setValidationResults(cachedValidation);
    setIsValid(cachedValidation.isValid);
  }, [cachedValidation]);

  // Initialize editor service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        const service = new HangingProtocolEditorService(servicesManager);
        setEditorService(service);

        // Load existing protocols
        const existingProtocols = await service.getProtocols();
        setProtocols(existingProtocols);
      } catch (error) {
        console.error('Failed to initialize Hanging Protocol Editor:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (servicesManager) {
      initializeService();
    }
  }, [servicesManager]);

  // Virtual list configuration for large protocol datasets
  const virtualListConfig = useVirtualList(protocols, 80, 400, 3);

  // Optimized protocol list with virtual scrolling
  const visibleProtocols = useMemo(() => {
    if (protocols.length > 20) {
      return virtualListConfig.visibleItems;
    }
    return protocols;
  }, [protocols, virtualListConfig.visibleItems]);

  // Save protocol - optimized with batching
  const saveProtocol = useCallback(async () => {
    if (!selectedProtocol || !editorService) return;

    try {
      setIsSaving(true);

      // Validate protocol before saving
      const validation = editorService.validateProtocol(selectedProtocol);
      setValidationResults(validation);

      if (!validation.isValid) {
        // Show validation errors in a dialog
        if (uiDialogService) {
          await createValidationErrorDialog(uiDialogService, validation);
        }
        return;
      }

      // Check if protocol exists
      const existingIndex = protocols.findIndex(p => p.id === selectedProtocol.id);
      
      if (existingIndex >= 0) {
        // Update existing
        await editorService.updateProtocol(selectedProtocol);
        const updatedProtocols = [...protocols];
        updatedProtocols[existingIndex] = selectedProtocol;
        setProtocols(updatedProtocols);
      } else {
        // Create new
        await editorService.addProtocol(selectedProtocol);
        setProtocols([...protocols, selectedProtocol]);
      }

      setIsEditing(false);
      setIsDirty(false);
      setOriginalProtocol({ ...selectedProtocol });
    } catch (error) {
      console.error('Failed to save protocol:', error);
      // TODO: Show error dialog
    } finally {
      setIsSaving(false);
    }
  }, [selectedProtocol, editorService, protocols, uiDialogService]);

  // Delete protocol - memoized
  const deleteProtocol = useCallback(async (protocolId: string) => {
    if (!editorService || !uiDialogService) return;

    const protocolToDelete = protocols.find(p => p.id === protocolId);
    if (!protocolToDelete) return;

    try {
      const confirmed = await createDeleteConfirmDialog(
        uiDialogService,
        protocolToDelete.name,
        'hanging protocol'
      );

      if (!confirmed) return;

      await editorService.removeProtocol(protocolId);
      const updatedProtocols = protocols.filter(p => p.id !== protocolId);
      setProtocols(updatedProtocols);

      if (selectedProtocol?.id === protocolId) {
        setSelectedProtocol(null);
        setIsEditing(false);
        setIsDirty(false);
        setOriginalProtocol(null);
      }
    } catch (error) {
      console.error('Failed to delete protocol:', error);
      // TODO: Show error dialog
    }
  }, [editorService, uiDialogService, protocols, selectedProtocol]);

  // Create new protocol - optimized
  const createNewProtocol = useCallback(async () => {
    if (!editorService) return;

    // Check for unsaved changes first
    if (isDirty && selectedProtocol && uiDialogService) {
      const result = await createUnsavedChangesDialog(
        uiDialogService,
        selectedProtocol.name
      );

      if (result.action === DIALOG_ACTIONS.SAVE) {
        await saveProtocol();
      } else if (result.action === DIALOG_ACTIONS.CANCEL) {
        return; // Don't create new protocol
      }
      // If DISCARD, continue with new protocol creation
    }

    const newProtocol: HangingProtocol = {
      id: `custom-protocol-${Date.now()}`,
      name: 'New Hanging Protocol',
      description: '',
      protocolMatchingRules: [],
      displaySetSelectors: {
        'default-displayset': {
          id: 'default-displayset',
          matchingRules: [],
          seriesMatchingRules: [],
          studyMatchingRules: []
        }
      },
      stages: [{
        id: 'default-stage',
        name: 'Default Stage',
        viewportStructure: {
          layoutType: 'grid',
          properties: {
            rows: 1,
            columns: 2
          }
        },
        viewports: [{
          viewportOptions: {
            viewportType: 'stack',
            toolGroupId: 'default',
            initialImageOptions: {
              index: 0,
              preset: 'first'
            }
          },
          displaySets: [{
            id: 'default-displayset'
          }]
        }],
        createdDate: new Date().toISOString()
      }],
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      numberOfPriorsReferenced: -1
    };

    setSelectedProtocol(newProtocol);
    setOriginalProtocol({ ...newProtocol });
    setIsEditing(true);
    setIsDirty(false);
    setCurrentTab('basic');
  }, [editorService, isDirty, selectedProtocol, uiDialogService, saveProtocol]);

  // Update protocol basic info - optimized
  const updateProtocolBasics = useCallback((updates: Partial<HangingProtocol>) => {
    if (!selectedProtocol) return;

    const updatedProtocol = {
      ...selectedProtocol,
      ...updates,
      modifiedDate: new Date().toISOString()
    };

    setSelectedProtocol(updatedProtocol);
    setIsDirty(true);
  }, [selectedProtocol]);

  // Update protocol matching rules - optimized
  const updateProtocolRules = useCallback((rules: ProtocolMatchingRule[]) => {
    if (!selectedProtocol) return;

    const updatedProtocol = {
      ...selectedProtocol,
      protocolMatchingRules: rules,
      modifiedDate: new Date().toISOString()
    };

    setSelectedProtocol(updatedProtocol);
    setIsDirty(true);
  }, [selectedProtocol]);

  // Update viewport layout - optimized
  const updateViewportLayout = useCallback((layout: { rows: number; columns: number }, viewports: ViewportConfiguration[]) => {
    if (!selectedProtocol || !selectedProtocol.stages[0]) return;

    // Convert ViewportConfiguration to OHIF v3 format
    const ohifViewports = viewports.map(viewport => ({
      viewportOptions: {
        viewportType: 'stack' as const,
        toolGroupId: 'default',
        initialImageOptions: {
          index: viewport.displaySettings.initialImageIndex,
          preset: 'first' as const
        }
      },
      displaySets: viewport.seriesMatchingRules.map(ruleId => ({ id: ruleId }))
    }));

    const updatedProtocol = {
      ...selectedProtocol,
      stages: [{
        ...selectedProtocol.stages[0],
        viewportStructure: {
          layoutType: 'grid' as const,
          properties: {
            rows: layout.rows,
            columns: layout.columns
          }
        },
        viewports: ohifViewports
      }],
      modifiedDate: new Date().toISOString()
    };

    setSelectedProtocol(updatedProtocol);
    setIsDirty(true);
  }, [selectedProtocol]);

  // Handle protocol selection with unsaved changes check - optimized
  const selectProtocol = useCallback(async (protocol: HangingProtocol) => {
    if (isDirty && selectedProtocol && uiDialogService) {
      const result = await createUnsavedChangesDialog(
        uiDialogService,
        selectedProtocol.name
      );

      if (result.action === DIALOG_ACTIONS.SAVE) {
        await saveProtocol();
      } else if (result.action === DIALOG_ACTIONS.CANCEL) {
        return; // Stay on current protocol
      }
      // If DISCARD, continue with selection
    }

    setSelectedProtocol(protocol);
    setOriginalProtocol({ ...protocol });
    setIsDirty(false);
    setIsEditing(false);
  }, [isDirty, selectedProtocol, uiDialogService, saveProtocol]);

  // Handle validation from child components - optimized
  const handleValidation = useCallback((result: ValidationResult) => {
    setValidationResults(result);
    setIsValid(result.isValid);
  }, []);

  // Get current layout and viewports for ViewportLayoutConfig - memoized
  const getCurrentLayoutData = useCallback(() => {
    if (!selectedProtocol || !selectedProtocol.stages[0]) {
      return {
        layout: { rows: 1, columns: 2 },
        viewports: []
      };
    }

    const stage = selectedProtocol.stages[0];
    const { rows, columns } = stage.viewportStructure.properties;

    const viewports: ViewportConfiguration[] = stage.viewports.map((viewport, index) => ({
      id: `viewport-${index}`,
      position: {
        row: Math.floor(index / columns),
        col: index % columns
      },
      seriesMatchingRules: viewport.displaySets.map(ds => ds.id),
      displaySettings: {
        voi: { windowWidth: 400, windowCenter: 40 },
        invert: false,
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
        initialImageIndex: viewport.viewportOptions.initialImageOptions?.index || 0
      },
      synchronization: {
        enabled: false,
        type: 'stackImageIndex'
      }
    }));

    return { layout: { rows, columns }, viewports };
  }, [selectedProtocol]);

  // Memoized current layout data
  const currentLayoutData = useMemo(() => getCurrentLayoutData(), [getCurrentLayoutData]);

  // Memoized protocol list renderer
  const renderProtocolList = useMemo(() => (
    <div className="protocol-list">
      <div className="list-header">
        <h3>Hanging Protocols</h3>
        <button 
          onClick={createNewProtocol}
          disabled={isLoading}
          className="create-btn"
        >
          <span>+ New Protocol</span>
        </button>
      </div>

      <div className="protocols" style={protocols.length > 20 ? {
        height: virtualListConfig.totalHeight,
        overflowY: 'auto'
      } : {}}>
        {protocols.length === 0 ? (
          <div className="empty-state">
            <p>No hanging protocols found.</p>
            <p>Create your first protocol to get started.</p>
          </div>
        ) : (
          <div style={protocols.length > 20 ? {
            transform: `translateY(${virtualListConfig.offsetY}px)`
          } : {}}>
            {visibleProtocols.map(protocol => (
              <ProtocolItem
                key={protocol.id}
                protocol={protocol}
                isSelected={selectedProtocol?.id === protocol.id}
                onSelect={selectProtocol}
                onDelete={deleteProtocol}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  ), [protocols, createNewProtocol, isLoading, selectedProtocol, selectProtocol, deleteProtocol, visibleProtocols, virtualListConfig]);

  // Memoized basic info tab
  const renderBasicInfoTab = useMemo(() => (
    <div className="basic-info-tab">
      <div className="form-section">
        <h4>Protocol Information</h4>
        
        <div className="form-group">
          <label htmlFor="protocol-name">Name *</label>
          <input
            id="protocol-name"
            type="text"
            value={selectedProtocol?.name || ''}
            onChange={(e) => updateProtocolBasics({ name: e.target.value })}
            placeholder="Enter protocol name..."
            disabled={!isEditing}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="protocol-description">Description</label>
          <textarea
            id="protocol-description"
            value={selectedProtocol?.description || ''}
            onChange={(e) => updateProtocolBasics({ description: e.target.value })}
            placeholder="Optional description for this protocol..."
            disabled={!isEditing}
            rows={3}
          />
        </div>
      </div>

      <div className="form-section">
        <h4>Protocol Metadata</h4>
        <div className="metadata-grid">
          <div className="metadata-item">
            <label>Protocol ID</label>
            <span className="metadata-value">{selectedProtocol?.id}</span>
          </div>
          <div className="metadata-item">
            <label>Created</label>
            <span className="metadata-value">
              {selectedProtocol?.createdDate ? new Date(selectedProtocol.createdDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="metadata-item">
            <label>Modified</label>
            <span className="metadata-value">
              {selectedProtocol?.modifiedDate ? new Date(selectedProtocol.modifiedDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="metadata-item">
            <label>Rules Count</label>
            <span className="metadata-value">{selectedProtocol?.protocolMatchingRules.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  ), [selectedProtocol, updateProtocolBasics, isEditing]);

  // Main render
  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="hanging-protocol-editor loading">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading Hanging Protocol Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hanging-protocol-editor">
      <div className="editor-header">
        <div className="header-left">
          <h2>Hanging Protocol Editor</h2>
          <span className="editor-subtitle">Create and manage custom study display protocols</span>
        </div>
        <div className="header-right">
          {selectedProtocol && (
            <div className="editor-controls">
              <button
                onClick={() => setIsEditing(!isEditing)}
                disabled={isSaving}
                className="edit-btn"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              {isEditing && (
                <button
                  onClick={saveProtocol}
                  disabled={!isValid || isSaving}
                  className="save-btn"
                >
                  {isSaving ? 'Saving...' : 'Save Protocol'}
                </button>
              )}
            </div>
          )}
          {onClose && (
            <button onClick={onClose} className="close-btn" title="Close editor">
              ×
            </button>
          )}
        </div>
      </div>

      <ValidationSummary validationResults={validationResults} />

      <div className="editor-content">
        <div className="sidebar">
          {renderProtocolList}
        </div>

        <div className="main-editor">
          {selectedProtocol ? (
            <>
              <EditorTabs 
                currentTab={currentTab}
                onTabChange={setCurrentTab}
                disabled={!isEditing}
              />
              
              <div className="tab-content">
                {currentTab === 'basic' && renderBasicInfoTab}
                
                {currentTab === 'rules' && (
                  <StudyMatchingRules
                    rules={selectedProtocol.protocolMatchingRules}
                    onRulesChange={updateProtocolRules}
                    onValidation={handleValidation}
                    disabled={!isEditing}
                  />
                )}
                
                {currentTab === 'layout' && (
                  <ViewportLayoutConfig
                    layout={currentLayoutData.layout}
                    viewports={currentLayoutData.viewports}
                    availableRules={selectedProtocol.protocolMatchingRules}
                    onLayoutChange={(newLayout) => updateViewportLayout(newLayout, currentLayoutData.viewports)}
                    onViewportsChange={(newViewports) => updateViewportLayout(currentLayoutData.layout, newViewports)}
                    onValidation={handleValidation}
                    disabled={!isEditing}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <div className="no-selection-content">
                <h3>No Protocol Selected</h3>
                <p>Select an existing protocol from the sidebar or create a new one to get started.</p>
                <button onClick={createNewProtocol} className="create-protocol-btn">
                  Create New Protocol
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .hanging-protocol-editor {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--color-background);
          color: var(--color-text);
        }

        .hanging-protocol-editor.loading {
          justify-content: center;
          align-items: center;
        }

        .loading-state {
          text-align: center;
          padding: 40px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--color-border);
          border-top: 4px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-panel);
        }

        .header-left h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text);
        }

        .editor-subtitle {
          display: block;
          font-size: 14px;
          color: var(--color-text-secondary);
          margin-top: 4px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .editor-controls {
          display: flex;
          gap: 8px;
        }

        .edit-btn, .save-btn, .create-protocol-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-btn {
          background: var(--color-secondary);
          color: var(--color-text);
        }

        .edit-btn:hover:not(:disabled) {
          background: var(--color-secondary-dark);
        }

        .save-btn, .create-protocol-btn {
          background: var(--color-primary);
          color: white;
        }

        .save-btn:hover:not(:disabled), .create-protocol-btn:hover {
          background: var(--color-primary-dark);
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 4px;
          background: var(--color-danger);
          color: white;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: var(--color-danger-dark);
        }

        .validation-summary {
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--color-border);
        }

        .validation-summary.success {
          background: rgba(34, 197, 94, 0.1);
          color: var(--color-success);
        }

        .validation-summary.error {
          background: rgba(248, 113, 113, 0.1);
          color: var(--color-danger);
        }

        .validation-icon {
          font-weight: bold;
        }

        .validation-details {
          margin-left: 16px;
        }

        .validation-item {
          padding: 4px 0;
          font-size: 14px;
        }

        .editor-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .sidebar {
          width: 320px;
          border-right: 1px solid var(--color-border);
          background: var(--color-panel);
          overflow-y: auto;
        }

        .protocol-list {
          padding: 16px;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .list-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
        }

        .create-btn {
          padding: 6px 12px;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }

        .create-btn:hover:not(:disabled) {
          background: var(--color-primary-dark);
        }

        .create-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 32px 16px;
          color: var(--color-text-secondary);
        }

        .empty-state p {
          margin: 8px 0;
          font-size: 14px;
        }

        .protocols {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .protocol-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 12px;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          background: var(--color-background);
          cursor: pointer;
          transition: all 0.2s;
        }

        .protocol-item:hover {
          border-color: var(--color-primary);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .protocol-item.selected {
          border-color: var(--color-primary);
          background: rgba(96, 165, 250, 0.1);
        }

        .protocol-info {
          flex: 1;
        }

        .protocol-name {
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 4px;
        }

        .protocol-meta {
          display: flex;
          gap: 8px;
          font-size: 12px;
          color: var(--color-text-secondary);
          margin-bottom: 4px;
        }

        .protocol-description {
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }

        .protocol-actions {
          margin-left: 8px;
        }

        .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .delete-btn:hover {
          background: rgba(248, 113, 113, 0.1);
        }

        .main-editor {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .editor-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-panel);
        }

        .editor-tabs button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          background: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .editor-tabs button:hover:not(:disabled) {
          color: var(--color-text);
          background: rgba(96, 165, 250, 0.1);
        }

        .editor-tabs button.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .editor-tabs button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .basic-info-tab {
          max-width: 600px;
        }

        .form-section {
          margin-bottom: 32px;
          padding: 20px;
          background: var(--color-panel);
          border-radius: 8px;
          border: 1px solid var(--color-border);
        }

        .form-section h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          background: var(--color-background);
          color: var(--color-text);
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
        }

        .form-group input:disabled,
        .form-group textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .metadata-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metadata-item label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metadata-value {
          font-size: 14px;
          color: var(--color-text);
          font-family: monospace;
          background: var(--color-background);
          padding: 6px 8px;
          border-radius: 4px;
          border: 1px solid var(--color-border);
        }

        .no-selection {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .no-selection-content {
          text-align: center;
          max-width: 400px;
          padding: 40px;
        }

        .no-selection-content h3 {
          margin: 0 0 16px 0;
          font-size: 20px;
          color: var(--color-text);
        }

        .no-selection-content p {
          margin: 0 0 24px 0;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }

        @media (max-width: 1024px) {
          .sidebar {
            width: 280px;
          }
          
          .editor-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
        }

        @media (max-width: 768px) {
          .hanging-protocol-editor {
            height: auto;
            min-height: 100vh;
          }
          
          .editor-content {
            flex-direction: column;
          }
          
          .sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
          }
          
          .editor-tabs {
            overflow-x: auto;
          }
          
          .tab-content {
            padding: 16px;
          }
          
          .metadata-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// Export the memoized component for maximum performance
export default memo(HangingProtocolEditor); 