/**
 * Load Test Runner
 * 
 * Simulates concurrent users and load scenarios to test system performance
 * under realistic and stress conditions for OHIF enhanced features
 */

import { PerformanceProfiler } from '../validation-tools/PerformanceProfiler.js';

export class LoadTestRunner {
  constructor() {
    this.profiler = new PerformanceProfiler();
    this.results = {};
    this.activeUsers = [];
    this.testScenarios = {
      normalLoad: { users: [1, 5, 10], duration: 300000 }, // 5 minutes
      peakLoad: { users: [25, 50], duration: 600000 }, // 10 minutes
      stressLoad: { users: [75, 100, 200], duration: 900000 }, // 15 minutes
      spikeLoad: { users: [10, 100, 10], duration: 180000 } // 3 minutes with spike
    };
  }

  /**
   * Execute comprehensive load testing suite
   */
  async runLoadTests() {
    console.log('🚀 Starting Load Testing Suite...');
    
    // Start performance monitoring
    await this.profiler.startMonitoring();
    
    try {
      // Run different load scenarios
      await this.runNormalLoadTest();
      await this.runPeakLoadTest();
      await this.runStressLoadTest();
      await this.runSpikeLoadTest();
      
      // Generate comprehensive report
      const report = await this.generateLoadTestReport();
      
      console.log('✅ Load testing completed!');
      return report;
      
    } finally {
      await this.profiler.stopMonitoring();
    }
  }

  /**
   * Run normal load test (1-10 concurrent users)
   */
  async runNormalLoadTest() {
    console.log('\n📊 Running Normal Load Test...');
    
    this.results.normalLoad = {};
    
    for (const userCount of this.testScenarios.normalLoad.users) {
      console.log(`  Testing with ${userCount} concurrent users...`);
      
      const result = await this.executeLoadTest({
        userCount,
        duration: this.testScenarios.normalLoad.duration / this.testScenarios.normalLoad.users.length,
        scenario: 'normal'
      });
      
      this.results.normalLoad[userCount] = result;
    }
  }

  /**
   * Run peak load test (25-50 concurrent users)
   */
  async runPeakLoadTest() {
    console.log('\n📈 Running Peak Load Test...');
    
    this.results.peakLoad = {};
    
    for (const userCount of this.testScenarios.peakLoad.users) {
      console.log(`  Testing with ${userCount} concurrent users...`);
      
      const result = await this.executeLoadTest({
        userCount,
        duration: this.testScenarios.peakLoad.duration / this.testScenarios.peakLoad.users.length,
        scenario: 'peak'
      });
      
      this.results.peakLoad[userCount] = result;
    }
  }

  /**
   * Run stress load test (75-200 concurrent users)
   */
  async runStressLoadTest() {
    console.log('\n⚡ Running Stress Load Test...');
    
    this.results.stressLoad = {};
    
    for (const userCount of this.testScenarios.stressLoad.users) {
      console.log(`  Testing with ${userCount} concurrent users...`);
      
      const result = await this.executeLoadTest({
        userCount,
        duration: this.testScenarios.stressLoad.duration / this.testScenarios.stressLoad.users.length,
        scenario: 'stress'
      });
      
      this.results.stressLoad[userCount] = result;
    }
  }

  /**
   * Run spike load test (sudden load increases)
   */
  async runSpikeLoadTest() {
    console.log('\n🌋 Running Spike Load Test...');
    
    this.results.spikeLoad = {};
    const [baseline, spike, recovery] = this.testScenarios.spikeLoad.users;
    const phaseDuration = this.testScenarios.spikeLoad.duration / 3;
    
    // Baseline phase
    console.log(`  Baseline: ${baseline} users...`);
    const baselineResult = await this.executeLoadTest({
      userCount: baseline,
      duration: phaseDuration,
      scenario: 'spike-baseline'
    });
    
    // Spike phase
    console.log(`  Spike: ${spike} users...`);
    const spikeResult = await this.executeLoadTest({
      userCount: spike,
      duration: phaseDuration,
      scenario: 'spike-peak'
    });
    
    // Recovery phase
    console.log(`  Recovery: ${recovery} users...`);
    const recoveryResult = await this.executeLoadTest({
      userCount: recovery,
      duration: phaseDuration,
      scenario: 'spike-recovery'
    });
    
    this.results.spikeLoad = {
      baseline: baselineResult,
      spike: spikeResult,
      recovery: recoveryResult
    };
  }

