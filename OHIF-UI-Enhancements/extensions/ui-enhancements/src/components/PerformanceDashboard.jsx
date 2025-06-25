import React, { useState, useEffect, useRef } from 'react';
import { getPerformanceMonitor } from '../services/PerformanceMonitoringService';

/**
 * Performance Dashboard Component - OHIF v3 Enhanced System
 * 
 * Task 10.2: Performance Monitoring Infrastructure Setup
 * 
 * FEATURES:
 * - Real-time performance metrics visualization
 * - Memory usage monitoring with visual indicators
 * - Frame rate tracking with alerts
 * - Network performance monitoring
 * - User interaction analytics
 * - Export functionality for performance data
 */

const PerformanceDashboard = ({ visible = false, onToggle }) => {
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [systemInfo, setSystemInfo] = useState({});
  const [isMinimized, setIsMinimized] = useState(false);
  const performanceMonitor = useRef(null);
  const updateInterval = useRef(null);

  useEffect(() => {
    performanceMonitor.current = getPerformanceMonitor();
    
    if (visible) {
      updateMetrics();
      startPeriodicUpdate();
    } else {
      stopPeriodicUpdate();
    }

    // Listen for performance alerts
    const handleAlert = (event) => {
      setAlerts(prev => [...prev.slice(-9), event.detail]);
    };

    window.addEventListener('ohif-performance-alert', handleAlert);

    return () => {
      stopPeriodicUpdate();
      window.removeEventListener('ohif-performance-alert', handleAlert);
    };
  }, [visible]);

  const updateMetrics = () => {
    if (performanceMonitor.current) {
      const summary = performanceMonitor.current.getPerformanceSummary();
      setMetrics(summary.metrics || {});
      setSystemInfo(summary.systemInfo || {});
    }
  };

  const startPeriodicUpdate = () => {
    updateInterval.current = setInterval(updateMetrics, 1000);
  };

  const stopPeriodicUpdate = () => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }
  };

  const exportData = () => {
    if (performanceMonitor.current) {
      const data = performanceMonitor.current.exportPerformanceData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = ohif-performance-.json;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms) => {
    if (!ms) return '0ms';
    return ${ms.toFixed(1)}ms;
  };

  const getStatusColor = (category, value) => {
    switch (category) {
      case 'memory':
        const memoryUsage = systemInfo.memory?.usedJSHeapSize || 0;
        const memoryLimit = 500 * 1024 * 1024; // 500MB threshold
        return memoryUsage > memoryLimit ? '#ff4444' : '#4CAF50';
      
      case 'framerate':
        const fps = metrics.framerate?.recent?.[0]?.fps || 0;
        return fps < 30 ? '#ff4444' : fps < 45 ? '#ff9800' : '#4CAF50';
      
      case 'network':
        const rtt = systemInfo.connection?.rtt || 0;
        return rtt > 1000 ? '#ff4444' : rtt > 500 ? '#ff9800' : '#4CAF50';
      
      default:
        return '#2196F3';
    }
  };

  if (!visible) return null;

  const dashboardStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: isMinimized ? '200px' : '450px',
    height: isMinimized ? '60px' : '500px',
    background: 'rgba(0, 0, 0, 0.95)',
    color: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    fontFamily: '"Roboto Mono", monospace',
    fontSize: '13px',
    zIndex: 10000,
    border: '1px solid #333',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(8px)',
    overflow: isMinimized ? 'hidden' : 'auto',
    transition: 'all 0.3s ease'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMinimized ? '0' : '16px',
    paddingBottom: isMinimized ? '0' : '8px',
    borderBottom: isMinimized ? 'none' : '1px solid #333'
  };

  const buttonStyle = {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    transition: 'background 0.2s'
  };

  const metricStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const statusDotStyle = (color) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: color,
    marginLeft: '8px'
  });

  return (
    <div style={dashboardStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0, color: '#2196F3', fontSize: '16px' }}>
           Performance Monitor
        </h3>
        <div>
          <button
            style={{ ...buttonStyle, background: '#333' }}
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '' : ''}
          </button>
          <button
            style={{ ...buttonStyle, background: '#333', marginLeft: '4px' }}
            onClick={exportData}
            title="Export Data"
          >
            
          </button>
          <button
            style={{ ...buttonStyle, background: '#333', marginLeft: '4px' }}
            onClick={onToggle}
            title="Close"
          >
            
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* System Metrics */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#4CAF50', margin: '0 0 8px 0', fontSize: '14px' }}>
              System Metrics
            </h4>
            
            {systemInfo.memory && (
              <div style={metricStyle}>
                <span>Memory:</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>{formatBytes(systemInfo.memory.usedJSHeapSize)}</span>
                  <div style={statusDotStyle(getStatusColor('memory'))} />
                </div>
              </div>
            )}

            {metrics.framerate && (
              <div style={metricStyle}>
                <span>Frame Rate:</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>{(metrics.framerate.recent?.[0]?.fps || 0).toFixed(1)} FPS</span>
                  <div style={statusDotStyle(getStatusColor('framerate'))} />
                </div>
              </div>
            )}

            {systemInfo.connection && (
              <div style={metricStyle}>
                <span>Network:</span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>{systemInfo.connection.effectiveType} ({systemInfo.connection.rtt}ms)</span>
                  <div style={statusDotStyle(getStatusColor('network'))} />
                </div>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#ff9800', margin: '0 0 8px 0', fontSize: '14px' }}>
              Performance Metrics
            </h4>
            
            {Object.entries(metrics).map(([category, data]) => {
              if (category === 'framerate' || !data.averageDuration) return null;
              
              return (
                <div key={category} style={metricStyle}>
                  <span style={{ textTransform: 'capitalize' }}>{category.replace('-', ' ')}:</span>
                  <div style={{ textAlign: 'right' }}>
                    <div>{formatDuration(data.averageDuration)} avg</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                      {data.count} total
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ color: '#f44336', margin: '0 0 8px 0', fontSize: '14px' }}>
                Recent Alerts
              </h4>
              <div style={{ maxHeight: '120px', overflow: 'auto' }}>
                {alerts.slice(-5).map((alert, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '6px 8px',
                      margin: '4px 0',
                      background: 'rgba(244, 67, 54, 0.1)',
                      border: '1px solid rgba(244, 67, 54, 0.3)',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}
                  >
                    <div style={{ color: '#f44336', fontWeight: 'bold' }}>
                      {alert.type.toUpperCase()}
                    </div>
                    <div style={{ color: '#ccc' }}>
                      {alert.message}
                    </div>
                    <div style={{ color: '#888', fontSize: '10px' }}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ 
            fontSize: '11px', 
            color: '#666', 
            textAlign: 'center',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #333'
          }}>
            OHIF v3 Enhanced Performance Monitor
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceDashboard;
