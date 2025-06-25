# User Acceptance Testing Guide - Hanging Protocol Editor

**Version**: 1.0  
**Date**: December 2024  
**Task**: 5.9 - Conduct User Acceptance Testing

## Overview

This document provides comprehensive User Acceptance Testing (UAT) procedures for the OHIF v3 Hanging Protocol Editor. The testing validates functionality, usability, performance, and integration with real-world radiological workflows.

## Testing Objectives

- ✅ **Functional Validation**: Ensure all editor features work as specified
- ✅ **Usability Validation**: Confirm intuitive user experience for clinical workflows  
- ✅ **Performance Validation**: Verify responsive performance with realistic data loads
- ✅ **Integration Validation**: Confirm seamless OHIF v3 integration
- ✅ **Accessibility Validation**: Ensure WCAG 2.1 AA compliance
- ✅ **Error Recovery**: Validate graceful error handling and user recovery

## Test Environment Setup

### Prerequisites
- OHIF v3 Viewer with ui-enhancements extension installed
- Sample DICOM studies for multiple modalities (CT, MR, XA, PET, etc.)
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Screen reader software for accessibility testing (NVDA, JAWS, VoiceOver)

### Test Data Requirements
- **Small Protocols**: 1-4 viewports, 1-3 matching rules
- **Medium Protocols**: 5-12 viewports, 4-8 matching rules  
- **Large Protocols**: 15+ viewports, 10+ matching rules
- **Complex Protocols**: Multi-stage protocols with advanced matching logic

---

## Test Scenarios

### Scenario 1: Protocol Creation Workflow
**Objective**: Validate complete protocol creation from scratch  
**User Persona**: Radiologist creating new CT protocols  
**Duration**: 15-20 minutes

#### Test Steps:
1. **Open Hanging Protocol Editor**
   - Navigate to OHIF admin interface
   - Click "Hanging Protocols" or equivalent menu item
   - Verify editor opens without errors
   - **Expected**: Clean, professional interface loads within 2 seconds

2. **Create New Protocol**
   - Click "Create New Protocol" button
   - **Expected**: New protocol form appears with default values
   - **Expected**: All form fields are accessible and properly labeled

3. **Configure Basic Information**
   - Enter Protocol Name: "CT Chest PE Study"
   - Enter Description: "Optimized layout for pulmonary embolism evaluation"
   - **Expected**: Real-time validation feedback (if applicable)
   - **Expected**: No character limit issues for reasonable input lengths

4. **Configure Study Matching Rules**
   - Click "Matching Rules" tab
   - Add rule: Modality equals "CT"
   - Add rule: StudyDescription contains "PE" OR "CTPA" OR "Pulmonary"
   - Add rule: SeriesDescription contains "arterial" (optional)
   - **Expected**: Rules are added without errors
   - **Expected**: Constraint options change appropriately based on attribute type
   - **Expected**: Visual feedback for rule validity

5. **Configure Viewport Layout**
   - Click "Viewport Layout" tab  
   - Select 2x2 grid layout preset
   - Assign "Sagittal Reconstruction" to viewport 1
   - Assign "Coronal Reconstruction" to viewport 2
   - Assign "Axial Arterial" to viewport 3
   - Assign "Axial Venous" to viewport 4
   - **Expected**: Drag-and-drop works smoothly
   - **Expected**: Visual feedback during rule assignment
   - **Expected**: Layout preview updates correctly

6. **Validate and Save Protocol**
   - Click "Save Protocol" button
   - **Expected**: Validation runs without errors
   - **Expected**: Success confirmation dialog appears
   - **Expected**: Protocol appears in protocol list
   - **Expected**: Protocol is immediately available for use

#### Success Criteria:
- [ ] Protocol creation completes without errors
- [ ] All form interactions are intuitive and responsive
- [ ] Validation provides clear, actionable feedback
- [ ] Created protocol functions correctly when applied to studies
- [ ] UI remains responsive throughout the process

