/**
 * StudyAwareViewport Optimized Component Tests
 * 
 * Comprehensive test suite for the performance-optimized StudyAwareViewport component
 * covering React.memo, memoization, viewport visibility, and integration with StudyComparisonService.
 * 
 * Task 3.5: Unit and Integration Tests
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import StudyAwareViewport from '../components/StudyAwareViewport/StudyAwareViewport.optimized';

// Mock the StudyComparisonService
const mockStudyComparisonService = {
  getStudyType: jest.fn(),
  subscribeToStudyChanges: jest.fn(),
  formatStudyDate: jest.fn()
};

jest.mock('../services/StudyComparisonService', () => ({
  studyComparisonService: mockStudyComparisonService
}));

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock process.env for development mode testing
const originalNodeEnv = process.env.NODE_ENV;

describe('StudyAwareViewport Optimized', () => {
  const mockServicesManager = {
    services: {
      DicomMetadataStore: {
        getStudyInstanceUIDs: jest.fn(),
        getStudy: jest.fn()
      }
    }
  };

  const defaultProps = {
    viewportData: {
      StudyInstanceUID: 'study1'
    },
    servicesManager: mockServicesManager,
    viewportId: 'viewport1',
    children: <div data-testid="viewport-content">Viewport Content</div>
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockStudyComparisonService.getStudyType.mockReturnValue({
      type: 'current',
      date: '20231201',
      confidence: 0.95
    });
    
    mockStudyComparisonService.subscribeToStudyChanges.mockReturnValue(() => {});
    mockStudyComparisonService.formatStudyDate.mockReturnValue('12/01/2023');
    
    // Mock intersection observer to simulate visible viewport
    mockIntersectionObserver.mockImplementation((callback) => ({
      observe: jest.fn(() => {
        // Simulate viewport being visible
        callback([{ isIntersecting: true }]);
      }),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('Component Rendering', () => {
    it('should render children content', () => {
      render(<StudyAwareViewport {...defaultProps} />);
      
      expect(screen.getByTestId('viewport-content')).toBeInTheDocument();
    });

    it('should apply correct CSS classes for current study', () => {
      render(<StudyAwareViewport {...defaultProps} />);
      
      const viewport = screen.getByRole('region');
      expect(viewport).toHaveClass('study-aware-viewport', 'viewport-current-study');
    });

    it('should apply correct CSS classes for prior study', () => {
      mockStudyComparisonService.getStudyType.mockReturnValue({
        type: 'prior',
        date: '20231115',
        confidence: 0.85
      });
      
      render(<StudyAwareViewport {...defaultProps} />);
      
      const viewport = screen.getByRole('region');
      expect(viewport).toHaveClass('study-aware-viewport', 'viewport-prior-study');
    });

    it('should render study overlay with correct information', () => {
      render(<StudyAwareViewport {...defaultProps} />);
      
      expect(screen.getByText('Current Study')).toBeInTheDocument();
      expect(screen.getByText('12/01/2023')).toBeInTheDocument();
    });

    it('should include confidence score in development mode', () => {
      process.env.NODE_ENV = 'development';
      
      render(<StudyAwareViewport {...defaultProps} />);
      
      expect(screen.getByText('Conf: 95%')).toBeInTheDocument();
    });

    it('should not show overlay when no study date available', () => {
      mockStudyComparisonService.getStudyType.mockReturnValue({
        type: 'default',
        date: null,
        confidence: 0
      });
      
      render(<StudyAwareViewport {...defaultProps} />);
      
      expect(screen.queryByText('Current Study')).not.toBeInTheDocument();
      expect(screen.queryByText('Prior Study')).not.toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    it('should memoize study instance UID extraction', () => {
      const { rerender } = render(<StudyAwareViewport {...defaultProps} />);
      
      // Rerender with same StudyInstanceUID
      rerender(
        <StudyAwareViewport 
          {...defaultProps} 
          viewportData={{ StudyInstanceUID: 'study1' }}
        />
      );
      
      // getStudyType should only be called once due to memoization
      expect(mockStudyComparisonService.getStudyType).toHaveBeenCalledTimes(1);
    });

    it('should recalculate when StudyInstanceUID changes', () => {
      const { rerender } = render(<StudyAwareViewport {...defaultProps} />);
      
      // Change StudyInstanceUID
      rerender(
        <StudyAwareViewport 
          {...defaultProps} 
          viewportData={{ StudyInstanceUID: 'study2' }}
        />
      );
      
      expect(mockStudyComparisonService.getStudyType).toHaveBeenCalledTimes(2);
    });

    it('should not recalculate when irrelevant props change', () => {
      const Component = React.memo(StudyAwareViewport);
      const { rerender } = render(<Component {...defaultProps} />);
      
      // Change children prop (should not trigger recalculation due to React.memo)
      rerender(
        <Component 
          {...defaultProps} 
          children={<div>Different Content</div>}
        />
      );
      
      // Due to React.memo, should only be called once
      expect(mockStudyComparisonService.getStudyType).toHaveBeenCalledTimes(1);
    });
  });

  describe('Viewport Visibility Detection', () => {
    it('should setup intersection observer for viewport visibility', () => {
      render(<StudyAwareViewport {...defaultProps} />);
      
      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { threshold: 0.1 }
      );
    });

    it('should handle viewport becoming invisible', () => {
      // Mock intersection observer to simulate invisible viewport
      mockIntersectionObserver.mockImplementation((callback) => ({
        observe: jest.fn(() => {
          callback([{ isIntersecting: false }]);
        }),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      }));
      
      mockStudyComparisonService.getStudyType.mockReturnValue({
        type: 'default',
        date: null,
        confidence: 0
      });
      
      render(<StudyAwareViewport {...defaultProps} />);
      
      // Should render minimal version for invisible viewport
      const viewport = screen.getByRole('region');
      expect(viewport).toHaveClass('study-aware-viewport');
      expect(viewport).not.toHaveClass('viewport-current-study');
    });

    it('should cleanup intersection observer on unmount', () => {
      const mockDisconnect = jest.fn();
      const mockUnobserve = jest.fn();
      
      mockIntersectionObserver.mockReturnValue({
        observe: jest.fn(),
        unobserve: mockUnobserve,
        disconnect: mockDisconnect
      });
      
      const { unmount } = render(<StudyAwareViewport {...defaultProps} />);
      
      unmount();
      
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('Event Subscription Management', () => {
    it('should subscribe to study changes', () => {
      render(<StudyAwareViewport {...defaultProps} />);
      
      expect(mockStudyComparisonService.subscribeToStudyChanges).toHaveBeenCalledWith(
        expect.any(Function),
        mockServicesManager
      );
    });

    it('should unsubscribe on unmount', () => {
      const mockUnsubscribe = jest.fn();
      mockStudyComparisonService.subscribeToStudyChanges.mockReturnValue(mockUnsubscribe);
      
      const { unmount } = render(<StudyAwareViewport {...defaultProps} />);
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle study updates when visible', async () => {
      const mockCallback = jest.fn();
      mockStudyComparisonService.subscribeToStudyChanges.mockImplementation((callback) => {
        mockCallback.mockImplementation(callback);
        return jest.fn();
      });
      
      render(<StudyAwareViewport {...defaultProps} />);
      
      // Simulate study update
      mockStudyComparisonService.getStudyType.mockReturnValue({
        type: 'prior',
        date: '20231115',
        confidence: 0.8
      });
      
      mockCallback([]);
      
      await waitFor(() => {
        expect(mockStudyComparisonService.getStudyType).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should include proper ARIA attributes', () => {
      render(<StudyAwareViewport {...defaultProps} />);
      
      const viewport = screen.getByRole('region');
      expect(viewport).toHaveAttribute('aria-label', 'current study viewport');
    });

    it('should include screen reader description for study info', () => {
      render(<StudyAwareViewport {...defaultProps} />);
      
      const description = screen.getByText(/current study from 12\/01\/2023 with 95% confidence/);
      expect(description).toHaveStyle({
        position: 'absolute',
        left: '-10000px'
      });
      expect(description).toHaveAttribute('aria-live', 'polite');
    });

    it('should link overlay to description via aria-describedby', () => {
      render(<StudyAwareViewport {...defaultProps} />);
      
      const viewport = screen.getByRole('region');
      expect(viewport).toHaveAttribute('aria-describedby', 'study-info-viewport1');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing viewportData gracefully', () => {
      const propsWithoutViewportData = {
        ...defaultProps,
        viewportData: undefined
      };
      
      render(<StudyAwareViewport {...propsWithoutViewportData} />);
      
      expect(screen.getByTestId('viewport-content')).toBeInTheDocument();
      expect(mockStudyComparisonService.getStudyType).not.toHaveBeenCalled();
    });

    it('should handle missing servicesManager gracefully', () => {
      const propsWithoutServices = {
        ...defaultProps,
        servicesManager: undefined
      };
      
      render(<StudyAwareViewport {...propsWithoutServices} />);
      
      expect(screen.getByTestId('viewport-content')).toBeInTheDocument();
      expect(mockStudyComparisonService.getStudyType).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', () => {
      mockStudyComparisonService.getStudyType.mockImplementation(() => {
        throw new Error('Service error');
      });
      
      expect(() => {
        render(<StudyAwareViewport {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Memoization Behavior', () => {
    it('should memoize CSS classes', () => {
      const { rerender } = render(<StudyAwareViewport {...defaultProps} />);
      
      // Rerender with same study type
      rerender(<StudyAwareViewport {...defaultProps} />);
      
      const viewport = screen.getByRole('region');
      expect(viewport).toHaveClass('viewport-current-study');
    });

    it('should memoize formatted date', () => {
      render(<StudyAwareViewport {...defaultProps} />);
      
      expect(mockStudyComparisonService.formatStudyDate).toHaveBeenCalledWith('20231201');
      expect(mockStudyComparisonService.formatStudyDate).toHaveBeenCalledTimes(1);
    });

    it('should memoize overlay content', () => {
      const { rerender } = render(<StudyAwareViewport {...defaultProps} />);
      
      const overlay1 = screen.getByText('Current Study');
      
      // Rerender with same props
      rerender(<StudyAwareViewport {...defaultProps} />);
      
      const overlay2 = screen.getByText('Current Study');
      
      // Should be the same element reference due to memoization
      expect(overlay1).toBe(overlay2);
    });
  });

  describe('Component Props Comparison', () => {
    it('should use custom comparison function for React.memo', () => {
      const Component = React.memo(StudyAwareViewport);
      
      const props1 = {
        viewportData: { StudyInstanceUID: 'study1' },
        viewportId: 'viewport1',
        servicesManager: mockServicesManager,
        children: <div>Content</div>
      };
      
      const props2 = {
        viewportData: { StudyInstanceUID: 'study1' }, // Same UID
        viewportId: 'viewport1', // Same ID
        servicesManager: mockServicesManager, // Same service
        children: <div>Content</div> // Same children
      };
      
      const { rerender } = render(<Component {...props1} />);
      rerender(<Component {...props2} />);
      
      // Should only call getStudyType once due to memoization
      expect(mockStudyComparisonService.getStudyType).toHaveBeenCalledTimes(1);
    });
  });
}); 