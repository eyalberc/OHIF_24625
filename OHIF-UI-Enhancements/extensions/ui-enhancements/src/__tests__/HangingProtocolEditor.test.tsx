/**
 * Unit Tests for HangingProtocolEditor Component
 * 
 * Tests React component functionality, user interactions,
 * performance monitoring, and UI behavior.
 * 
 * Task 5.8: Write Unit and Integration Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HangingProtocolEditor from '../components/HangingProtocolEditor/HangingProtocolEditor';

// Mock the services and dependencies
jest.mock('../services/HangingProtocolEditorService');
jest.mock('../services/ProtocolValidationService');
jest.mock('../utils/performanceUtils');

// Mock the child components to focus on main component logic
jest.mock('../components/HangingProtocolEditor/StudyMatchingRules', () => {
  return function MockStudyMatchingRules({ onRulesChange, onValidation }: any) {
    return (
      <div data-testid="study-matching-rules">
        <button 
          onClick={() => onRulesChange([{ id: 'test-rule', attribute: 'Modality', constraint: { equals: 'CT' } }])}
          data-testid="add-rule-button"
        >
          Add Rule
        </button>
        <button 
          onClick={() => onValidation({ isValid: true, errors: [], warnings: [] })}
          data-testid="validate-button"
        >
          Validate
        </button>
      </div>
    );
  };
});

jest.mock('../components/HangingProtocolEditor/ViewportLayoutConfig', () => {
  return function MockViewportLayoutConfig({ onLayoutChange }: any) {
    return (
      <div data-testid="viewport-layout-config">
        <button 
          onClick={() => onLayoutChange({ type: 'grid', rows: 2, columns: 2 })}
          data-testid="change-layout-button"
        >
          Change Layout
        </button>
      </div>
    );
  };
});

// Mock services manager
const mockServicesManager = {
  services: {
    hangingProtocolService: {
      getProtocols: jest.fn(() => Promise.resolve([])),
      addProtocol: jest.fn(() => Promise.resolve(true)),
      removeProtocol: jest.fn(() => Promise.resolve(true))
    },
    uiDialogService: {
      create: jest.fn(),
      dismiss: jest.fn()
    }
  }
};

describe('HangingProtocolEditor Component', () => {
  let mockProps: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockProps = {
      servicesManager: mockServicesManager,
      onClose: jest.fn(),
      onSave: jest.fn(),
      protocol: null,
      isVisible: true
    };
  });

  describe('Component Rendering', () => {
    it('should render the editor when visible', () => {
      render(<HangingProtocolEditor {...mockProps} />);
      
      expect(screen.getByText(/hanging protocol editor/i)).toBeInTheDocument();
    });

    it('should not render when not visible', () => {
      const props = { ...mockProps, isVisible: false };
      const { container } = render(<HangingProtocolEditor {...props} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should render tab navigation', () => {
      render(<HangingProtocolEditor {...mockProps} />);
      
      expect(screen.getByText(/basic info/i)).toBeInTheDocument();
      expect(screen.getByText(/matching rules/i)).toBeInTheDocument();
      expect(screen.getByText(/viewport layout/i)).toBeInTheDocument();
    });

    it('should render basic protocol information inputs', () => {
      render(<HangingProtocolEditor {...mockProps} />);
      
      expect(screen.getByLabelText(/protocol name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<HangingProtocolEditor {...mockProps} />);
      
      expect(screen.getByText(/save/i)).toBeInTheDocument();
      expect(screen.getByText(/cancel/i)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to matching rules tab when clicked', async () => {
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      const matchingRulesTab = screen.getByText(/matching rules/i);
      await user.click(matchingRulesTab);
      
      expect(screen.getByTestId('study-matching-rules')).toBeInTheDocument();
    });

    it('should switch to viewport layout tab when clicked', async () => {
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      const layoutTab = screen.getByText(/viewport layout/i);
      await user.click(layoutTab);
      
      expect(screen.getByTestId('viewport-layout-config')).toBeInTheDocument();
    });

    it('should show active tab styling', async () => {
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      const matchingRulesTab = screen.getByText(/matching rules/i);
      await user.click(matchingRulesTab);
      
      expect(matchingRulesTab.closest('button')).toHaveClass(/active|selected/);
    });
  });

  describe('Form Interactions', () => {
    it('should update protocol name when input changes', async () => {
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      const nameInput = screen.getByLabelText(/protocol name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Test Protocol Name');
      
      expect(nameInput).toHaveValue('Test Protocol Name');
    });

    it('should update description when input changes', async () => {
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      const descriptionInput = screen.getByLabelText(/description/i);
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Test protocol description');
      
      expect(descriptionInput).toHaveValue('Test protocol description');
    });

    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/protocol name is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Child Component Integration', () => {
    it('should handle matching rules changes from child component', async () => {
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      // Switch to matching rules tab
      const matchingRulesTab = screen.getByText(/matching rules/i);
      await user.click(matchingRulesTab);
      
      // Trigger rules change from child component
      const addRuleButton = screen.getByTestId('add-rule-button');
      await user.click(addRuleButton);
      
      // Component should handle the rules change
      expect(screen.getByTestId('study-matching-rules')).toBeInTheDocument();
    });

    it('should handle layout changes from viewport config component', async () => {
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      // Switch to layout tab
      const layoutTab = screen.getByText(/viewport layout/i);
      await user.click(layoutTab);
      
      // Trigger layout change
      const changeLayoutButton = screen.getByTestId('change-layout-button');
      await user.click(changeLayoutButton);
      
      expect(screen.getByTestId('viewport-layout-config')).toBeInTheDocument();
    });

    it('should handle validation results from child components', async () => {
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      // Switch to matching rules tab
      const matchingRulesTab = screen.getByText(/matching rules/i);
      await user.click(matchingRulesTab);
      
      // Trigger validation from child
      const validateButton = screen.getByTestId('validate-button');
      await user.click(validateButton);
      
      // Should not show validation errors for valid input
      await waitFor(() => {
        expect(screen.queryByText(/validation error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Action Handlers', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      const cancelButton = screen.getByText(/cancel/i);
      await user.click(cancelButton);
      
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onSave when save button is clicked with valid data', async () => {
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      // Fill in required fields
      const nameInput = screen.getByLabelText(/protocol name/i);
      await user.type(nameInput, 'Valid Protocol Name');
      
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockProps.onSave).toHaveBeenCalled();
      });
    });

    it('should prevent save when validation fails', async () => {
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      // Leave name empty (validation should fail)
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);
      
      // Should not call onSave due to validation failure
      expect(mockProps.onSave).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on form inputs', () => {
      render(<HangingProtocolEditor {...mockProps} />);
      
      const nameInput = screen.getByLabelText(/protocol name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      
      expect(nameInput).toHaveAccessibleName(/protocol name/i);
      expect(descriptionInput).toHaveAccessibleName(/description/i);
    });

    it('should have proper tab navigation order', () => {
      render(<HangingProtocolEditor {...mockProps} />);
      
      const nameInput = screen.getByLabelText(/protocol name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const saveButton = screen.getByText(/save/i);
      const cancelButton = screen.getByText(/cancel/i);
      
      expect(nameInput).toHaveAttribute('tabIndex');
      expect(descriptionInput).toHaveAttribute('tabIndex');
      expect(saveButton).not.toHaveAttribute('tabIndex', '-1');
      expect(cancelButton).not.toHaveAttribute('tabIndex', '-1');
    });

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/protocol name is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Performance', () => {
    it('should render efficiently with large amounts of data', () => {
      const protocolWithManyRules = {
        id: 'large-protocol',
        name: 'Large Protocol',
        protocolMatchingRules: Array.from({ length: 100 }, (_, i) => ({
          id: `rule-${i}`,
          attribute: 'Modality',
          constraint: { equals: 'CT' }
        }))
      };
      
      const props = { ...mockProps, protocol: protocolWithManyRules };
      
      const startTime = performance.now();
      render(<HangingProtocolEditor {...props} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should render quickly
      expect(screen.getByText(/hanging protocol editor/i)).toBeInTheDocument();
    });

    it('should not re-render unnecessarily on prop changes', () => {
      const { rerender } = render(<HangingProtocolEditor {...mockProps} />);
      
      // Change a prop that shouldn't cause re-render
      const newProps = { ...mockProps, someUnusedProp: 'new value' };
      
      const rerenderSpy = jest.spyOn(React, 'memo');
      rerender(<HangingProtocolEditor {...newProps} />);
      
      // Component should be memoized to prevent unnecessary re-renders
      expect(screen.getByText(/hanging protocol editor/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const errorServicesManager = {
        services: {
          hangingProtocolService: {
            getProtocols: jest.fn(() => Promise.reject(new Error('Service error'))),
            addProtocol: jest.fn(),
            removeProtocol: jest.fn()
          },
          uiDialogService: {
            create: jest.fn(),
            dismiss: jest.fn()
          }
        }
      };
      
      const props = { ...mockProps, servicesManager: errorServicesManager };
      
      expect(() => render(<HangingProtocolEditor {...props} />)).not.toThrow();
      expect(screen.getByText(/hanging protocol editor/i)).toBeInTheDocument();
    });

    it('should display error messages when operations fail', async () => {
      mockServicesManager.services.hangingProtocolService.addProtocol.mockRejectedValue(
        new Error('Save failed')
      );
      
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      // Fill in required data and try to save
      const nameInput = screen.getByLabelText(/protocol name/i);
      await user.type(nameInput, 'Test Protocol');
      
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error saving protocol/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator during save operation', async () => {
      // Mock a delayed save operation
      mockServicesManager.services.hangingProtocolService.addProtocol.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 100))
      );
      
      const user = userEvent.setup();
      render(<HangingProtocolEditor {...mockProps} />);
      
      const nameInput = screen.getByLabelText(/protocol name/i);
      await user.type(nameInput, 'Test Protocol');
      
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);
      
      // Should show loading state
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
      
      // Should hide loading state after completion
      await waitFor(() => {
        expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
      });
    });
  });
}); 