---

### Scenario 2: Protocol Editing Workflow
**Objective**: Validate protocol modification and version management  
**User Persona**: Radiologist updating existing protocols  
**Duration**: 10-15 minutes

#### Test Steps:
1. **Select Existing Protocol**
   - Open protocol list in editor
   - Select an existing protocol for editing
   - **Expected**: Protocol details load within 1 second
   - **Expected**: All tabs and fields populate correctly

2. **Modify Protocol Information**
   - Update protocol name and description
   - **Expected**: Changes are reflected immediately in UI
   - **Expected**: Unsaved changes indicator appears

3. **Update Matching Rules**
   - Modify existing rule constraints
   - Add additional matching rule
   - Remove unnecessary rule
   - **Expected**: Changes update without page refresh
   - **Expected**: Rule reordering via drag-and-drop works

4. **Adjust Viewport Layout**
   - Change layout from 2x2 to 3x2 grid
   - Reassign rules to new viewports
   - Modify viewport-specific settings
   - **Expected**: Layout changes are immediately visible
   - **Expected**: Rule assignments persist correctly

5. **Handle Unsaved Changes**
   - Attempt to navigate away without saving
   - **Expected**: Unsaved changes warning appears
   - **Expected**: Options to save, discard, or cancel are clear

6. **Save Updated Protocol**
   - Save changes and verify success
   - **Expected**: Updated protocol works correctly in viewer
   - **Expected**: Changes are persisted across browser sessions

#### Success Criteria:
- [ ] Protocol editing is intuitive and efficient
- [ ] All changes are properly validated before saving
- [ ] Unsaved changes are handled gracefully
- [ ] Updated protocols function correctly in production use
- [ ] No data loss occurs during the editing process

---

### Scenario 3: Complex Protocol Management
**Objective**: Validate advanced protocol features and edge cases  
**User Persona**: Senior radiologist creating complex multi-modality protocols  
**Duration**: 20-25 minutes

#### Test Steps:
1. **Create Multi-Stage Protocol**
   - Create protocol with multiple stages
   - Configure different layouts for each stage
   - **Expected**: Stage management works intuitively
   - **Expected**: Stage transitions are properly configured

2. **Advanced Matching Rules**
   - Create rules with regex patterns
   - Configure rules with numeric ranges
   - Set up complex AND/OR logic combinations
   - **Expected**: Complex constraints are validated correctly
   - **Expected**: Performance remains acceptable with complex rules

3. **Large Viewport Configurations**
   - Create layout with 16+ viewports
   - Assign unique rules to each viewport
   - **Expected**: Editor handles large configurations without performance issues
   - **Expected**: UI remains usable with scrolling/pagination as needed

4. **Error Handling Validation**
   - Create invalid matching rules intentionally
   - Configure impossible viewport assignments
   - **Expected**: Clear validation errors with resolution guidance
   - **Expected**: Editor prevents saving invalid configurations

5. **Protocol Duplication and Templates**
   - Duplicate existing complex protocol
   - Use as template for new protocol creation
   - **Expected**: Duplication preserves all settings correctly
   - **Expected**: Template workflow is efficient and intuitive

#### Success Criteria:
- [ ] Complex protocols can be created and managed effectively
- [ ] Editor performance remains acceptable with large datasets
- [ ] Advanced features are discoverable and usable
- [ ] Error states provide clear guidance for resolution
- [ ] Template and duplication features work reliably

---

### Scenario 4: Real-World Clinical Integration
**Objective**: Validate end-to-end workflow in realistic clinical setting  
**User Persona**: Technologist and radiologist using protocols in daily practice  
**Duration**: 25-30 minutes

#### Test Steps:
1. **Protocol Application Workflow**
   - Open OHIF viewer with real DICOM studies
   - Navigate protocol application interface
   - Apply created protocols to appropriate studies
   - **Expected**: Protocol selection is intuitive and fast
   - **Expected**: Protocol application completes within 3 seconds

