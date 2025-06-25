/**
 * OHIF v3 Hanging Protocol TypeScript Definitions
 * 
 * Comprehensive types matching OHIF v3 HangingProtocolService structure
 * for enterprise-grade Hanging Protocol Editor implementation.
 * 
 * Task 5.1: HangingProtocolService Integration
 */

/**
 * Core constraint types for matching rules
 */
export interface Constraint {
  equals?: string | number | boolean;
  doesNotEqual?: string | number | boolean;
  contains?: string | number;
  doesNotContain?: string | number;
  startsWith?: string;
  endsWith?: string;
  greaterThan?: number;
  lessThan?: number;
  greaterThanOrEqual?: number;
  lessThanOrEqual?: number;
  regex?: string;
}

/**
 * Protocol matching rules interface
 */
export interface ProtocolMatchingRule {
  id?: string;
  weight: number;
  attribute: string;
  constraint: Constraint;
  required?: boolean;
}

/**
 * Display set matching rules for viewport configuration
 */
export interface DisplaySetMatchingRule {
  id?: string;
  weight: number;
  attribute: string;
  constraint: Constraint;
  required?: boolean;
}

/**
 * Display set selector configuration
 */
export interface DisplaySetSelector {
  id: string;
  matchingRules: DisplaySetMatchingRule[];
  seriesMatchingRules?: DisplaySetMatchingRule[];
  studyMatchingRules?: DisplaySetMatchingRule[];
}

/**
 * Viewport synchronization configuration
 */
export interface ViewportSyncRule {
  type: 'voi' | 'zoom' | 'pan' | 'rotation' | 'windowLevel';
  viewports: string[];
  options?: {
    enabled?: boolean;
    syncViewportInfo?: boolean;
  };
}

/**
 * Viewport options for hanging protocol stages
 */
export interface ViewportOptions {
  viewportType?: 'stack' | 'volume' | 'video';
  toolGroupId?: string;
  orientation?: 'axial' | 'sagittal' | 'coronal' | 'acquisition';
  initialImageOptions?: {
    index?: number;
    preset?: string;
  };
  syncGroups?: ViewportSyncRule[];
  // Advanced viewport settings
  displaySetOptions?: {
    voi?: {
      windowWidth?: number;
      windowCenter?: number;
    };
    colormap?: string;
    voiInverted?: boolean;
  };
}

/**
 * Viewport configuration within a hanging protocol stage
 */
export interface Viewport {
  viewportOptions: ViewportOptions;
  displaySets: Array<{
    id: string;
    matchedDisplaySetsIndex?: number;
    options?: {
      voi?: {
        windowWidth?: number;
        windowCenter?: number;
      };
      voiInverted?: boolean;
      colormap?: string;
    };
  }>;
}

/**
 * Hanging protocol stage definition
 */
export interface ProtocolStage {
  id: string;
  name: string;
  viewportStructure: {
    layoutType: 'grid';
    properties: {
      rows: number;
      columns: number;
      layoutOptions?: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
    };
  };
  viewports: Viewport[];
  createdDate?: string;
}

/**
 * Protocol callbacks for lifecycle events
 */
export interface ProtocolCallbacks {
  onProtocolEnter?: string[];
  onProtocolExit?: string[];
  onStageEnter?: string[];
  onStageExit?: string[];
}

/**
 * Hanging protocol initiation criteria
 */
export interface HPInitiationCriteria {
  minSeriesLoaded?: number;
  minStudiesLoaded?: number;
}

/**
 * Complete OHIF v3 Hanging Protocol definition
 */
export interface OHIFHangingProtocol {
  id: string;
  hasUpdatedPriorsInformation?: boolean;
  name: string;
  description?: string;
  version?: string;
  createdDate?: string;
  modifiedDate?: string;
  availableTo?: object;
  editableBy?: object;
  protocolMatchingRules: ProtocolMatchingRule[];
  toolGroupIds?: string[];
  imageLoadStrategy?: string;
  displaySetSelectors: { [key: string]: DisplaySetSelector };
  stages: ProtocolStage[];
  numberOfPriorsReferenced?: number;
  timelineCountLimits?: {
    countMax?: number;
    countMin?: number;
  };
  callbacks?: ProtocolCallbacks;
  hpInitiationCriteria?: HPInitiationCriteria;
}

/**
 * Simplified hanging protocol for editor UI
 */
export interface EditorHangingProtocol {
  id: string;
  name: string;
  description?: string;
  modality?: string;
  bodyPart?: string;
  layout: {
    rows: number;
    columns: number;
  };
  viewports: Array<{
    seriesMatchingRules: string[];
    position: { row: number; col: number };
  }>;
  // Will be converted to/from OHIFHangingProtocol
}

/**
 * Service integration interfaces
 */
export interface HangingProtocolServiceAPI {
  getProtocols(): OHIFHangingProtocol[];
  getProtocolById(id: string): OHIFHangingProtocol | undefined;
  addProtocol(protocol: OHIFHangingProtocol): boolean;
  updateProtocol(protocol: OHIFHangingProtocol): boolean;
  removeProtocol(id: string): boolean;
  setProtocol(id: string, options?: any): void;
  validateProtocol(protocol: OHIFHangingProtocol): ValidationResult;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  code?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code?: string;
}

/**
 * Editor state management interfaces
 */
export interface EditorState {
  protocols: OHIFHangingProtocol[];
  selectedProtocol: OHIFHangingProtocol | null;
  isEditing: boolean;
  isDirty: boolean;
  validationResult: ValidationResult | null;
  currentStageIndex: number;
}

/**
 * Editor configuration options
 */
export interface EditorConfig {
  allowCustomAttributes?: boolean;
  enableAdvancedFeatures?: boolean;
  defaultLayout?: {
    rows: number;
    columns: number;
  };
  availableModalities?: string[];
  availableBodyParts?: string[];
  maxProtocolStages?: number;
}

/**
 * Protocol conversion utilities interface
 */
export interface ProtocolConverter {
  editorToOHIF(editorProtocol: EditorHangingProtocol): OHIFHangingProtocol;
  OHIFToEditor(ohifProtocol: OHIFHangingProtocol): EditorHangingProtocol;
  validateConversion(protocol: any): ValidationResult;
}

/**
 * Primary hanging protocol type alias for convenience
 */
export type HangingProtocol = OHIFHangingProtocol; 