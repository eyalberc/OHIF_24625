/**
 * Performance Monitoring Integration Utilities - OHIF v3 Enhanced System
 * 
 * Task 10.2: Performance Monitoring Infrastructure Setup
 * 
 * INTEGRATION UTILITIES:
 * - OHIF service integration hooks
 * - Cornerstone viewport performance tracking
 * - DICOM loading performance monitoring  
 * - Extension lifecycle tracking
 * - Study navigation performance analysis
 */

import { getPerformanceMonitor, initializePerformanceMonitoring } from '../services/PerformanceMonitoringService';
import PerformanceDashboard from '../components/PerformanceDashboard';

/**
 * Initialize performance monitoring for OHIF extension
 */
export function initializeOHIFPerformanceMonitoring(extensionManager, commandsManager) {
  console.log('[PerformanceIntegration] Initializing OHIF performance monitoring');

  // Initialize the performance monitoring service
  const performanceMonitor = initializePerformanceMonitoring({
    thresholds: {
      studyLoadTime: 8000, // 8 seconds for medical imaging
      toolActivationTime: 300, // 300ms for tools
      viewportRenderTime: 150, // 150ms for viewport operations
      memoryUsage: 1024 * 1024 * 1024, // 1GB for medical imaging
      frameRate: 25, // 25 FPS minimum for medical imaging
      networkLatency: 2000, // 2 seconds for DICOM requests
    }
  });

  // Hook into OHIF study loading
  if (extensionManager && extensionManager.onModeEnter) {
    const originalOnModeEnter = extensionManager.onModeEnter;
    extensionManager.onModeEnter = function(mode) {
      const studyPerf = performanceMonitor.instrumentStudyLoading(mode.studyInstanceUID || 'unknown');
      studyPerf.start();
      
      const result = originalOnModeEnter.call(this, mode);
      
      // End measurement after mode is loaded
      setTimeout(() => {
        studyPerf.end();
      }, 100);
      
      return result;
    };
  }

  // Hook into command execution for tool performance
  if (commandsManager && commandsManager.run) {
    const originalRun = commandsManager.run;
    commandsManager.run = function(commandDefinition, options, context) {
      const toolPerf = performanceMonitor.instrumentToolActivation(commandDefinition.commandName);
      toolPerf.start();
      
      const result = originalRun.call(this, commandDefinition, options, context);
      
      // Handle both sync and async results
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          toolPerf.end();
        });
      } else {
        toolPerf.end();
        return result;
      }
    };
  }

  console.log('[PerformanceIntegration] OHIF performance monitoring initialized');
  return performanceMonitor;
}

/**
 * Hook into Cornerstone viewport events for performance tracking
 */
export function instrumentCornerstonePerformance(cornerstoneViewportService) {
  const performanceMonitor = getPerformanceMonitor();
  
  if (!performanceMonitor || !cornerstoneViewportService) {
    console.warn('[PerformanceIntegration] Cannot instrument Cornerstone - missing dependencies');
    return;
  }

  console.log('[PerformanceIntegration] Instrumenting Cornerstone viewport performance');

  // Track viewport rendering
  const originalSetViewports = cornerstoneViewportService.setViewports;
  if (originalSetViewports) {
    cornerstoneViewportService.setViewports = function(viewports) {
      const viewportPerf = performanceMonitor.instrumentViewportManipulation('all', 'setViewports');
      viewportPerf.start();
      
      const result = originalSetViewports.call(this, viewports);
      
      // End measurement after viewports are set
      setTimeout(() => {
        viewportPerf.end();
      }, 50);
      
      return result;
    };
  }

  // Track individual viewport operations
  const originalRenderViewport = cornerstoneViewportService.renderViewport;
  if (originalRenderViewport) {
    cornerstoneViewportService.renderViewport = function(viewportId) {
      const viewportPerf = performanceMonitor.instrumentViewportManipulation(viewportId, 'render');
      viewportPerf.start();
      
      const result = originalRenderViewport.call(this, viewportId);
      
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          viewportPerf.end();
        });
      } else {
        viewportPerf.end();
        return result;
      }
    };
  }
}

