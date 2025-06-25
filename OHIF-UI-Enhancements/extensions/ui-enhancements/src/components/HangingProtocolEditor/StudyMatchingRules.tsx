import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  ProtocolMatchingRule,
  Constraint,
  ValidationResult,
  ValidationError
} from '../../types/hangingProtocol.types';
import { 
  usePerformanceTracker, 
  useValidationCache, 
  useVirtualList,
  useDebounce 
} from '../../utils/performanceUtils';

interface StudyMatchingRulesProps {
  rules: ProtocolMatchingRule[];
  onRulesChange: (rules: ProtocolMatchingRule[]) => void;
  availableAttributes?: string[];
  onValidation?: (result: ValidationResult) => void;
  disabled?: boolean;
}

// Memoized Constraint Input Component for better performance
const ConstraintInput = memo<{
  rule: ProtocolMatchingRule;
  index: number;
  constraintTypes: Array<{ value: string; label: string }>;
  onUpdateConstraint: (index: number, constraint: Constraint) => void;
  disabled: boolean;
}>(({ rule, index, constraintTypes, onUpdateConstraint, disabled }) => {
  const constraint = rule.constraint || {};
  
  const handleConstraintToggle = useCallback((value: string, checked: boolean) => {
    const newConstraint = { ...constraint } as any;
    if (checked) {
      newConstraint[value] = '';
    } else {
      delete newConstraint[value];
    }
    onUpdateConstraint(index, newConstraint);
  }, [constraint, index, onUpdateConstraint]);

  const handleConstraintValueChange = useCallback((value: string, newValue: string | number) => {
    const newConstraint = { ...constraint } as any;
    newConstraint[value] = newValue;
    onUpdateConstraint(index, newConstraint);
  }, [constraint, index, onUpdateConstraint]);

  return (
    <div className="constraint-builder">
      <div className="constraint-type-grid">
        {constraintTypes.map(({ value, label }) => {
          const isActive = constraint.hasOwnProperty(value);
          const currentValue = constraint[value as keyof Constraint];

          return (
            <div key={value} className={`constraint-option ${isActive ? 'active' : ''}`}>
              <label className="constraint-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => handleConstraintToggle(value, e.target.checked)}
                  disabled={disabled}
                />
                <span>{label}</span>
              </label>
              
              {isActive && (
                <input
                  type={value.includes('Than') || value.includes('Equal') ? 'number' : 'text'}
                  value={String(currentValue || '')}
                  onChange={(e) => {
                    const newValue = value.includes('Than') || value.includes('Equal') 
                      ? Number(e.target.value) 
                      : e.target.value;
                    handleConstraintValueChange(value, newValue);
                  }}
                  placeholder="Enter value..."
                  disabled={disabled}
                  className="constraint-input"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

ConstraintInput.displayName = 'ConstraintInput';

// Memoized Rule Item Component for better list performance
const RuleItem = memo<{
  rule: ProtocolMatchingRule;
  index: number;
  isExpanded: boolean;
  isDragging: boolean;
  attributes: string[];
  onToggleExpansion: (ruleId: string) => void;
  onUpdateRule: (index: number, updates: Partial<ProtocolMatchingRule>) => void;
  onUpdateConstraint: (index: number, constraint: Constraint) => void;
  onRemoveRule: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (index: number) => void;
  getConstraintTypes: (attribute: string) => Array<{ value: string; label: string }>;
  disabled: boolean;
}>(({ 
  rule, 
  index, 
  isExpanded, 
  isDragging, 
  attributes, 
  onToggleExpansion, 
  onUpdateRule, 
  onUpdateConstraint, 
  onRemoveRule, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  getConstraintTypes,
  disabled 
}) => {
  // Memoized constraint summary for better performance
  const constraintSummary = useMemo(() => {
    return Object.entries(rule.constraint || {})
      .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }, [rule.constraint]);

  // Memoized constraint types for this rule
  const constraintTypes = useMemo(() => getConstraintTypes(rule.attribute), [getConstraintTypes, rule.attribute]);

  const handleHeaderClick = useCallback(() => {
    onToggleExpansion(rule.id!);
  }, [rule.id, onToggleExpansion]);

  const handleExpandClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpansion(rule.id!);
  }, [rule.id, onToggleExpansion]);

  const handleRemoveClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveRule(index);
  }, [index, onRemoveRule]);

  const handleAttributeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateRule(index, { 
      attribute: e.target.value,
      constraint: { equals: '' } // Reset constraint when attribute changes
    });
  }, [index, onUpdateRule]);

  const handleWeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateRule(index, { weight: Number(e.target.value) });
  }, [index, onUpdateRule]);

  const handleRequiredChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateRule(index, { required: e.target.checked });
  }, [index, onUpdateRule]);

  const handleDragStart = useCallback(() => {
    onDragStart(index);
  }, [index, onDragStart]);

  const handleDrop = useCallback(() => {
    onDrop(index);
  }, [index, onDrop]);

  return (
    <div
      className={`rule-item ${isExpanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDrop={handleDrop}
    >
      <div className="rule-header" onClick={handleHeaderClick}>
        <div className="rule-summary">
          <span className="rule-drag-handle" title="Drag to reorder">⋮⋮</span>
          <span className="rule-attribute">{rule.attribute}</span>
          <span className="rule-weight">Weight: {rule.weight}</span>
          {constraintSummary && (
            <span className="rule-constraint-summary">{constraintSummary}</span>
          )}
        </div>
        <div className="rule-actions">
          <button
            onClick={handleExpandClick}
            className="expand-btn"
            title={isExpanded ? 'Collapse rule' : 'Expand rule'}
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button
            onClick={handleRemoveClick}
            disabled={disabled}
            className="remove-rule-btn"
            title="Remove rule"
          >
            ×
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="rule-details">
          <div className="rule-config-grid">
            <div className="config-group">
              <label>Attribute</label>
              <select
                value={rule.attribute}
                onChange={handleAttributeChange}
                disabled={disabled}
                className="attribute-select"
              >
                {attributes.map(attr => (
                  <option key={attr} value={attr}>{attr}</option>
                ))}
              </select>
            </div>

            <div className="config-group">
              <label>Weight (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                step="1"
                value={rule.weight}
                onChange={handleWeightChange}
                disabled={disabled}
                className="weight-input"
              />
            </div>

            <div className="config-group">
              <label>
                <input
                  type="checkbox"
                  checked={rule.required || false}
                  onChange={handleRequiredChange}
                  disabled={disabled}
                />
                Required
              </label>
            </div>
          </div>

          <div className="constraint-section">
            <label>Matching Constraints</label>
            <ConstraintInput
              rule={rule}
              index={index}
              constraintTypes={constraintTypes}
              onUpdateConstraint={onUpdateConstraint}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
});

RuleItem.displayName = 'RuleItem';

// Memoized Rules List Component with virtual scrolling support
const RulesList = memo<{
  rules: ProtocolMatchingRule[];
  expandedRule: string | null;
  draggedRuleIndex: number | null;
  attributes: string[];
  onToggleExpansion: (ruleId: string) => void;
  onUpdateRule: (index: number, updates: Partial<ProtocolMatchingRule>) => void;
  onUpdateConstraint: (index: number, constraint: Constraint) => void;
  onRemoveRule: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (index: number) => void;
  getConstraintTypes: (attribute: string) => Array<{ value: string; label: string }>;
  disabled: boolean;
}>(({ 
  rules, 
  expandedRule, 
  draggedRuleIndex, 
  attributes, 
  onToggleExpansion, 
  onUpdateRule, 
  onUpdateConstraint, 
  onRemoveRule, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  getConstraintTypes, 
  disabled 
}) => {
  // Virtual list for large rule sets
  const virtualListConfig = useVirtualList(rules, 120, 600, 3);
  
  // Determine if we should use virtual scrolling
  const useVirtualScrolling = rules.length > 15;
  const visibleRules = useVirtualScrolling ? virtualListConfig.visibleItems : rules;

  if (rules.length === 0) {
    return (
      <div className="no-rules-message">
        <p>No matching rules defined. Click "Add Rule" to create your first rule.</p>
      </div>
    );
  }

  return (
    <div 
      className="rules-list"
      style={useVirtualScrolling ? {
        height: virtualListConfig.totalHeight,
        overflowY: 'auto'
      } : {}}
      onScroll={useVirtualScrolling ? virtualListConfig.onScroll : undefined}
    >
      <div style={useVirtualScrolling ? {
        transform: `translateY(${virtualListConfig.offsetY}px)`
      } : {}}>
        {visibleRules.map((rule, index) => {
          const actualIndex = useVirtualScrolling 
            ? rules.indexOf(rule) 
            : index;
          
          return (
            <RuleItem
              key={rule.id || actualIndex}
              rule={rule}
              index={actualIndex}
              isExpanded={expandedRule === rule.id}
              isDragging={draggedRuleIndex === actualIndex}
              attributes={attributes}
              onToggleExpansion={onToggleExpansion}
              onUpdateRule={onUpdateRule}
              onUpdateConstraint={onUpdateConstraint}
              onRemoveRule={onRemoveRule}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              getConstraintTypes={getConstraintTypes}
              disabled={disabled}
            />
          );
        })}
      </div>
    </div>
  );
});

RulesList.displayName = 'RulesList';

/**
 * Study Matching Rules UI Component - Performance Optimized
 * 
 * Sophisticated interface for creating and editing study matching rules
 * with advanced performance optimizations:
 * - React.memo for component memoization
 * - useMemo for expensive computations
 * - useCallback for event handler optimization
 * - Virtual scrolling for large rule lists
 * - Validation result caching
 * - Performance monitoring and profiling
 * 
 * Task 5.7: Optimize Editor Performance
 */
const StudyMatchingRules: React.FC<StudyMatchingRulesProps> = ({
  rules = [],
  onRulesChange,
  availableAttributes = [],
  onValidation,
  disabled = false
}) => {
  // Performance monitoring
  const { getMetrics } = usePerformanceTracker('StudyMatchingRules');

  const [draggedRuleIndex, setDraggedRuleIndex] = useState<number | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  // Memoized default available attributes for study matching
  const defaultAttributes = useMemo(() => [
    'Modality',
    'BodyPartExamined', 
    'StudyDescription',
    'SeriesDescription',
    'NumberOfStudyRelatedSeries',
    'NumberOfSeriesRelatedInstances',
    'ModalitiesInStudy',
    'StudyDate',
    'StudyTime',
    'PatientAge',
    'PatientSex',
    'InstitutionName',
    'Manufacturer',
    'ManufacturerModelName'
  ], []);

  // Memoized attributes list
  const attributes = useMemo(() => 
    availableAttributes.length > 0 ? availableAttributes : defaultAttributes,
    [availableAttributes, defaultAttributes]
  );

  // Memoized constraint type options based on attribute type
  const getConstraintTypes = useCallback((attribute: string) => {
    const numericAttributes = ['NumberOfStudyRelatedSeries', 'NumberOfSeriesRelatedInstances', 'PatientAge'];
    const dateAttributes = ['StudyDate', 'StudyTime'];

    if (numericAttributes.includes(attribute)) {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'greaterThan', label: 'Greater Than' },
        { value: 'lessThan', label: 'Less Than' },
        { value: 'greaterThanOrEqual', label: 'Greater Than or Equal' },
        { value: 'lessThanOrEqual', label: 'Less Than or Equal' }
      ];
    } else if (dateAttributes.includes(attribute)) {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'greaterThan', label: 'After' },
        { value: 'lessThan', label: 'Before' }
      ];
    } else {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'doesNotEqual', label: 'Does Not Equal' },
        { value: 'contains', label: 'Contains' },
        { value: 'doesNotContain', label: 'Does Not Contain' },
        { value: 'startsWith', label: 'Starts With' },
        { value: 'endsWith', label: 'Ends With' },
        { value: 'regex', label: 'Regular Expression' }
      ];
    }
  }, []);

  // Memoized validation function with caching
  const validateRules = useValidationCache(
    rules,
    (rulesToValidate: ProtocolMatchingRule[]): ValidationResult => {
      const errors: ValidationError[] = [];

      rulesToValidate.forEach((rule, index) => {
        if (!rule.attribute) {
          errors.push({
            field: `rules[${index}].attribute`,
            message: 'Attribute is required',
            severity: 'error',
            code: 'REQUIRED_ATTRIBUTE'
          });
        }

        if (rule.weight < 0 || rule.weight > 10) {
          errors.push({
            field: `rules[${index}].weight`,
            message: 'Weight must be between 0 and 10',
            severity: 'error',
            code: 'INVALID_WEIGHT'
          });
        }

        // Validate constraint has at least one value
        const constraintValues = Object.values(rule.constraint || {});
        if (constraintValues.length === 0 || constraintValues.every(v => v === '' || v === null || v === undefined)) {
          errors.push({
            field: `rules[${index}].constraint`,
            message: 'At least one constraint value is required',
            severity: 'error',
            code: 'EMPTY_CONSTRAINT'
          });
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings: []
      };
    },
    `rules-${rules.length}-${rules.map(r => r.id).join('-')}`
  );

  // Trigger validation callback when validation result changes
  React.useEffect(() => {
    if (onValidation) {
      onValidation(validateRules);
    }
  }, [validateRules, onValidation]);

  // Optimized rule creation with performance tracking
  const createNewRule = useCallback(() => {
    const newRule: ProtocolMatchingRule = {
      id: `rule-${Date.now()}`,
      weight: 1,
      attribute: 'Modality',
      constraint: { equals: '' },
      required: false
    };

    const newRules = [...rules, newRule];
    onRulesChange(newRules);
    setExpandedRule(newRule.id!);
  }, [rules, onRulesChange]);

  // Optimized rule updates with batching
  const updateRule = useCallback((index: number, updates: Partial<ProtocolMatchingRule>) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    onRulesChange(newRules);
  }, [rules, onRulesChange]);

  // Optimized constraint updates
  const updateConstraint = useCallback((index: number, constraint: Constraint) => {
    updateRule(index, { constraint });
  }, [updateRule]);

  // Optimized rule removal
  const removeRule = useCallback((index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    onRulesChange(newRules);
  }, [rules, onRulesChange]);

  // Optimized drag and drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedRuleIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((targetIndex: number) => {
    if (draggedRuleIndex === null) return;

    const newRules = [...rules];
    const draggedRule = newRules[draggedRuleIndex];
    newRules.splice(draggedRuleIndex, 1);
    newRules.splice(targetIndex, 0, draggedRule);

    onRulesChange(newRules);
    setDraggedRuleIndex(null);
  }, [draggedRuleIndex, rules, onRulesChange]);

  // Optimized rule expansion toggle
  const toggleRuleExpansion = useCallback((ruleId: string) => {
    setExpandedRule(current => current === ruleId ? null : ruleId);
  }, []);

  return (
    <div className="study-matching-rules">
      <div className="rules-header">
        <h4>Study Matching Rules</h4>
        <button 
          onClick={createNewRule}
          disabled={disabled}
          className="add-rule-btn"
          title="Add new matching rule"
        >
          <span>+ Add Rule</span>
        </button>
      </div>

      <div className="rules-description">
        <p>Define rules to match studies for this hanging protocol. Rules are evaluated in order with higher weights taking precedence.</p>
      </div>

      <RulesList
        rules={rules}
        expandedRule={expandedRule}
        draggedRuleIndex={draggedRuleIndex}
        attributes={attributes}
        onToggleExpansion={toggleRuleExpansion}
        onUpdateRule={updateRule}
        onUpdateConstraint={updateConstraint}
        onRemoveRule={removeRule}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        getConstraintTypes={getConstraintTypes}
        disabled={disabled}
      />

      <style>{`
        .study-matching-rules {
          width: 100%;
          padding: 16px;
          background: var(--color-panel);
          border-radius: 8px;
          border: 1px solid var(--color-border);
        }

        .rules-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .rules-header h4 {
          margin: 0;
          color: var(--color-text);
          font-size: 16px;
          font-weight: 600;
        }

        .add-rule-btn {
          padding: 8px 16px;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .add-rule-btn:hover:not(:disabled) {
          background: var(--color-primary-dark);
        }

        .add-rule-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .rules-description {
          margin-bottom: 16px;
          padding: 12px;
          background: var(--color-background);
          border-radius: 6px;
          border-left: 4px solid var(--color-primary);
        }

        .rules-description p {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: 14px;
          line-height: 1.4;
        }

        .no-rules-message {
          text-align: center;
          padding: 32px;
          color: var(--color-text-secondary);
          font-style: italic;
        }

        .rules-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rule-item {
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          overflow: hidden;
          transition: all 0.2s;
        }

        .rule-item:hover {
          border-color: var(--color-primary);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .rule-item.dragging {
          opacity: 0.5;
          transform: rotate(2deg);
        }

        .rule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          background: var(--color-background);
        }

        .rule-summary {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .rule-drag-handle {
          color: var(--color-text-secondary);
          cursor: grab;
          font-size: 12px;
          padding: 4px;
        }

        .rule-drag-handle:active {
          cursor: grabbing;
        }

        .rule-attribute {
          font-weight: 600;
          color: var(--color-text);
          background: var(--color-primary);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .rule-weight {
          background: var(--color-secondary);
          color: var(--color-text);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .rule-constraint-summary {
          color: var(--color-text-secondary);
          font-size: 12px;
          font-family: monospace;
          background: var(--color-panel);
          padding: 2px 6px;
          border-radius: 3px;
        }

        .rule-actions {
          display: flex;
          gap: 4px;
        }

        .expand-btn, .remove-rule-btn {
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.2s;
        }

        .expand-btn {
          background: var(--color-secondary);
          color: var(--color-text);
        }

        .expand-btn:hover {
          background: var(--color-secondary-dark);
        }

        .remove-rule-btn {
          background: var(--color-danger);
          color: white;
        }

        .remove-rule-btn:hover:not(:disabled) {
          background: var(--color-danger-dark);
        }

        .remove-rule-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .rule-details {
          padding: 16px;
          border-top: 1px solid var(--color-border);
          background: var(--color-panel);
        }

        .rule-config-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .config-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .config-group label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .attribute-select, .weight-input {
          padding: 8px;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          background: var(--color-background);
          color: var(--color-text);
          font-size: 14px;
        }

        .attribute-select:focus, .weight-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
        }

        .constraint-section {
          margin-top: 16px;
        }

        .constraint-section > label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .constraint-builder {
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          padding: 12px;
        }

        .constraint-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .constraint-option {
          padding: 8px;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          background: var(--color-panel);
          transition: all 0.2s;
        }

        .constraint-option.active {
          border-color: var(--color-primary);
          background: rgba(96, 165, 250, 0.1);
        }

        .constraint-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 4px;
          cursor: pointer;
        }

        .constraint-input {
          width: 100%;
          padding: 6px;
          border: 1px solid var(--color-border);
          border-radius: 3px;
          background: var(--color-background);
          color: var(--color-text);
          font-size: 12px;
        }

        .constraint-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        @media (max-width: 768px) {
          .rule-config-grid {
            grid-template-columns: 1fr;
          }
          
          .constraint-type-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default memo(StudyMatchingRules); 