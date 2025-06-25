/**
 * OHIF Enhanced Features - Issue Tracking System
 * 
 * Comprehensive issue tracking system for managing defects, enhancement requests,
 * and improvement opportunities discovered during testing and validation.
 * 
 * Features:
 * - Automated issue detection and classification
 * - Priority management and workflow tracking
 * - Stakeholder communication and reporting
 * - Knowledge management and analytics
 * 
 * @version 1.0.0
 * @author OHIF Enhanced Features Team
 */

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

/**
 * Issue Classification and Priority System
 */
class IssueClassifier {
  constructor() {
    this.issueTypes = {
      BUG: 'bug',
      ENHANCEMENT: 'enhancement',
      DOCUMENTATION: 'documentation',
      SECURITY: 'security',
      PERFORMANCE: 'performance',
      USABILITY: 'usability',
      COMPATIBILITY: 'compatibility',
      INFRASTRUCTURE: 'infrastructure'
    };

    this.severityLevels = {
      CRITICAL: { level: 'critical', responseTime: 4, priority: 1 },
      HIGH: { level: 'high', responseTime: 24, priority: 2 },
      MEDIUM: { level: 'medium', responseTime: 72, priority: 3 },
      LOW: { level: 'low', responseTime: 168, priority: 4 }
    };

    this.issueStates = {
      NEW: 'new',
      TRIAGED: 'triaged',
      ASSIGNED: 'assigned',
      IN_PROGRESS: 'in-progress',
      TESTING: 'testing',
      REVIEW: 'review',
      CLOSED: 'closed',
      REJECTED: 'rejected',
      DUPLICATE: 'duplicate'
    };
  }

  /**
   * Classify issue based on content and context
   */
  classifyIssue(issueData) {
    const classification = {
      type: this.determineIssueType(issueData),
      severity: this.determineSeverity(issueData),
      priority: this.calculatePriority(issueData),
      component: this.identifyComponent(issueData),
      tags: this.generateTags(issueData)
    };

    return classification;
  }

  determineIssueType(issueData) {
    const { title, description, source } = issueData;
    const content = `${title} ${description}`.toLowerCase();

    // Security-related keywords
    if (this.containsKeywords(content, ['security', 'vulnerability', 'authentication', 'authorization', 'xss', 'csrf'])) {
      return this.issueTypes.SECURITY;
    }

    // Performance-related keywords
    if (this.containsKeywords(content, ['performance', 'slow', 'memory', 'cpu', 'loading', 'lag'])) {
      return this.issueTypes.PERFORMANCE;
    }

    // Bug-related indicators
    if (this.containsKeywords(content, ['error', 'crash', 'broken', 'not working', 'fails', 'exception'])) {
      return this.issueTypes.BUG;
    }

    // Enhancement requests
    if (this.containsKeywords(content, ['enhancement', 'feature', 'improvement', 'suggest', 'add'])) {
      return this.issueTypes.ENHANCEMENT;
    }

    // Usability issues
    if (this.containsKeywords(content, ['usability', 'ui', 'ux', 'confusing', 'accessibility'])) {
      return this.issueTypes.USABILITY;
    }

    // Compatibility issues
    if (this.containsKeywords(content, ['browser', 'compatibility', 'firefox', 'safari', 'edge'])) {
      return this.issueTypes.COMPATIBILITY;
    }

    // Default to bug if uncertain
    return this.issueTypes.BUG;
  }

  determineSeverity(issueData) {
    const { title, description, impact, testResults } = issueData;
    const content = `${title} ${description}`.toLowerCase();

    // Critical severity indicators
    if (this.containsKeywords(content, ['crash', 'data loss', 'security breach', 'system down'])) {
      return this.severityLevels.CRITICAL;
    }

    // High severity indicators
    if (this.containsKeywords(content, ['major', 'significant', 'blocking', 'unusable'])) {
      return this.severityLevels.HIGH;
    }

    // Performance-based severity
    if (testResults && testResults.performance) {
      const degradation = testResults.performance.degradationPercentage;
      if (degradation > 50) return this.severityLevels.CRITICAL;
      if (degradation > 25) return this.severityLevels.HIGH;
      if (degradation > 10) return this.severityLevels.MEDIUM;
    }

    // Impact-based severity
    if (impact) {
      if (impact.usersAffected > 90) return this.severityLevels.CRITICAL;
      if (impact.usersAffected > 50) return this.severityLevels.HIGH;
      if (impact.usersAffected > 10) return this.severityLevels.MEDIUM;
    }

    return this.severityLevels.LOW;
  }