/**
 * Hook into DICOM data source for loading performance
 */
export function instrumentDICOMPerformance(dataSourceManager) {
  const performanceMonitor = getPerformanceMonitor();
  
  if (!performanceMonitor || !dataSourceManager) {
    console.warn('[PerformanceIntegration] Cannot instrument DICOM - missing dependencies');
    return;
  }

  console.log('[PerformanceIntegration] Instrumenting DICOM loading performance');

  // Track study loading
  dataSourceManager.getActiveDataSources().forEach(dataSource => {
    if (dataSource.query && dataSource.query.studies) {
      const originalQueryStudies = dataSource.query.studies.search;
      if (originalQueryStudies) {
        dataSource.query.studies.search = function(filters) {
          const studyQueryPerf = performanceMonitor.instrumentStudyLoading('study-query');
          studyQueryPerf.start();
          
          const result = originalQueryStudies.call(this, filters);
          
          if (result && typeof result.then === 'function') {
            return result.finally(() => {
              studyQueryPerf.end();
            });
          } else {
            studyQueryPerf.end();
            return result;
          }
        };
      }
    }

    // Track series loading
    if (dataSource.query && dataSource.query.series) {
      const originalQuerySeries = dataSource.query.series.search;
      if (originalQuerySeries) {
        dataSource.query.series.search = function(filters) {
          const seriesQueryPerf = performanceMonitor.instrumentStudyLoading('series-query');
          seriesQueryPerf.start();
          
          const result = originalQuerySeries.call(this, filters);
          
          if (result && typeof result.then === 'function') {
            return result.finally(() => {
              seriesQueryPerf.end();
            });
          } else {
            seriesQueryPerf.end();
            return result;
          }
        };
      }
    }
  });
}

/**
 * Create performance dashboard toggle for development
 */
export function createPerformanceDashboardToggle() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  let dashboardVisible = false;
  let dashboardComponent = null;

  const toggleDashboard = () => {
    dashboardVisible = !dashboardVisible;
    
    if (dashboardVisible && !dashboardComponent) {
      // Create dashboard component
      dashboardComponent = document.createElement('div');
      dashboardComponent.id = 'ohif-performance-dashboard-container';
      document.body.appendChild(dashboardComponent);
      
      // Render React component
      const React = require('react');
      const ReactDOM = require('react-dom');
      
      ReactDOM.render(
        React.createElement(PerformanceDashboard, {
          visible: true,
          onToggle: toggleDashboard
        }),
        dashboardComponent
      );
    } else if (!dashboardVisible && dashboardComponent) {
      // Remove dashboard
      document.body.removeChild(dashboardComponent);
      dashboardComponent = null;
    }
  };

  // Create toggle button
  const toggleButton = document.createElement('button');
  toggleButton.innerHTML = '';
  toggleButton.title = 'Toggle Performance Dashboard';
  toggleButton.style.cssText = 
    position: fixed;
    top: 20px;
    right: 480px;
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  ;

  toggleButton.addEventListener('click', toggleDashboard);
  toggleButton.addEventListener('mouseenter', () => {
    toggleButton.style.transform = 'scale(1.1)';
    toggleButton.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
  });
  toggleButton.addEventListener('mouseleave', () => {
    toggleButton.style.transform = 'scale(1)';
    toggleButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
  });

  document.body.appendChild(toggleButton);

  return {
    toggle: toggleDashboard,
    destroy: () => {
      if (dashboardComponent) {
        document.body.removeChild(dashboardComponent);
      }
      document.body.removeChild(toggleButton);
    }
  };
}

/**
 * Track user navigation performance
 */