2. **Multi-Study Protocol Testing**
   - Test protocols with various study types (CT, MR, XA, PET)
   - Verify matching rules work correctly across modalities
   - **Expected**: Protocols match appropriate studies automatically
   - **Expected**: No incorrect protocol applications occur

3. **Performance Under Load**
   - Test with large DICOM datasets (>500 series)
   - Apply protocols to studies with >100 images per series
   - **Expected**: Protocol application remains responsive
   - **Expected**: Memory usage stays within reasonable limits

4. **User Workflow Integration**
   - Test protocol switching during active reading session
   - Verify protocol changes don't interrupt ongoing work
   - **Expected**: Smooth transitions between protocols
   - **Expected**: User context is preserved during protocol changes

5. **Multi-User Scenarios**
   - Test concurrent protocol creation and usage
   - Verify protocol changes are reflected for all users
   - **Expected**: No conflicts between concurrent users
   - **Expected**: Protocol updates propagate correctly

#### Success Criteria:
- [ ] Protocols integrate seamlessly with clinical workflows
- [ ] Performance meets clinical requirements under realistic loads
- [ ] Multi-user scenarios work without conflicts
- [ ] Protocol application enhances rather than disrupts reading efficiency
- [ ] Error recovery maintains clinical workflow continuity

---

### Scenario 5: Accessibility and Usability Validation
**Objective**: Ensure editor meets accessibility standards and usability best practices  
**User Persona**: Users with disabilities and varying technical expertise  
**Duration**: 15-20 minutes

#### Test Steps:
1. **Keyboard Navigation Testing**
   - Navigate entire editor using only keyboard
   - Test tab order and focus management
   - Verify all interactive elements are reachable
   - **Expected**: Logical tab order throughout interface
   - **Expected**: Focus indicators are clearly visible
   - **Expected**: All functionality accessible via keyboard

2. **Screen Reader Compatibility**
   - Test with NVDA, JAWS, or VoiceOver
   - Verify form labels and instructions are read correctly
   - Test error message announcements
   - **Expected**: All content is properly announced
   - **Expected**: Form validation errors are communicated clearly
   - **Expected**: Dynamic content changes are announced

3. **Visual Accessibility Testing**
   - Test with high contrast mode enabled
   - Verify color contrast meets WCAG AA standards
   - Test with 200% zoom level
   - **Expected**: Interface remains usable at high zoom levels
   - **Expected**: No information is conveyed by color alone
   - **Expected**: Text contrast ratio ≥ 4.5:1

4. **Motor Accessibility Testing**
   - Test drag-and-drop with keyboard alternatives
   - Verify click targets are appropriately sized (≥44px)
   - Test with simulated motor impairments
   - **Expected**: All drag-and-drop has keyboard equivalent
   - **Expected**: Click targets are easy to activate
   - **Expected**: Interface is operable with limited dexterity

#### Success Criteria:
- [ ] Full WCAG 2.1 AA compliance achieved
- [ ] Editor is fully operable with keyboard only
- [ ] Screen reader users can complete all tasks effectively
- [ ] Interface remains usable across accessibility scenarios
- [ ] No accessibility barriers prevent feature access

---

## Performance Benchmarks

### Response Time Requirements
- **Initial Editor Load**: ≤ 2 seconds
- **Protocol List Load**: ≤ 1 second  
- **Protocol Save/Update**: ≤ 3 seconds
- **Form Interactions**: ≤ 200ms
- **Validation Feedback**: ≤ 500ms

### Scalability Requirements
- **Protocol List**: Support 1000+ protocols without performance degradation
- **Protocol Complexity**: Handle protocols with 50+ viewports and 25+ rules
- **Concurrent Users**: Support 10+ simultaneous editor sessions
- **Memory Usage**: ≤ 150MB peak memory usage per session