  calculatePriority(issueData) {
    const { type, severity, businessImpact, frequency } = issueData;
    let priorityScore = 0;

    // Base priority from severity
    priorityScore += severity.priority * 25;

    // Business impact adjustment
    if (businessImpact) {
      priorityScore += businessImpact.revenue * 10;
      priorityScore += businessImpact.customerSatisfaction * 15;
      priorityScore += businessImpact.regulatory * 20;
    }

    // Frequency adjustment
    if (frequency) {
      priorityScore += frequency * 5;
    }

    // Type-specific adjustments
    switch (type) {
      case this.issueTypes.SECURITY:
        priorityScore += 30;
        break;
      case this.issueTypes.BUG:
        priorityScore += 20;
        break;
      case this.issueTypes.PERFORMANCE:
        priorityScore += 15;
        break;
      default:
        priorityScore += 5;
    }

    return Math.min(100, priorityScore);
  }

  identifyComponent(issueData) {
    const { title, description, stackTrace } = issueData;
    const content = `${title} ${description} ${stackTrace || ''}`.toLowerCase();

    const componentMap = {
      'virtual-series': ['virtual series', 'virtual-series', 'scrolling', 'navigation'],
      'header-toolbar': ['header', 'toolbar', 'patient info', 'study info'],
      'study-comparison': ['comparison', 'split view', 'side-by-side'],
      'hanging-protocols': ['hanging protocol', 'layout', 'viewport'],
      'priority-system': ['priority', 'urgent', 'stat'],
      'performance': ['performance', 'loading', 'memory', 'cpu'],
      'ui-components': ['ui', 'button', 'dialog', 'modal'],
      'dicom-integration': ['dicom', 'parsing', 'metadata'],
      'core-integration': ['ohif', 'extension', 'service']
    };

    for (const [component, keywords] of Object.entries(componentMap)) {
      if (this.containsKeywords(content, keywords)) {
        return component;
      }
    }

    return 'unknown';
  }

  generateTags(issueData) {
    const tags = [];
    const { type, severity, component, testingPhase } = issueData;

    tags.push(type);
    tags.push(severity.level);
    tags.push(component);

    if (testingPhase) {
      tags.push(`testing-${testingPhase}`);
    }

    return tags;
  }

  containsKeywords(content, keywords) {
    return keywords.some(keyword => content.includes(keyword));
  }
}

/**
 * Issue Workflow Management System
 */
class IssueWorkflowManager extends EventEmitter {
  constructor() {
    super();
    this.workflows = new Map();
    this.activeIssues = new Map();
    this.workflowTemplates = this.initializeWorkflowTemplates();
  }

  initializeWorkflowTemplates() {
    return {
      bug: {
        states: ['new', 'triaged', 'assigned', 'in-progress', 'testing', 'review', 'closed'],
        transitions: {
          'new': ['triaged', 'rejected', 'duplicate'],
          'triaged': ['assigned', 'rejected'],
          'assigned': ['in-progress'],
          'in-progress': ['testing', 'assigned'],
          'testing': ['review', 'in-progress'],
          'review': ['closed', 'in-progress'],
          'closed': []
        },
        sla: {
          'new': 24, // hours
          'triaged': 48,
          'assigned': 72,
          'in-progress': 168,
          'testing': 48,
          'review': 24
        }
      },
      enhancement: {
        states: ['new', 'triaged', 'planned', 'in-progress', 'testing', 'review', 'closed'],
        transitions: {
          'new': ['triaged', 'rejected'],
          'triaged': ['planned', 'rejected'],
          'planned': ['in-progress'],
          'in-progress': ['testing'],
          'testing': ['review', 'in-progress'],
          'review': ['closed', 'in-progress'],
          'closed': []
        },
        sla: {
          'new': 72,
          'triaged': 168,
          'planned': 336,
          'in-progress': 504,
          'testing': 72,
          'review': 48
        }
      }
    };
  }

