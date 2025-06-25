import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getStudyComparisonOptimizer } from '../services/StudyComparisonOptimizer';
import { usePerformanceMonitoring } from '../hooks/usePerformanceMonitoring';

/**
 * Optimized Study Comparison Component - OHIF v3 Enhanced System
 * 
 * Task 10.3: Study Comparison Highlighting Optimization
 * 
 * COMPONENT FEATURES:
 * - GPU-accelerated difference highlighting
 * - Progressive rendering for smooth UX
 * - Intelligent threshold adjustment
 * - Memory-efficient viewport rendering
 * - Real-time performance monitoring
 * - Adaptive highlighting strategies
 */

const OptimizedStudyComparison = ({
  study1,
  study2,
  viewportId1,
  viewportId2,
  highlightingEnabled = true,
  threshold = 0.15,
  useGPUAcceleration = true,
  progressiveHighlighting = true,
  onComparisonComplete,
  onHighlightClick,
  className = ''
}) => {
  // State management
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const [highlightOpacity, setHighlightOpacity] = useState(0.7);
  const [adaptiveThreshold, setAdaptiveThreshold] = useState(threshold);
  const [performanceStats, setPerformanceStats] = useState({});

  // Refs
  const comparisonOptimizer = useRef(null);
  const highlightCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Hooks
  const { recordMetric, trackInteraction } = usePerformanceMonitoring();

  // Initialize optimizer
  useEffect(() => {
    comparisonOptimizer.current = getStudyComparisonOptimizer();
  }, []);

  // Memoized comparison options
  const comparisonOptions = useMemo(() => ({
    threshold: adaptiveThreshold,
    adaptiveThreshold: true,
    useGPUAcceleration,
    progressiveHighlighting,
    onProgress: setLoadingProgress
  }), [adaptiveThreshold, useGPUAcceleration, progressiveHighlighting]);

  /**
   * Perform optimized study comparison
   */
  const performComparison = useCallback(async () => {
    if (!study1 || !study2 || !comparisonOptimizer.current) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);

    try {
      console.log('[OptimizedStudyComparison] Starting optimized comparison');
      
      const startTime = performance.now();
      
      const result = await comparisonOptimizer.current.compareStudiesWithHighlighting(
        study1,
        study2,
        comparisonOptions
      );

      const duration = performance.now() - startTime;
      
      setComparisonResult(result);
      setPerformanceStats(comparisonOptimizer.current.getPerformanceStats());
      
      // Record performance metrics
      recordMetric('study-comparison', {
        duration,
        strategy: result.strategy,
        totalDifferences: result.totalDifferences,
        success: true
      });

      // Trigger callback
      if (onComparisonComplete) {
        onComparisonComplete(result);
      }

      console.log([OptimizedStudyComparison] Comparison completed in ms using );

    } catch (err) {
      console.error('[OptimizedStudyComparison] Comparison failed:', err);
      setError(err.message);
      
      recordMetric('study-comparison', {
        error: err.message,
        success: false
      });
    } finally {
      setIsLoading(false);
      setLoadingProgress(100);
    }
  }, [study1, study2, comparisonOptions, recordMetric, onComparisonComplete]);

  /**
   * Render highlights on canvas overlay
   */
  const renderHighlights = useCallback(() => {
    if (!comparisonResult?.highlights || !highlightCanvasRef.current) {
      return;
    }

    const canvas = highlightCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set highlight style
    ctx.globalAlpha = highlightOpacity;
    ctx.fillStyle = 'rgba(255, 165, 0, 0.8)'; // Orange highlight
    ctx.strokeStyle = 'rgba(255, 140, 0, 1)'; // Darker orange border
    ctx.lineWidth = 1;

    // Render highlights efficiently
    const highlights = comparisonResult.highlights;
    
    if (highlights.length > 1000) {
      // Use batched rendering for many highlights
      renderHighlightsBatched(ctx, highlights);
    } else {
      // Render individual highlights
      highlights.forEach(highlight => {
        renderSingleHighlight(ctx, highlight);
      });
    }

    ctx.globalAlpha = 1.0;
  }, [comparisonResult, highlightOpacity]);

  /**
   * Render highlights in batches for performance
   */
  const renderHighlightsBatched = (ctx, highlights) => {
    const batchSize = 100;
    let currentBatch = 0;

    const renderBatch = () => {
      const start = currentBatch * batchSize;
      const end = Math.min(start + batchSize, highlights.length);

      ctx.beginPath();
      for (let i = start; i < end; i++) {
        const highlight = highlights[i];
        ctx.rect(highlight.x, highlight.y, highlight.width || 1, highlight.height || 1);
      }
      ctx.fill();
      ctx.stroke();

      currentBatch++;
      
      if (end < highlights.length) {
        animationFrameRef.current = requestAnimationFrame(renderBatch);
      }
    };

    renderBatch();
  };

  /**
   * Render single highlight
   */
  const renderSingleHighlight = (ctx, highlight) => {
    const { x, y, width = 1, height = 1, difference = 1 } = highlight;
    
    // Vary intensity based on difference magnitude
    const alpha = Math.min(difference * 2, 1);
    ctx.globalAlpha = highlightOpacity * alpha;
    
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
  };

  /**
   * Handle highlight canvas click
   */
  const handleHighlightClick = useCallback((event) => {
    if (!comparisonResult?.highlights || !onHighlightClick) {
      return;
    }

    const canvas = highlightCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Find clicked highlight
    const clickedHighlight = comparisonResult.highlights.find(highlight =>
      x >= highlight.x && x <= highlight.x + (highlight.width || 1) &&
      y >= highlight.y && y <= highlight.y + (highlight.height || 1)
    );

    if (clickedHighlight) {
      trackInteraction('highlight-click', { x, y, difference: clickedHighlight.difference });
      onHighlightClick(clickedHighlight, { x, y });
    }
  }, [comparisonResult, onHighlightClick, trackInteraction]);

  /**
   * Adaptive threshold adjustment
   */
  const adjustThreshold = useCallback((direction) => {
    const step = 0.05;
    const newThreshold = direction === 'increase' 
      ? Math.min(adaptiveThreshold + step, 1.0)
      : Math.max(adaptiveThreshold - step, 0.0);
    
    setAdaptiveThreshold(newThreshold);
    trackInteraction('threshold-adjustment', { oldThreshold: adaptiveThreshold, newThreshold });
  }, [adaptiveThreshold, trackInteraction]);

  // Effect: Perform comparison when studies change
  useEffect(() => {
    if (study1 && study2 && highlightingEnabled) {
      performComparison();
    }
  }, [study1, study2, highlightingEnabled, performComparison]);

  // Effect: Re-render highlights when result changes
  useEffect(() => {
    if (comparisonResult) {
      renderHighlights();
    }
  }, [comparisonResult, renderHighlights]);

  // Effect: Cleanup animation frames
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  /**
   * Loading component
   */
  const LoadingIndicator = () => (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Comparing Studies</div>
          <div className="text-sm text-gray-600 mb-4">
            {progressiveHighlighting 
              ? Processing... %
              : 'Analyzing differences...'
            }
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: ${loadingProgress}% }}
            />
          </div>
          {comparisonResult?.strategy && (
            <div className="text-xs text-gray-500 mt-2">
              Strategy: {comparisonResult.strategy}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /**
   * Control panel component
   */
  const ControlPanel = () => (
    <div className="absolute top-4 right-4 bg-white bg-opacity-95 rounded-lg p-4 shadow-lg z-20">
      <div className="space-y-3">
        <div className="text-sm font-semibold">Comparison Controls</div>
        
        {/* Threshold adjustment */}
        <div className="space-y-2">
          <label className="text-xs text-gray-600">Sensitivity</label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => adjustThreshold('decrease')}
              className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
              disabled={isLoading}
            >
              -
            </button>
            <span className="text-xs font-mono w-12 text-center">
              {(adaptiveThreshold * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => adjustThreshold('increase')}
              className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
              disabled={isLoading}
            >
              +
            </button>
          </div>
        </div>

        {/* Opacity adjustment */}
        <div className="space-y-2">
          <label className="text-xs text-gray-600">Highlight Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={highlightOpacity}
            onChange={(e) => setHighlightOpacity(parseFloat(e.target.value))}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        {/* Performance stats */}
        {performanceStats.totalComparisons > 0 && (
          <div className="space-y-1 pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600">Performance</div>
            <div className="text-xs">
              Avg: {performanceStats.averageComparisonTime?.toFixed(1)}ms
            </div>
            <div className="text-xs">
              Cache: {performanceStats.cacheHitRate?.toFixed(1)}%
            </div>
            {performanceStats.gpuAccelerationEnabled && (
              <div className="text-xs text-green-600">GPU Accelerated</div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  /**
   * Error component
   */
  const ErrorIndicator = () => (
    <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 border border-red-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600 mb-2">Comparison Failed</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button
            onClick={performComparison}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={elative w-full h-full }
    >
      {/* Highlight canvas overlay */}
      {highlightingEnabled && (
        <canvas
          ref={highlightCanvasRef}
          className="absolute inset-0 pointer-events-auto cursor-pointer z-5"
          width={800}
          height={600}
          onClick={handleHighlightClick}
          style={{
            mixBlendMode: 'multiply'
          }}
        />
      )}

      {/* Control panel */}
      <ControlPanel />

      {/* Loading indicator */}
      {isLoading && <LoadingIndicator />}

      {/* Error indicator */}
      {error && <ErrorIndicator />}

      {/* Results summary */}
      {comparisonResult && !isLoading && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 rounded-lg p-3 shadow-lg z-20">
          <div className="text-sm">
            <div className="font-semibold mb-1">Comparison Results</div>
            <div className="text-xs space-y-1">
              <div>Differences: {comparisonResult.totalDifferences}</div>
              <div>Strategy: {comparisonResult.strategy}</div>
              <div>Time: {comparisonResult.processingTime?.toFixed(1)}ms</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedStudyComparison;