### Browser Compatibility
- **Chrome**: Version 90+ (Primary target)
- **Firefox**: Version 88+ (Secondary target)
- **Safari**: Version 14+ (Mac users)
- **Edge**: Version 90+ (Enterprise environments)

---

## Bug Reporting Template

### Bug Report Format
```
**Bug ID**: UAT-[Date]-[Number]
**Severity**: Critical/High/Medium/Low
**Priority**: P1/P2/P3
**Browser**: [Browser name and version]
**OS**: [Operating system and version]

**Test Scenario**: [Reference test scenario]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**: [What should happen]
**Actual Result**: [What actually happened]
**Workaround**: [If any workaround exists]

**Screenshots/Video**: [Attach if applicable]
**Console Errors**: [Copy any console errors]
**Additional Notes**: [Any other relevant information]
```

### Bug Severity Definitions
- **Critical**: Prevents completion of core functionality, data loss
- **High**: Major feature doesn't work as expected, significant UX impact
- **Medium**: Minor feature issues, moderate UX impact
- **Low**: Cosmetic issues, minimal UX impact

---

## Success Metrics

### Functional Success Criteria
- [ ] 100% of core features work as specified
- [ ] 100% of test scenarios pass without critical bugs
- [ ] 0 data loss scenarios identified
- [ ] All error states provide clear recovery guidance

### Usability Success Criteria  
- [ ] 95%+ user satisfaction rating (post-test survey)
- [ ] 90%+ task completion rate for first-time users
- [ ] Average task completion time meets target benchmarks
- [ ] ≤5% user error rate for common tasks

### Performance Success Criteria
- [ ] All response time requirements met under normal load
- [ ] Memory usage stays within defined limits
- [ ] No performance regressions compared to baseline
- [ ] Concurrent user scenarios work without degradation

### Accessibility Success Criteria
- [ ] WCAG 2.1 AA compliance verified by accessibility audit
- [ ] Screen reader testing passes all scenarios
- [ ] Keyboard navigation covers 100% of functionality
- [ ] Color contrast and visual design meet accessibility standards

---

## Test Completion Checklist

### Pre-Test Setup
- [ ] Test environment configured and verified
- [ ] Test data prepared for all scenarios
- [ ] Testing tools and assistive technology ready
- [ ] Stakeholders notified of testing schedule

### During Testing
- [ ] All test scenarios executed and documented
- [ ] Bugs reported using standard template
- [ ] Performance metrics collected and analyzed
- [ ] User feedback gathered systematically

### Post-Test Activities
- [ ] Test results compiled and analyzed
- [ ] Bug reports triaged and prioritized
- [ ] User feedback synthesized into recommendations
- [ ] Go/no-go decision made for production release

### Production Readiness
- [ ] All critical and high-severity bugs resolved
- [ ] Performance requirements met in production-like environment
- [ ] Accessibility compliance verified
- [ ] User training materials prepared
- [ ] Deployment and rollback procedures tested

---

## Appendix

### User Feedback Survey Template
```
1. Overall satisfaction with the Hanging Protocol Editor (1-10 scale)
2. Ease of creating new protocols (1-10 scale)
3. Intuitiveness of the matching rules interface (1-10 scale)
4. Usability of the viewport layout designer (1-10 scale)
5. Speed and responsiveness of the interface (1-10 scale)
6. Quality of validation feedback and error messages (1-10 scale)
7. Integration with existing OHIF workflows (1-10 scale)

Open-ended questions:
- What did you like most about the editor?
- What was most frustrating or difficult to use?
- What features would you like to see added?
- Would you recommend this editor to colleagues?
- Additional comments or suggestions?
```

### Contact Information
- **QA Lead**: [Contact Information]
- **Product Manager**: [Contact Information]  
- **Development Team**: [Contact Information]
- **User Experience**: [Contact Information]

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: After UAT completion 