export function instrumentNavigationPerformance(navigationService) {
  const performanceMonitor = getPerformanceMonitor();
  
  if (!performanceMonitor || !navigationService) {
    console.warn('[PerformanceIntegration] Cannot instrument navigation - missing dependencies');
    return;
  }

  console.log('[PerformanceIntegration] Instrumenting navigation performance');

  // Track study navigation
  const originalNavigateToStudy = navigationService.navigateToStudy;
  if (originalNavigateToStudy) {
    navigationService.navigateToStudy = function(studyInstanceUID) {
      const navPerf = performanceMonitor.instrumentStudyLoading(
avigate-);
      navPerf.start();
      
      const result = originalNavigateToStudy.call(this, studyInstanceUID);
      
      // End measurement after navigation completes
      setTimeout(() => {
        navPerf.end();
      }, 100);
      
      return result;
    };
  }

  // Track series navigation
  const originalNavigateToSeries = navigationService.navigateToSeries;
  if (originalNavigateToSeries) {
    navigationService.navigateToSeries = function(seriesInstanceUID) {
      const navPerf = performanceMonitor.instrumentViewportManipulation('navigation', 'series');
      navPerf.start();
      
      const result = originalNavigateToSeries.call(this, seriesInstanceUID);
      
      setTimeout(() => {
        navPerf.end();
      }, 50);
      
      return result;
    };
  }
}

/**
 * Monitor hanging protocol performance
 */
export function instrumentHangingProtocolPerformance(hangingProtocolService) {
  const performanceMonitor = getPerformanceMonitor();
  
  if (!performanceMonitor || !hangingProtocolService) {
    console.warn('[PerformanceIntegration] Cannot instrument hanging protocol - missing dependencies');
    return;
  }

  console.log('[PerformanceIntegration] Instrumenting hanging protocol performance');

  const originalApplyProtocol = hangingProtocolService.addProtocol;
  if (originalApplyProtocol) {
    hangingProtocolService.addProtocol = function(protocol) {
      const protocolPerf = performanceMonitor.instrumentViewportManipulation('hanging-protocol', 'apply');
      protocolPerf.start();
      
      const result = originalApplyProtocol.call(this, protocol);
      
      setTimeout(() => {
        protocolPerf.end();
      }, 100);
      
      return result;
    };
  }
}

/**
 * Complete OHIF performance integration setup
 */
export function setupCompleteOHIFPerformanceIntegration(servicesManager) {
  console.log('[PerformanceIntegration] Setting up complete OHIF performance integration');

  const services = servicesManager.services;
  
  // Initialize base performance monitoring
  const performanceMonitor = initializeOHIFPerformanceMonitoring(
    services.extensionManager,
    services.commandsManager
  );

  // Instrument individual services
  if (services.cornerstoneViewportService) {
    instrumentCornerstonePerformance(services.cornerstoneViewportService);
  }

  if (services.dataSourceManager) {
    instrumentDICOMPerformance(services.dataSourceManager);
  }

  if (services.navigationService) {
    instrumentNavigationPerformance(services.navigationService);
  }

  if (services.hangingProtocolService) {
    instrumentHangingProtocolPerformance(services.hangingProtocolService);
  }

  // Create development dashboard if in development mode
  let dashboardToggle = null;
  if (process.env.NODE_ENV === 'development') {
    dashboardToggle = createPerformanceDashboardToggle();
  }

  // Export performance data periodically in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const summary = performanceMonitor.getPerformanceSummary();
      console.log('[PerformanceIntegration] Performance Summary:', summary);
    }, 30000); // Every 30 seconds
  }

  return {
    performanceMonitor,
    dashboardToggle,
    destroy: () => {
      if (dashboardToggle) {
        dashboardToggle.destroy();
      }
      if (performanceMonitor) {
        performanceMonitor.destroy();
      }
    }
  };
}

export default {
  initializeOHIFPerformanceMonitoring,
  instrumentCornerstonePerformance,
  instrumentDICOMPerformance,
  createPerformanceDashboardToggle,
  instrumentNavigationPerformance,
  instrumentHangingProtocolPerformance,
  setupCompleteOHIFPerformanceIntegration
};
