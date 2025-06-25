/**
 * Paths to the screenshots of the tests.
 */
const screenShotPaths = {
  angle: {
    angleDisplayedCorrectly: 'angleDisplayedCorrectly.png',
  },
  bidirectional: {
    bidirectionalDisplayedCorrectly: 'bidirectionalDisplayedCorrectly.png',
  },
  circle: {
    circleDisplayedCorrectly: 'circleDisplayedCorrectly.png',
  },
  cobbangle: {
    cobbangleDisplayedCorrectly: 'cobbangleDisplayedCorrectly.png',
  },
  ellipse: {
    ellipseDisplayedCorrectly: 'ellipseDisplayedCorrectly.png',
  },
  length: {
    lengthDisplayedCorrectly: 'lengthDisplayedCorrectly.png',
  },
  livewire: {
    livewireDisplayedCorrectly: 'livewireDisplayedCorrectly.png',
  },
  mpr: {
    mprDisplayedCorrectly: 'mprDisplayedCorrectly.png',
  },
  mpr2: {
    mprDisplayedCorrectly: 'mprDisplayedCorrectly.png',
    mprDisplayedCorrectlyZoomed: 'mprDisplayedCorrectlyZoomed.png',
  },
  threeDFourUp: {
    threeDFourUpDisplayedCorrectly: 'threeDFourUpDisplayedCorrectly.png',
  },
  threeDMain: {
    threeDMainDisplayedCorrectly: 'threeDMainDisplayedCorrectly.png',
  },
  threeDPrimary: {
    threeDPrimaryDisplayedCorrectly: 'threeDPrimaryDisplayedCorrectly.png',
  },
  threeDOnly: {
    threeDOnlyDisplayedCorrectly: 'threeDOnlyDisplayedCorrectly.png',
  },
  axialPrimary: {
    axialPrimaryDisplayedCorrectly: 'axialPrimaryDisplayedCorrectly.png',
  },
  probe: {
    probeDisplayedCorrectly: 'probeDisplayedCorrectly.png',
  },
  rectangle: {
    rectangleDisplayedCorrectly: 'rectangleDisplayedCorrectly.png',
  },
  spline: {
    splineDisplayedCorrectly: 'splineDisplayedCorrectly.png',
  },
  dicomTagBrowser: {
    dicomTagBrowserDisplayedCorrectly: 'dicomTagBrowserDisplayedCorrectly.png',
  },
  rotateRight: {
    rotateRightDisplayedCorrectly: 'rotateRightDisplayedCorrectly.png',
  },
  invert: {
    invertDisplayedCorrectly: 'invertDisplayedCorrectly.png',
  },
  flipHorizontal: {
    flipHorizontalDisplayedCorrectly: 'flipHorizontalDisplayedCorrectly.png',
  },
  reset: {
    resetDisplayedCorrectly: 'resetDisplayedCorrectly.png',
  },
  srHydration: {
    srPostHydration: 'srPostHydration.png',
    srPreHydration: 'srPreHydration.png',
    srJumpToMeasurement: 'srJumpToMeasurement.png',
  },
  segHydration: {
    segPostHydration: 'segPostHydration.png',
    segPreHydration: 'segPreHydration.png',
    segJumpToSegment: 'segJumpToSegment.png',
  },
  segHydrationThenMPR: {
    segPostHydration: 'segPostHydration.png',
    segPostHydrationMPRAxialPrimary: 'segPostHydrationMPRAxialPrimary.png',
  },
  segHydrationFromMPR: {
    mprBeforeSEG: 'mprBeforeSEG.png',
    mprAfterSEG: 'mprAfterSEG.png',
    mprAfterSegHydrated: 'mprAfterSegHydrated.png',
    mprAfterSegHydratedAfterLayoutChange: 'mprAfterSegHydratedAfterLayoutChange.png',
  },
  rtHydration: {
    rtPostHydration: 'rtPostHydration.png',
    rtPreHydration: 'rtPreHydration.png',
    rtJumpToStructure: 'rtJumpToStructure.png',
  },
  rtHydration2: {
    rtPostHydration: 'rtPostHydration.png',
    rtPreHydration: 'rtPreHydration.png',
  },
  crosshairs: {
    crosshairsRendered: 'crosshairsRendered.png',
    crosshairsRotated: 'crosshairsRotated.png',
    crosshairsSlabThickness: 'crosshairsSlabThickness.png',
    crosshairsResetToolbar: 'crosshairsResetToolbar.png',
    crosshairsNewDisplayset: 'crosshairsNewDisplayset.png',
  },
  tmtvRendering: {
    tmtvDisplayedCorrectly: 'tmtvDisplayedCorrectly.png',
  },
  jumpToMeasurementMPR: {
    initialDraw: 'jumpToMeasurementMPR-initialDraw.png',
    scrollAway: 'jumpToMeasurementMPR-scrollAway.png',
    jumpToMeasurementStack: 'jumpToMeasurementMPR-jumpToMeasurementStack.png',
    goToMPR: 'jumpToMeasurementMPR-goToMPR.png',
    jumpInMPR: 'jumpToMeasurementMPR-jumpInMPR.png',
    changeSeriesInMPR: 'jumpToMeasurementMPR-changeSeriesInMPR.png',
    jumpToMeasurementAfterSeriesChange:
      'jumpToMeasurementMPR-jumpToMeasurementAfterSeriesChange.png',
  },
  // UI Enhancements Visual Regression Tests
  globalPatientHeader: {
    headerDefaultState: 'globalPatientHeader-defaultState.png',
    headerWithPatientData: 'globalPatientHeader-withPatientData.png',
    headerMobileResponsive: 'globalPatientHeader-mobileResponsive.png',
    headerTabletResponsive: 'globalPatientHeader-tabletResponsive.png',
    headerTypographyCompliance: 'globalPatientHeader-typographyCompliance.png',
  },
  studyComparison: {
    currentStudyBorder: 'studyComparison-currentStudyBorder.png',
    priorStudyBorder: 'studyComparison-priorStudyBorder.png',
    studyOverlayDisplay: 'studyComparison-studyOverlayDisplay.png',
    hoverInteractions: 'studyComparison-hoverInteractions.png',
    multiViewportGrid: 'studyComparison-multiViewportGrid.png',
    borderStyleAccuracy: 'studyComparison-borderStyleAccuracy.png',
    overlayPositioning: 'studyComparison-overlayPositioning.png',
  },
  enhancedToolbar: {
    toolbarDefaultState: 'enhancedToolbar-defaultState.png',
    buttonSizing40px: 'enhancedToolbar-buttonSizing40px.png',
    petCtModalityTools: 'enhancedToolbar-petCtModalityTools.png',
    pdfDocumentTools: 'enhancedToolbar-pdfDocumentTools.png',
    toolGroupHierarchy: 'enhancedToolbar-toolGroupHierarchy.png',
    overflowBehavior: 'enhancedToolbar-overflowBehavior.png',
    modalitySwitching: 'enhancedToolbar-modalitySwitching.png',
  },
  themeSystem: {
    prdColorPalette: 'themeSystem-prdColorPalette.png',
    darkModeOptimization: 'themeSystem-darkModeOptimization.png',
    highContrastMode: 'themeSystem-highContrastMode.png',
    colorVariableAccuracy: 'themeSystem-colorVariableAccuracy.png',
  },
  uiIntegration: {
    headerToolbarLayout: 'uiIntegration-headerToolbarLayout.png',
    fullViewportIntegration: 'uiIntegration-fullViewportIntegration.png',
    responsiveBreakpoints: 'uiIntegration-responsiveBreakpoints.png',
    multiStudyComparison: 'uiIntegration-multiStudyComparison.png',
    accessibilityFeatures: 'uiIntegration-accessibilityFeatures.png',
  },
};

export { screenShotPaths };
