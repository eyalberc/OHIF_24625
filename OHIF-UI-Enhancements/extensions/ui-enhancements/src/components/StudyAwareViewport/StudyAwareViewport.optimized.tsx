import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { studyComparisonService, StudyTypeResult } from '../../services/StudyComparisonService';

interface StudyAwareViewportProps {
  viewportData?: any;
  children?: React.ReactNode;
  servicesManager?: any;
  viewportId?: string;
}

/**
 * Performance-Optimized StudyAwareViewport Component
 * 
 * FR-3: Study Comparison Highlighting with Performance Optimizations
 * 
 * Key optimizations implemented:
 * - React.memo with custom comparison
 * - useMemo for expensive calculations
 * - useCallback for stable function references
 * - Shared service for caching and event management
 * - Viewport visibility detection
 * - Debounced updates
 * 
 * Task 3.4: Performance Optimization Implementation
 */
const StudyAwareViewport: React.FC<StudyAwareViewportProps> = React.memo(({
  viewportData,
  children,
  servicesManager,
  viewportId
}) => {
  const [studyResult, setStudyResult] = useState<StudyTypeResult>({
    type: 'default',
    date: null,
    confidence: 0
  });
  const [isVisible, setIsVisible] = useState(true); // Assume visible by default

  // Memoized study instance UID to prevent unnecessary recalculations
  const studyInstanceUID = useMemo(() => {
    return viewportData?.StudyInstanceUID || null;
  }, [viewportData?.StudyInstanceUID]);

  // Memoized study type calculation using cached service
  const cachedStudyResult = useMemo(() => {
    if (!studyInstanceUID || !servicesManager) {
      return { type: 'default' as const, date: null, confidence: 0 };
    }

    return studyComparisonService.getStudyType(studyInstanceUID, servicesManager);
  }, [studyInstanceUID, servicesManager]);

  // Update study result when cached result changes
  useEffect(() => {
    setStudyResult(cachedStudyResult);
  }, [cachedStudyResult]);

  // Stable callback for study updates
  const handleStudyUpdate = useCallback((studies: any[]) => {
    if (!studyInstanceUID || !servicesManager) return;

    // Only update if viewport is visible (performance optimization)
    if (isVisible) {
      const newResult = studyComparisonService.getStudyType(studyInstanceUID, servicesManager);
      setStudyResult(newResult);
    }
  }, [studyInstanceUID, servicesManager, isVisible]);

  // Subscribe to study changes using shared event management
  useEffect(() => {
    if (!servicesManager || !studyInstanceUID) return;

    const unsubscribe = studyComparisonService.subscribeToStudyChanges(
      handleStudyUpdate,
      servicesManager
    );

    return unsubscribe;
  }, [servicesManager, studyInstanceUID, handleStudyUpdate]);

  // Viewport visibility detection for performance optimization
  useEffect(() => {
    if (!viewportId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    // Find viewport element by ID
    const viewportElement = document.querySelector(`[data-viewport-id="${viewportId}"]`);
    if (viewportElement) {
      observer.observe(viewportElement);
    }

    return () => {
      if (viewportElement) {
        observer.unobserve(viewportElement);
      }
      observer.disconnect();
    };
  }, [viewportId]);

  // Memoized CSS classes to prevent string concatenation on every render
  const cssClasses = useMemo(() => {
    const borderClass = studyResult.type === 'current' ? 'viewport-current-study' : 
                        studyResult.type === 'prior' ? 'viewport-prior-study' : '';

    const overlayClass = studyResult.type === 'current' ? 'viewport-overlay-current' : 
                         studyResult.type === 'prior' ? 'viewport-overlay-prior' : '';

    return { borderClass, overlayClass };
  }, [studyResult.type]);

  // Memoized formatted date to prevent recalculation
  const formattedDate = useMemo(() => {
    return studyComparisonService.formatStudyDate(studyResult.date);
  }, [studyResult.date]);

  // Memoized overlay content to prevent recreation
  const overlayContent = useMemo(() => {
    if (!studyResult.date) return null;

    return (
      <div 
        className={`viewport-overlay ${cssClasses.overlayClass}`}
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          background: 'rgba(0, 0, 0, 0.85)',
          color: studyResult.type === 'current' ? 'var(--color-primary)' : 'var(--color-warning)',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.5px',
          lineHeight: 1.2,
          zIndex: 100,
          pointerEvents: 'none' as const,
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >
        <div>{studyResult.type === 'current' ? 'Current' : 'Prior'} Study</div>
        <div>{formattedDate}</div>
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ fontSize: '9px', opacity: 0.7 }}>
            Conf: {Math.round(studyResult.confidence * 100)}%
          </div>
        )}
      </div>
    );
  }, [studyResult, cssClasses.overlayClass, formattedDate]);

  // Early return for invisible viewports (performance optimization)
  if (!isVisible && studyResult.type === 'default') {
    return (
      <div 
        className="study-aware-viewport"
        data-viewport-id={viewportId}
        role="region"
        aria-label="viewport"
      >
        {children}
      </div>
    );
  }

  return (
    <div 
      className={`study-aware-viewport ${cssClasses.borderClass}`}
      data-viewport-id={viewportId}
      data-study-type={studyResult.type}
      data-study-confidence={studyResult.confidence}
      role="region"
      aria-label={`${studyResult.type} study viewport`}
      aria-describedby={studyResult.date ? `study-info-${viewportId}` : undefined}
      style={{
        // Force GPU acceleration for smooth animations
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    >
      {children}
      {overlayContent}
      
      {/* Hidden description for screen readers */}
      {studyResult.date && (
        <div 
          id={`study-info-${viewportId}`}
          style={{ 
            position: 'absolute', 
            left: '-10000px', 
            width: '1px', 
            height: '1px', 
            overflow: 'hidden' 
          }}
          aria-live="polite"
        >
          {studyResult.type} study from {formattedDate} with {Math.round(studyResult.confidence * 100)}% confidence
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if meaningful props have changed
  return (
    prevProps.viewportData?.StudyInstanceUID === nextProps.viewportData?.StudyInstanceUID &&
    prevProps.viewportId === nextProps.viewportId &&
    prevProps.servicesManager === nextProps.servicesManager &&
    // Deep comparison not needed for children as it's typically React elements
    prevProps.children === nextProps.children
  );
});

StudyAwareViewport.displayName = 'StudyAwareViewport';

export default StudyAwareViewport; 