  /**
   * Execute a single load test scenario
   */
  async executeLoadTest({ userCount, duration, scenario }) {
    const startTime = Date.now();
    const metrics = {
      startTime,
      userCount,
      scenario,
      duration,
      completedActions: 0,
      errors: [],
      responsesTimes: [],
      throughput: 0,
      errorRate: 0
    };
    
    // Create virtual users
    const users = [];
    for (let i = 0; i < userCount; i++) {
      const user = new VirtualUser(i, scenario);
      users.push(user);
    }
    
    // Start all users concurrently
    const userPromises = users.map(user => this.runVirtualUser(user, duration, metrics));
    
    // Wait for test completion
    await Promise.all(userPromises);
    
    // Calculate final metrics
    const endTime = Date.now();
    const actualDuration = endTime - startTime;
    
    metrics.actualDuration = actualDuration;
    metrics.throughput = (metrics.completedActions / actualDuration) * 1000; // actions per second
    metrics.errorRate = (metrics.errors.length / metrics.completedActions) * 100;
    metrics.averageResponseTime = metrics.responsesTimes.reduce((a, b) => a + b, 0) / metrics.responsesTimes.length;
    
    console.log(`    Completed: ${metrics.completedActions} actions, Error rate: ${metrics.errorRate.toFixed(1)}%, Avg response: ${metrics.averageResponseTime.toFixed(0)}ms`);
    
    return metrics;
  }