  /**
   * Create new issue workflow
   */
  createIssueWorkflow(issueId, issueType) {
    const template = this.workflowTemplates[issueType] || this.workflowTemplates.bug;
    
    const workflow = {
      issueId,
      type: issueType,
      currentState: 'new',
      states: [...template.states],
      transitions: { ...template.transitions },
      sla: { ...template.sla },
      history: [{
        state: 'new',
        timestamp: new Date(),
        actor: 'system',
        comment: 'Issue created'
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(issueId, workflow);
    this.emit('workflow:created', { issueId, workflow });
    
    return workflow;
  }

  /**
   * Transition issue to new state
   */
  transitionIssue(issueId, newState, actor, comment = '') {
    const workflow = this.workflows.get(issueId);
    if (!workflow) {
      throw new Error(`Workflow not found for issue ${issueId}`);
    }

    const currentState = workflow.currentState;
    const allowedTransitions = workflow.transitions[currentState] || [];

    if (!allowedTransitions.includes(newState)) {
      throw new Error(`Invalid transition from ${currentState} to ${newState}`);
    }

    // Update workflow
    workflow.currentState = newState;
    workflow.updatedAt = new Date();
    workflow.history.push({
      state: newState,
      timestamp: new Date(),
      actor,
      comment,
      previousState: currentState
    });

    this.emit('workflow:transitioned', {
      issueId,
      from: currentState,
      to: newState,
      actor,
      comment
    });

    // Check SLA
    this.checkSLA(issueId);

    return workflow;
  }

  /**
   * Check SLA compliance for issue
   */
  checkSLA(issueId) {
    const workflow = this.workflows.get(issueId);
    if (!workflow) return;

    const currentState = workflow.currentState;
    const slaHours = workflow.sla[currentState];
    
    if (!slaHours) return;

    const stateEntry = workflow.history
      .slice()
      .reverse()
      .find(entry => entry.state === currentState);

    if (!stateEntry) return;

    const hoursInState = (Date.now() - stateEntry.timestamp.getTime()) / (1000 * 60 * 60);
    
    if (hoursInState > slaHours) {
      this.emit('sla:breach', {
        issueId,
        state: currentState,
        slaHours,
        actualHours: hoursInState,
        breach: hoursInState - slaHours
      });
    } else if (hoursInState > slaHours * 0.8) {
      this.emit('sla:warning', {
        issueId,
        state: currentState,
        slaHours,
        actualHours: hoursInState,
        remainingHours: slaHours - hoursInState
      });
    }
  }

  /**
   * Get workflow status for issue
   */
  getWorkflowStatus(issueId) {
    const workflow = this.workflows.get(issueId);
    if (!workflow) return null;

    return {
      issueId,
      currentState: workflow.currentState,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      stateHistory: workflow.history,
      availableTransitions: workflow.transitions[workflow.currentState] || []
    };
  }
}

/**
 * Issue Analytics and Reporting System
 */
class IssueAnalytics {
  constructor() {
    this.metrics = new Map();
    this.trends = new Map();
    this.reports = new Map();
  }

  /**
   * Analyze issues and generate insights
   */
  analyzeIssues(issues) {
    const analysis = {
      summary: this.generateSummary(issues),
      trends: this.analyzeTrends(issues),
      hotspots: this.identifyHotspots(issues),
      quality: this.assessQuality(issues),
      performance: this.analyzePerformance(issues),
      predictions: this.generatePredictions(issues)
    };

    return analysis;
  }

  generateSummary(issues) {
    const total = issues.length;
    const byType = this.groupBy(issues, 'type');
    const bySeverity = this.groupBy(issues, 'severity.level');
    const byState = this.groupBy(issues, 'currentState');
    const byComponent = this.groupBy(issues, 'component');

    return {
      total,
      open: issues.filter(i => !['closed', 'rejected'].includes(i.currentState)).length,
      closed: issues.filter(i => i.currentState === 'closed').length,
      byType,
      bySeverity,
      byState,
      byComponent,
      avgResolutionTime: this.calculateAverageResolutionTime(issues),
      slaCompliance: this.calculateSLACompliance(issues)
    };
  }

  analyzeTrends(issues) {
    const last30Days = this.filterByDateRange(issues, 30);
    const last7Days = this.filterByDateRange(issues, 7);

    return {
      creationRate: {
        daily: last7Days.length / 7,
        weekly: last30Days.length / 4.3,
        trend: this.calculateTrend(issues, 'createdAt', 30)
      },
      resolutionRate: {
        daily: this.getResolvedInPeriod(issues, 7).length / 7,
        weekly: this.getResolvedInPeriod(issues, 30).length / 4.3,
        trend: this.calculateResolutionTrend(issues, 30)
      },
      qualityTrend: this.calculateQualityTrend(issues, 30),
      componentTrends: this.calculateComponentTrends(issues, 30)
    };
  }

  identifyHotspots(issues) {
    const componentIssues = this.groupBy(issues, 'component');
    const hotspots = [];

    for (const [component, componentIssueList] of Object.entries(componentIssues)) {
      const criticalCount = componentIssueList.filter(i => i.severity?.level === 'critical').length;
      const highCount = componentIssueList.filter(i => i.severity?.level === 'high').length;
      const avgResolutionTime = this.calculateAverageResolutionTime(componentIssueList);

      const hotspotScore = (criticalCount * 10) + (highCount * 5) + (componentIssueList.length * 1);

      hotspots.push({
        component,
        score: hotspotScore,
        totalIssues: componentIssueList.length,
        criticalIssues: criticalCount,
        highSeverityIssues: highCount,
        averageResolutionTime: avgResolutionTime,
        trend: this.calculateComponentTrend(componentIssueList, 14)
      });
    }

    return hotspots.sort((a, b) => b.score - a.score);
  }

  assessQuality(issues) {
    const total = issues.length;
    if (total === 0) return { score: 100, metrics: {} };

    const defectEscapeRate = this.calculateDefectEscapeRate(issues);
    const reopenRate = this.calculateReopenRate(issues);
    const duplicateRate = this.calculateDuplicateRate(issues);
    const slaCompliance = this.calculateSLACompliance(issues);

    const qualityScore = 100 - (
      (defectEscapeRate * 30) +
      (reopenRate * 25) +
      (duplicateRate * 20) +
      ((100 - slaCompliance) * 25)
    );

    return {
      score: Math.max(0, Math.round(qualityScore)),
      metrics: {
        defectEscapeRate: defectEscapeRate,
        reopenRate: reopenRate,
        duplicateRate: duplicateRate,
        slaCompliance: slaCompliance,
        avgResolutionTime: this.calculateAverageResolutionTime(issues),
        firstTimeResolutionRate: this.calculateFirstTimeResolutionRate(issues)
      }
    };
  }

  /**
   * Helper methods for calculations
   */
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const value = this.getNestedValue(item, key);
      const group = groups[value] || [];
      group.push(item);
      groups[value] = group;
      return groups;
    }, {});
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  filterByDateRange(issues, days) {
    const cutoff = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    return issues.filter(issue => new Date(issue.createdAt) >= cutoff);
  }

  calculateAverageResolutionTime(issues) {
    const resolved = issues.filter(i => i.resolvedAt && i.createdAt);
    if (resolved.length === 0) return 0;

    const totalTime = resolved.reduce((sum, issue) => {
      return sum + (new Date(issue.resolvedAt) - new Date(issue.createdAt));
    }, 0);

    return totalTime / resolved.length / (1000 * 60 * 60); // hours
  }

  calculateSLACompliance(issues) {
    const withSLA = issues.filter(i => i.slaTarget);
    if (withSLA.length === 0) return 100;

    const compliant = withSLA.filter(i => {
      const actualTime = i.resolvedAt ? 
        (new Date(i.resolvedAt) - new Date(i.createdAt)) / (1000 * 60 * 60) :
        (Date.now() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60);
      return actualTime <= i.slaTarget;
    });

    return (compliant.length / withSLA.length) * 100;
  }

  calculateDefectEscapeRate(issues) {
    const defects = issues.filter(i => i.type === 'bug');
    if (defects.length === 0) return 0;

    const escaped = defects.filter(i => i.discoveredIn === 'production');
    return (escaped.length / defects.length) * 100;
  }

  calculateReopenRate(issues) {
    const closed = issues.filter(i => i.currentState === 'closed');
    if (closed.length === 0) return 0;

    const reopened = closed.filter(i => i.reopenCount > 0);
    return (reopened.length / closed.length) * 100;
  }

  calculateDuplicateRate(issues) {
    const total = issues.length;
    if (total === 0) return 0;

    const duplicates = issues.filter(i => i.currentState === 'duplicate');
    return (duplicates.length / total) * 100;
  }

  calculateFirstTimeResolutionRate(issues) {
    const resolved = issues.filter(i => i.currentState === 'closed');
    if (resolved.length === 0) return 100;

    const firstTimeResolved = resolved.filter(i => i.reopenCount === 0);
    return (firstTimeResolved.length / resolved.length) * 100;
  }
}

/**
 * Main Issue Tracking System
 */
class IssueTracker extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      dataDirectory: options.dataDirectory || './issue-data',
      autoSave: options.autoSave !== false,
      enableAnalytics: options.enableAnalytics !== false,
      ...options
    };

    this.classifier = new IssueClassifier();
    this.workflowManager = new IssueWorkflowManager();
    this.analytics = new IssueAnalytics();
    
    this.issues = new Map();
    this.nextId = 1;

    this.setupEventHandlers();
    this.initializeDataDirectory();
  }

  setupEventHandlers() {
    this.workflowManager.on('workflow:transitioned', (event) => {
      this.emit('issue:transitioned', event);
      if (this.options.autoSave) {
        this.saveIssue(event.issueId);
      }
    });

    this.workflowManager.on('sla:breach', (event) => {
      this.emit('sla:breach', event);
    });

    this.workflowManager.on('sla:warning', (event) => {
      this.emit('sla:warning', event);
    });
  }

  initializeDataDirectory() {
    if (!fs.existsSync(this.options.dataDirectory)) {
      fs.mkdirSync(this.options.dataDirectory, { recursive: true });
    }
  }

  /**
   * Create new issue
   */
  createIssue(issueData) {
    const issueId = `OHIF-${this.nextId++}`;
    
    // Classify the issue
    const classification = this.classifier.classifyIssue(issueData);
    
    // Create issue object
    const issue = {
      id: issueId,
      title: issueData.title,
      description: issueData.description,
      reporter: issueData.reporter || 'anonymous',
      assignee: null,
      ...classification,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
      attachments: issueData.attachments || [],
      testResults: issueData.testResults || null,
      environment: issueData.environment || {},
      metadata: issueData.metadata || {}
    };

    // Store issue
    this.issues.set(issueId, issue);

    // Create workflow
    this.workflowManager.createIssueWorkflow(issueId, classification.type);

    // Emit event
    this.emit('issue:created', { issueId, issue });

    // Auto-save if enabled
    if (this.options.autoSave) {
      this.saveIssue(issueId);
    }

    return issue;
  }

  /**
   * Update existing issue
   */
  updateIssue(issueId, updates) {
    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    // Apply updates
    Object.assign(issue, updates, {
      updatedAt: new Date()
    });

    // Re-classify if content changed
    if (updates.title || updates.description) {
      const newClassification = this.classifier.classifyIssue(issue);
      Object.assign(issue, newClassification);
    }

    this.emit('issue:updated', { issueId, issue, updates });

    if (this.options.autoSave) {
      this.saveIssue(issueId);
    }

    return issue;
  }

  /**
   * Transition issue state
   */
  transitionIssue(issueId, newState, actor, comment = '') {
    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    // Update workflow
    this.workflowManager.transitionIssue(issueId, newState, actor, comment);

    // Update issue
    issue.currentState = newState;
    issue.updatedAt = new Date();

    if (newState === 'closed') {
      issue.resolvedAt = new Date();
    }

    if (comment) {
      this.addComment(issueId, actor, comment);
    }

    return issue;
  }

  /**
   * Add comment to issue
   */
  addComment(issueId, author, content, metadata = {}) {
    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    const comment = {
      id: `comment-${Date.now()}`,
      author,
      content,
      createdAt: new Date(),
      metadata
    };

    issue.comments.push(comment);
    issue.updatedAt = new Date();

    this.emit('issue:commented', { issueId, comment });

    if (this.options.autoSave) {
      this.saveIssue(issueId);
    }

    return comment;
  }

  /**
   * Search issues
   */
  searchIssues(criteria) {
    const allIssues = Array.from(this.issues.values());
    
    return allIssues.filter(issue => {
      // Text search
      if (criteria.text) {
        const searchText = criteria.text.toLowerCase();
        const searchableContent = `${issue.title} ${issue.description}`.toLowerCase();
        if (!searchableContent.includes(searchText)) {
          return false;
        }
      }

      // Filter by type
      if (criteria.type && issue.type !== criteria.type) {
        return false;
      }

      // Filter by severity
      if (criteria.severity && issue.severity?.level !== criteria.severity) {
        return false;
      }

      // Filter by state
      if (criteria.state && issue.currentState !== criteria.state) {
        return false;
      }

      // Filter by component
      if (criteria.component && issue.component !== criteria.component) {
        return false;
      }

      // Filter by assignee
      if (criteria.assignee && issue.assignee !== criteria.assignee) {
        return false;
      }

      // Filter by date range
      if (criteria.dateRange) {
        const issueDate = new Date(issue.createdAt);
        if (criteria.dateRange.start && issueDate < criteria.dateRange.start) {
          return false;
        }
        if (criteria.dateRange.end && issueDate > criteria.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Generate analytics report
   */
  generateAnalyticsReport() {
    if (!this.options.enableAnalytics) {
      throw new Error('Analytics is disabled');
    }

    const allIssues = Array.from(this.issues.values());
    return this.analytics.analyzeIssues(allIssues);
  }

  /**
   * Export issues to various formats
   */
  exportIssues(format = 'json', criteria = {}) {
    const issues = this.searchIssues(criteria);
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(issues, null, 2);
      
      case 'csv':
        return this.exportToCSV(issues);
      
      case 'markdown':
        return this.exportToMarkdown(issues);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  exportToCSV(issues) {
    const headers = ['ID', 'Title', 'Type', 'Severity', 'State', 'Component', 'Reporter', 'Assignee', 'Created', 'Updated'];
    const rows = issues.map(issue => [
      issue.id,
      issue.title,
      issue.type,
      issue.severity?.level || '',
      issue.currentState,
      issue.component,
      issue.reporter,
      issue.assignee || '',
      issue.createdAt.toISOString(),
      issue.updatedAt.toISOString()
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  exportToMarkdown(issues) {
    let markdown = '# Issue Report\n\n';
    markdown += `Generated: ${new Date().toISOString()}\n`;
    markdown += `Total Issues: ${issues.length}\n\n`;

    for (const issue of issues) {
      markdown += `## ${issue.id}: ${issue.title}\n\n`;
      markdown += `- **Type**: ${issue.type}\n`;
      markdown += `- **Severity**: ${issue.severity?.level || 'unknown'}\n`;
      markdown += `- **State**: ${issue.currentState}\n`;
      markdown += `- **Component**: ${issue.component}\n`;
      markdown += `- **Reporter**: ${issue.reporter}\n`;
      if (issue.assignee) {
        markdown += `- **Assignee**: ${issue.assignee}\n`;
      }
      markdown += `- **Created**: ${issue.createdAt.toISOString()}\n`;
      markdown += `- **Updated**: ${issue.updatedAt.toISOString()}\n\n`;
      markdown += `### Description\n${issue.description}\n\n`;
      
      if (issue.comments.length > 0) {
        markdown += `### Comments\n`;
        for (const comment of issue.comments) {
          markdown += `- **${comment.author}** (${comment.createdAt.toISOString()}): ${comment.content}\n`;
        }
        markdown += '\n';
      }
      
      markdown += '---\n\n';
    }

    return markdown;
  }

  /**
   * Save issue to file
   */
  saveIssue(issueId) {
    const issue = this.issues.get(issueId);
    if (!issue) return;

    const filename = path.join(this.options.dataDirectory, `${issueId}.json`);
    fs.writeFileSync(filename, JSON.stringify(issue, null, 2));
  }

  /**
   * Load all issues from data directory
   */
  loadIssues() {
    if (!fs.existsSync(this.options.dataDirectory)) return;

    const files = fs.readdirSync(this.options.dataDirectory)
      .filter(file => file.endsWith('.json'));

    for (const file of files) {
      try {
        const filepath = path.join(this.options.dataDirectory, file);
        const issueData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        this.issues.set(issueData.id, issueData);
        
        // Restore workflow
        this.workflowManager.createIssueWorkflow(issueData.id, issueData.type);
        if (issueData.currentState) {
          // Note: This is a simplified restoration; full history would need more complex handling
          this.workflowManager.workflows.get(issueData.id).currentState = issueData.currentState;
        }
      } catch (error) {
        console.error(`Error loading issue from ${file}:`, error);
      }
    }
  }

  /**
   * Get issue statistics
   */
  getStatistics() {
    const allIssues = Array.from(this.issues.values());
    
    return {
      total: allIssues.length,
      byType: this.groupBy(allIssues, 'type'),
      bySeverity: this.groupBy(allIssues, 'severity.level'),
      byState: this.groupBy(allIssues, 'currentState'),
      byComponent: this.groupBy(allIssues, 'component'),
      recentActivity: allIssues
        .filter(issue => {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return new Date(issue.updatedAt) > dayAgo;
        })
        .length
    };
  }

  groupBy(array, keyPath) {
    const result = {};
    for (const item of array) {
      const key = this.getNestedValue(item, keyPath) || 'unknown';
      result[key] = (result[key] || 0) + 1;
    }
    return result;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }
}

export default IssueTracker;
export {
  IssueClassifier,
  IssueWorkflowManager,
  IssueAnalytics
}; 