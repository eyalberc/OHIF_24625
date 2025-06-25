import React, { useState, useCallback, useMemo } from 'react';
import {
  ViewportConfiguration,
  ProtocolMatchingRule,
  ValidationResult,
  ValidationError
} from '../../types/hangingProtocol.types';

interface ViewportLayoutConfigProps {
  layout: { rows: number; columns: number };
  viewports: ViewportConfiguration[];
  availableRules: ProtocolMatchingRule[];
  onLayoutChange: (layout: { rows: number; columns: number }) => void;
  onViewportsChange: (viewports: ViewportConfiguration[]) => void;
  onValidation?: (result: ValidationResult) => void;
  disabled?: boolean;
}

/**
 * Viewport Layout Configuration Component
 * 
 * Sophisticated interface for designing viewport layouts and configuring
 * viewport-specific settings within hanging protocols.
 * 
 * Task 5.3: Design Viewport Layout Configuration UI
 */
const ViewportLayoutConfig: React.FC<ViewportLayoutConfigProps> = ({
  layout,
  viewports,
  availableRules,
  onLayoutChange,
  onViewportsChange,
  onValidation,
  disabled = false
}) => {
  const [selectedViewport, setSelectedViewport] = useState<string | null>(null);
  const [draggedRule, setDraggedRule] = useState<ProtocolMatchingRule | null>(null);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');

  // Common layout presets
  const layoutPresets = useMemo(() => [
    { rows: 1, columns: 1, name: '1×1 Single', icon: '⬜' },
    { rows: 1, columns: 2, name: '1×2 Side by Side', icon: '▬' },
    { rows: 2, columns: 1, name: '2×1 Stacked', icon: '⬜⬜' },
    { rows: 2, columns: 2, name: '2×2 Quad', icon: '▦' },
    { rows: 1, columns: 3, name: '1×3 Triple', icon: '≡' },
    { rows: 2, columns: 3, name: '2×3 Six Panel', icon: '⬢' },
    { rows: 3, columns: 3, name: '3×3 Nine Panel', icon: '⚏' },
    { rows: 1, columns: 4, name: '1×4 Quad Row', icon: '||||' }
  ], []);

  // Initialize viewports when layout changes
  const initializeViewportsForLayout = useCallback((newLayout: { rows: number; columns: number }) => {
    const totalViewports = newLayout.rows * newLayout.columns;
    const newViewports: ViewportConfiguration[] = [];

    for (let i = 0; i < totalViewports; i++) {
      const row = Math.floor(i / newLayout.columns);
      const col = i % newLayout.columns;
      
      // Try to preserve existing viewport if it exists
      const existingViewport = viewports.find(v => v.position.row === row && v.position.col === col);
      
      if (existingViewport) {
        newViewports.push(existingViewport);
      } else {
        newViewports.push({
          id: `viewport-${row}-${col}`,
          position: { row, col },
          seriesMatchingRules: [],
          displaySettings: {
            voi: { windowWidth: 400, windowCenter: 40 },
            invert: false,
            rotation: 0,
            flipHorizontal: false,
            flipVertical: false,
            initialImageIndex: 0
          },
          synchronization: {
            enabled: false,
            type: 'stackImageIndex'
          }
        });
      }
    }

    onViewportsChange(newViewports);
  }, [viewports, onViewportsChange]);

  // Update layout and reinitialize viewports
  const handleLayoutChange = useCallback((newLayout: { rows: number; columns: number }) => {
    onLayoutChange(newLayout);
    initializeViewportsForLayout(newLayout);
  }, [onLayoutChange, initializeViewportsForLayout]);

  // Update specific viewport
  const updateViewport = useCallback((viewportId: string, updates: Partial<ViewportConfiguration>) => {
    const newViewports = viewports.map(viewport => 
      viewport.id === viewportId ? { ...viewport, ...updates } : viewport
    );
    onViewportsChange(newViewports);
  }, [viewports, onViewportsChange]);

  // Add rule to viewport
  const addRuleToViewport = useCallback((viewportId: string, ruleId: string) => {
    const viewport = viewports.find(v => v.id === viewportId);
    if (!viewport) return;

    const newRules = [...viewport.seriesMatchingRules];
    if (!newRules.includes(ruleId)) {
      newRules.push(ruleId);
      updateViewport(viewportId, { seriesMatchingRules: newRules });
    }
  }, [viewports, updateViewport]);

  // Remove rule from viewport
  const removeRuleFromViewport = useCallback((viewportId: string, ruleId: string) => {
    const viewport = viewports.find(v => v.id === viewportId);
    if (!viewport) return;

    const newRules = viewport.seriesMatchingRules.filter(id => id !== ruleId);
    updateViewport(viewportId, { seriesMatchingRules: newRules });
  }, [viewports, updateViewport]);

  // Validation
  const validateConfiguration = useCallback((): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check if all viewports have at least one rule
    viewports.forEach((viewport, index) => {
      if (viewport.seriesMatchingRules.length === 0) {
        warnings.push({
          field: `viewports[${index}].seriesMatchingRules`,
          message: `Viewport at ${viewport.position.row + 1},${viewport.position.col + 1} has no series matching rules`,
          severity: 'warning',
          code: 'NO_MATCHING_RULES'
        });
      }
    });

    // Check for duplicate rule assignments
    const ruleUsage = new Map<string, string[]>();
    viewports.forEach(viewport => {
      viewport.seriesMatchingRules.forEach(ruleId => {
        if (!ruleUsage.has(ruleId)) {
          ruleUsage.set(ruleId, []);
        }
        ruleUsage.get(ruleId)!.push(viewport.id);
      });
    });

    ruleUsage.forEach((viewportIds, ruleId) => {
      if (viewportIds.length > 1) {
        warnings.push({
          field: 'seriesMatchingRules',
          message: `Rule "${ruleId}" is assigned to multiple viewports: ${viewportIds.join(', ')}`,
          severity: 'warning',
          code: 'DUPLICATE_RULE_ASSIGNMENT'
        });
      }
    });

    const result = {
      isValid: errors.length === 0,
      errors,
      warnings
    };

    if (onValidation) {
      onValidation(result);
    }

    return result;
  }, [viewports, onValidation]);

  // Drag and drop handlers
  const handleRuleDragStart = useCallback((rule: ProtocolMatchingRule) => {
    setDraggedRule(rule);
  }, []);

  const handleViewportDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleViewportDrop = useCallback((viewportId: string) => {
    if (draggedRule) {
      addRuleToViewport(viewportId, draggedRule.id!);
      setDraggedRule(null);
    }
  }, [draggedRule, addRuleToViewport]);

  // Get rule by ID
  const getRuleById = useCallback((ruleId: string) => {
    return availableRules.find(rule => rule.id === ruleId);
  }, [availableRules]);

  // Render viewport cell
  const renderViewportCell = useCallback((viewport: ViewportConfiguration) => {
    const isSelected = selectedViewport === viewport.id;
    const hasRules = viewport.seriesMatchingRules.length > 0;

    return (
      <div
        key={viewport.id}
        className={`viewport-cell ${isSelected ? 'selected' : ''} ${hasRules ? 'has-rules' : 'empty'}`}
        style={{
          gridRow: viewport.position.row + 1,
          gridColumn: viewport.position.col + 1
        }}
        onClick={() => setSelectedViewport(viewport.id)}
        onDragOver={handleViewportDragOver}
        onDrop={() => handleViewportDrop(viewport.id)}
      >
        <div className="viewport-header">
          <span className="viewport-label">
            {viewport.position.row + 1},{viewport.position.col + 1}
          </span>
          {hasRules && (
            <span className="rule-count">{viewport.seriesMatchingRules.length}</span>
          )}
        </div>

        <div className="viewport-content">
          {previewMode === 'preview' ? (
            <div className="viewport-preview">
              <div className="preview-placeholder">
                {hasRules ? '📊 Series Data' : '⚫ Empty'}
              </div>
            </div>
          ) : (
            <div className="viewport-rules">
              {viewport.seriesMatchingRules.map(ruleId => {
                const rule = getRuleById(ruleId);
                return (
                  <div key={ruleId} className="rule-tag">
                    <span>{rule?.attribute || ruleId}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRuleFromViewport(viewport.id, ruleId);
                      }}
                      disabled={disabled}
                      className="remove-rule"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
              {!hasRules && (
                <div className="empty-state">
                  Drop rules here
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [selectedViewport, previewMode, disabled, handleViewportDragOver, handleViewportDrop, getRuleById, removeRuleFromViewport]);

  // Render selected viewport details
  const renderViewportDetails = useCallback(() => {
    const viewport = viewports.find(v => v.id === selectedViewport);
    if (!viewport) return null;

    return (
      <div className="viewport-details">
        <h4>Viewport {viewport.position.row + 1},{viewport.position.col + 1} Settings</h4>
        
        <div className="detail-section">
          <h5>Display Settings</h5>
          <div className="settings-grid">
            <label>
              Window Width:
              <input
                type="number"
                value={viewport.displaySettings.voi.windowWidth}
                onChange={(e) => updateViewport(viewport.id, {
                  displaySettings: {
                    ...viewport.displaySettings,
                    voi: { ...viewport.displaySettings.voi, windowWidth: Number(e.target.value) }
                  }
                })}
                disabled={disabled}
              />
            </label>
            <label>
              Window Center:
              <input
                type="number"
                value={viewport.displaySettings.voi.windowCenter}
                onChange={(e) => updateViewport(viewport.id, {
                  displaySettings: {
                    ...viewport.displaySettings,
                    voi: { ...viewport.displaySettings.voi, windowCenter: Number(e.target.value) }
                  }
                })}
                disabled={disabled}
              />
            </label>
            <label>
              Rotation:
              <select
                value={viewport.displaySettings.rotation}
                onChange={(e) => updateViewport(viewport.id, {
                  displaySettings: { ...viewport.displaySettings, rotation: Number(e.target.value) }
                })}
                disabled={disabled}
              >
                <option value={0}>0°</option>
                <option value={90}>90°</option>
                <option value={180}>180°</option>
                <option value={270}>270°</option>
              </select>
            </label>
          </div>
          
          <div className="checkbox-grid">
            <label>
              <input
                type="checkbox"
                checked={viewport.displaySettings.invert}
                onChange={(e) => updateViewport(viewport.id, {
                  displaySettings: { ...viewport.displaySettings, invert: e.target.checked }
                })}
                disabled={disabled}
              />
              Invert
            </label>
            <label>
              <input
                type="checkbox"
                checked={viewport.displaySettings.flipHorizontal}
                onChange={(e) => updateViewport(viewport.id, {
                  displaySettings: { ...viewport.displaySettings, flipHorizontal: e.target.checked }
                })}
                disabled={disabled}
              />
              Flip Horizontal
            </label>
            <label>
              <input
                type="checkbox"
                checked={viewport.displaySettings.flipVertical}
                onChange={(e) => updateViewport(viewport.id, {
                  displaySettings: { ...viewport.displaySettings, flipVertical: e.target.checked }
                })}
                disabled={disabled}
              />
              Flip Vertical
            </label>
          </div>
        </div>

        <div className="detail-section">
          <h5>Synchronization</h5>
          <label>
            <input
              type="checkbox"
              checked={viewport.synchronization.enabled}
              onChange={(e) => updateViewport(viewport.id, {
                synchronization: { ...viewport.synchronization, enabled: e.target.checked }
              })}
              disabled={disabled}
            />
            Enable Synchronization
          </label>
          {viewport.synchronization.enabled && (
            <select
              value={viewport.synchronization.type}
              onChange={(e) => updateViewport(viewport.id, {
                synchronization: { ...viewport.synchronization, type: e.target.value as any }
              })}
              disabled={disabled}
            >
              <option value="stackImageIndex">Stack Image Index</option>
              <option value="voi">Window Level</option>
              <option value="pan">Pan</option>
              <option value="zoom">Zoom</option>
            </select>
          )}
        </div>
      </div>
    );
  }, [selectedViewport, viewports, updateViewport, disabled]);

  return (
    <div className="viewport-layout-config">
      {/* Header Controls */}
      <div className="config-header">
        <h3>Viewport Layout Configuration</h3>
        <div className="header-controls">
          <div className="mode-toggle">
            <button
              onClick={() => setPreviewMode('edit')}
              className={previewMode === 'edit' ? 'active' : ''}
              disabled={disabled}
            >
              Edit
            </button>
            <button
              onClick={() => setPreviewMode('preview')}
              className={previewMode === 'preview' ? 'active' : ''}
              disabled={disabled}
            >
              Preview
            </button>
          </div>
          <button
            onClick={() => validateConfiguration()}
            disabled={disabled}
            className="validate-btn"
          >
            Validate
          </button>
        </div>
      </div>

      <div className="config-content">
        {/* Layout Selection */}
        <div className="layout-section">
          <h4>Layout Presets</h4>
          <div className="preset-grid">
            {layoutPresets.map(preset => (
              <button
                key={`${preset.rows}x${preset.columns}`}
                onClick={() => handleLayoutChange({ rows: preset.rows, columns: preset.columns })}
                className={`preset-btn ${
                  layout.rows === preset.rows && layout.columns === preset.columns ? 'active' : ''
                }`}
                disabled={disabled}
                title={preset.name}
              >
                <span className="preset-icon">{preset.icon}</span>
                <span className="preset-label">{preset.rows}×{preset.columns}</span>
              </button>
            ))}
          </div>
          
          <div className="custom-layout">
            <label>
              Rows:
              <input
                type="number"
                min="1"
                max="4"
                value={layout.rows}
                onChange={(e) => handleLayoutChange({ ...layout, rows: Number(e.target.value) })}
                disabled={disabled}
              />
            </label>
            <label>
              Columns:
              <input
                type="number"
                min="1"
                max="4"
                value={layout.columns}
                onChange={(e) => handleLayoutChange({ ...layout, columns: Number(e.target.value) })}
                disabled={disabled}
              />
            </label>
          </div>
        </div>

        <div className="main-config">
          {/* Viewport Grid */}
          <div className="viewport-grid-section">
            <h4>Viewport Configuration</h4>
            <div
              className="viewport-grid"
              style={{
                gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
                gridTemplateColumns: `repeat(${layout.columns}, 1fr)`
              }}
            >
              {viewports.map(renderViewportCell)}
            </div>
          </div>

          {/* Available Rules */}
          {previewMode === 'edit' && (
            <div className="rules-section">
              <h4>Available Rules</h4>
              <div className="rules-list">
                {availableRules.map(rule => (
                  <div
                    key={rule.id}
                    draggable={!disabled}
                    onDragStart={() => handleRuleDragStart(rule)}
                    className="rule-item"
                  >
                    <span className="rule-attribute">{rule.attribute}</span>
                    <span className="rule-weight">W: {rule.weight}</span>
                    <span className="rule-constraint">
                      {Object.entries(rule.constraint || {})
                        .filter(([_, value]) => value !== '' && value !== null)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')
                      }
                    </span>
                  </div>
                ))}
                {availableRules.length === 0 && (
                  <div className="no-rules">
                    No rules available. Create rules first.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Viewport Details Panel */}
        {selectedViewport && previewMode === 'edit' && renderViewportDetails()}
      </div>

      <style jsx>{`
        .viewport-layout-config {
          padding: 16px;
          background: var(--color-panel);
          border-radius: 8px;
          border: 1px solid var(--color-border);
        }

        .config-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--color-border);
        }

        .config-header h3 {
          margin: 0;
          color: var(--color-text);
          font-size: 18px;
          font-weight: 600;
        }

        .header-controls {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .mode-toggle {
          display: flex;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          overflow: hidden;
        }

        .mode-toggle button {
          padding: 8px 16px;
          border: none;
          background: var(--color-background);
          color: var(--color-text);
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .mode-toggle button.active {
          background: var(--color-primary);
          color: white;
        }

        .validate-btn {
          padding: 8px 16px;
          background: var(--color-success);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .validate-btn:hover:not(:disabled) {
          background: var(--color-success-dark);
        }

        .config-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .layout-section {
          background: var(--color-background);
          padding: 16px;
          border-radius: 6px;
          border: 1px solid var(--color-border);
        }

        .layout-section h4 {
          margin: 0 0 12px 0;
          color: var(--color-text);
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .preset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 8px;
          margin-bottom: 16px;
        }

        .preset-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          background: var(--color-panel);
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .preset-btn:hover:not(:disabled) {
          border-color: var(--color-primary);
          background: rgba(96, 165, 250, 0.1);
        }

        .preset-btn.active {
          border-color: var(--color-primary);
          background: var(--color-primary);
          color: white;
        }

        .preset-icon {
          font-size: 16px;
        }

        .preset-label {
          font-weight: 500;
        }

        .custom-layout {
          display: flex;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }

        .custom-layout label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
        }

        .custom-layout input {
          width: 60px;
          padding: 6px;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          background: var(--color-background);
          color: var(--color-text);
        }

        .main-config {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 24px;
        }

        .viewport-grid-section h4 {
          margin: 0 0 16px 0;
          color: var(--color-text);
          font-size: 16px;
          font-weight: 600;
        }

        .viewport-grid {
          display: grid;
          gap: 8px;
          min-height: 300px;
          border: 2px solid var(--color-border);
          border-radius: 8px;
          padding: 16px;
          background: var(--color-background);
        }

        .viewport-cell {
          border: 2px solid var(--color-border);
          border-radius: 6px;
          background: var(--color-panel);
          cursor: pointer;
          transition: all 0.2s;
          overflow: hidden;
          min-height: 120px;
          display: flex;
          flex-direction: column;
        }

        .viewport-cell:hover {
          border-color: var(--color-primary);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .viewport-cell.selected {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
        }

        .viewport-cell.has-rules {
          background: rgba(96, 165, 250, 0.1);
        }

        .viewport-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--color-background);
          border-bottom: 1px solid var(--color-border);
        }

        .viewport-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
        }

        .rule-count {
          background: var(--color-primary);
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }

        .viewport-content {
          flex: 1;
          padding: 8px;
          display: flex;
          flex-direction: column;
        }

        .viewport-rules {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .rule-tag {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px;
          background: var(--color-primary);
          color: white;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .remove-rule {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
          font-size: 11px;
          font-style: italic;
          border: 2px dashed var(--color-border);
          border-radius: 4px;
          min-height: 60px;
        }

        .viewport-preview {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-placeholder {
          font-size: 24px;
          color: var(--color-text-secondary);
        }

        .rules-section {
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          padding: 16px;
        }

        .rules-section h4 {
          margin: 0 0 12px 0;
          color: var(--color-text);
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rules-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
        }

        .rule-item {
          padding: 8px;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          background: var(--color-panel);
          cursor: grab;
          transition: all 0.2s;
        }

        .rule-item:hover {
          border-color: var(--color-primary);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .rule-item:active {
          cursor: grabbing;
        }

        .rule-attribute {
          display: block;
          font-weight: 600;
          color: var(--color-primary);
          font-size: 12px;
          margin-bottom: 2px;
        }

        .rule-weight, .rule-constraint {
          font-size: 10px;
          color: var(--color-text-secondary);
          display: block;
        }

        .no-rules {
          text-align: center;
          color: var(--color-text-secondary);
          font-style: italic;
          padding: 32px;
        }

        .viewport-details {
          grid-column: 1 / -1;
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          padding: 16px;
        }

        .viewport-details h4 {
          margin: 0 0 16px 0;
          color: var(--color-text);
          font-size: 16px;
          font-weight: 600;
        }

        .detail-section {
          margin-bottom: 20px;
        }

        .detail-section h5 {
          margin: 0 0 12px 0;
          color: var(--color-text);
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .settings-grid label,
        .checkbox-grid label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
        }

        .checkbox-grid label {
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }

        .settings-grid input,
        .settings-grid select {
          padding: 6px;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          background: var(--color-panel);
          color: var(--color-text);
          font-size: 12px;
        }

        @media (max-width: 1024px) {
          .main-config {
            grid-template-columns: 1fr;
          }
          
          .viewport-details {
            grid-column: 1;
          }
        }

        @media (max-width: 768px) {
          .config-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          
          .preset-grid {
            grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
          }
          
          .custom-layout {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default ViewportLayoutConfig; 