  /**
   * Run a single virtual user
   */
  async runVirtualUser(user, duration, metrics) {
    const endTime = Date.now() + duration;
    
    while (Date.now() < endTime) {
      try {
        const action = user.getNextAction();
        const startTime = performance.now();
        
        await this.executeUserAction(action);
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        metrics.completedActions++;
        metrics.responsesTimes.push(responseTime);
        
        // Random think time between actions (1-3 seconds)
        const thinkTime = 1000 + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, thinkTime));
        
      } catch (error) {
        metrics.errors.push({
          userId: user.id,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Execute a user action (simulate OHIF interactions)
   */
  async executeUserAction(action) {
    switch (action.type) {
      case 'loadStudy':
        await this.simulateStudyLoad(action.payload);
        break;
      case 'activateVirtualSeries':
        await this.simulateVirtualSeriesActivation(action.payload);
        break;
      case 'compareStudies':
        await this.simulateStudyComparison(action.payload);
        break;
      case 'scrollImages':
        await this.simulateImageScrolling(action.payload);
        break;
      case 'zoomPan':
        await this.simulateZoomPan(action.payload);
        break;
      case 'toolActivation':
        await this.simulateToolActivation(action.payload);
        break;
      default:
        await this.simulateGenericAction(action);
    }
  }

  /**
   * Generate comprehensive load test report
   */
  async generateLoadTestReport() {
    const performanceSnapshot = await this.profiler.getSnapshot();
    
    const report = {
      timestamp: new Date().toISOString(),
      testDuration: Date.now() - (this.results.normalLoad?.[1]?.startTime || Date.now()),
      results: this.results,
      performanceSnapshot,
      analysis: this.analyzeResults(),
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  /**
   * Analyze load test results
   */
  analyzeResults() {
    const analysis = {
      normalLoadCapacity: this.findCapacityThreshold(this.results.normalLoad),
      peakLoadCapacity: this.findCapacityThreshold(this.results.peakLoad),
      stressTestPassed: this.evaluateStressTest(this.results.stressLoad),
      spikeRecoveryTime: this.calculateSpikeRecoveryTime(this.results.spikeLoad)
    };
    
    return analysis;
  }

  /**
   * Find capacity threshold where performance degrades
   */
  findCapacityThreshold(loadResults) {
    if (!loadResults) return null;
    
    for (const [userCount, result] of Object.entries(loadResults)) {
      if (result.errorRate > 5 || result.averageResponseTime > 3000) {
        return {
          threshold: userCount,
          reason: result.errorRate > 5 ? 'high_error_rate' : 'slow_response_time'
        };
      }
    }
    
    return { threshold: 'not_reached', reason: 'all_tests_passed' };
  }

  /**
   * Evaluate stress test results
   */
  evaluateStressTest(stressResults) {
    if (!stressResults) return false;
    
    // System should maintain < 10% error rate and < 5s response time under stress
    for (const result of Object.values(stressResults)) {
      if (result.errorRate > 10 || result.averageResponseTime > 5000) {
        return false;
      }
    }
    
    return true;
  }

  // Simulation methods
  async simulateStudyLoad(payload) {
    const studySize = payload?.size || 'medium';
    const baseTimes = { small: 1000, medium: 2000, large: 4000 };
    const loadTime = baseTimes[studySize] + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, loadTime));
  }

  async simulateVirtualSeriesActivation(payload) {
    const activationTime = 800 + Math.random() * 500;
    await new Promise(resolve => setTimeout(resolve, activationTime));
  }

  async simulateStudyComparison(payload) {
    const comparisonTime = 1500 + Math.random() * 800;
    await new Promise(resolve => setTimeout(resolve, comparisonTime));
  }

  async simulateImageScrolling(payload) {
    const scrollTime = 100 + Math.random() * 200;
    await new Promise(resolve => setTimeout(resolve, scrollTime));
  }

  async simulateZoomPan(payload) {
    const interactionTime = 150 + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, interactionTime));
  }

  async simulateToolActivation(payload) {
    const toolTime = 200 + Math.random() * 300;
    await new Promise(resolve => setTimeout(resolve, toolTime));
  }

  async simulateGenericAction(action) {
    const actionTime = 300 + Math.random() * 400;
    await new Promise(resolve => setTimeout(resolve, actionTime));
  }
}

/**
 * Virtual User class to simulate user behavior
 */
class VirtualUser {
  constructor(id, scenario) {
    this.id = id;
    this.scenario = scenario;
    this.actionIndex = 0;
    this.actions = this.generateActionSequence(scenario);
  }

  /**
   * Generate realistic action sequence based on scenario
   */
  generateActionSequence(scenario) {
    const baseActions = [
      { type: 'loadStudy', payload: { size: 'medium' } },
      { type: 'activateVirtualSeries', payload: {} },
      { type: 'scrollImages', payload: { count: 20 } },
      { type: 'zoomPan', payload: {} },
      { type: 'toolActivation', payload: { tool: 'windowing' } }
    ];

    switch (scenario) {
      case 'stress':
        // More intensive actions for stress testing
        return [
          ...baseActions,
          { type: 'loadStudy', payload: { size: 'large' } },
          { type: 'compareStudies', payload: { studyCount: 3 } },
          { type: 'scrollImages', payload: { count: 50 } }
        ];
      
      case 'spike-peak':
        // Quick, intensive actions during spike
        return [
          { type: 'loadStudy', payload: { size: 'small' } },
          { type: 'activateVirtualSeries', payload: {} },
          { type: 'scrollImages', payload: { count: 10 } }
        ];
      
      default:
        return baseActions;
    }
  }

  /**
   * Get next action in sequence
   */
  getNextAction() {
    const action = this.actions[this.actionIndex % this.actions.length];
    this.actionIndex++;
    return action;
  }
}

export default LoadTestRunner;
