/**
 * CI/CD Pipeline Integration Script
 * 
 * Automated test execution orchestrator for continuous integration
 * Provides different test execution strategies for various CI/CD scenarios
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const TestConfig = require('../config/test-config');

class CIPipelineRunner {
  constructor() {
    this.testResults = {
      startTime: Date.now(),
      pipeline: process.env.CI_PIPELINE_NAME || 'unknown',
      commit: process.env.CI_COMMIT_SHA || 'unknown',
      branch: process.env.CI_COMMIT_BRANCH || 'unknown',
      buildId: process.env.CI_BUILD_ID || Date.now().toString(),
      tests: [],
      summary: {}
    };
    
    this.exitCode = 0;
    this.reportPath = path.join(__dirname, '../reports/ci');
  }

  /**
   * Main execution entry point for CI/CD pipeline
   */
  async run() {
    console.log('🚀 Starting CI/CD Pipeline Test Execution');
    console.log(`📋 Pipeline: ${this.testResults.pipeline}`);
    console.log(`🌿 Branch: ${this.testResults.branch}`);
    console.log(`📦 Commit: ${this.testResults.commit.substring(0, 8)}`);
    console.log(`🏗️ Build ID: ${this.testResults.buildId}`);
    
    try {
      await this.setupEnvironment();
      await this.determineTestStrategy();
      await this.executeTests();
      await this.generateReports();
      await this.publishResults();
      
      console.log(`✅ CI/CD Pipeline completed successfully`);
      
    } catch (error) {
      console.error(`❌ CI/CD Pipeline failed:`, error);
      this.exitCode = 1;
    } finally {
      await this.cleanup();
      process.exit(this.exitCode);
    }
  }

  /**
   * Setup CI/CD environment and dependencies
   */
  async setupEnvironment() {
    console.log('🔧 Setting up CI/CD environment...');
    
    // Ensure reports directory exists
    await fs.mkdir(this.reportPath, { recursive: true });
    
    // Install dependencies if needed
    if (!process.env.SKIP_INSTALL) {
      console.log('📦 Installing dependencies...');
      execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      execSync('npx playwright install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    }
    
    // Verify test environment
    await this.verifyEnvironment();
    
    console.log('✅ Environment setup completed');
  }

  /**
   * Verify CI/CD environment is properly configured
   */
  async verifyEnvironment() {
    const verifications = [
      {
        name: 'Node.js version',
        check: () => {
          const version = process.version;
          const majorVersion = parseInt(version.split('.')[0].substring(1));
          if (majorVersion < 18) {
            throw new Error(`Node.js 18+ required, found ${version}`);
          }
          return version;
        }
      },
      {
        name: 'Test configuration',
        check: () => {
          if (!TestConfig.baseUrl) {
            throw new Error('Base URL not configured');
          }
          return TestConfig.baseUrl;
        }
      },
      {
        name: 'Browser availability',
        check: () => {
          try {
            execSync('npx playwright --version', { stdio: 'pipe' });
            return 'Available';
          } catch (error) {
            throw new Error('Playwright browsers not available');
          }
        }
      },
      {
        name: 'Test data',
        check: async () => {
          const testDataPath = path.join(__dirname, '../test-data');
          try {
            await fs.access(testDataPath);
            return 'Available';
          } catch (error) {
            throw new Error('Test data not available');
          }
        }
      }
    ];
    
    console.log('🔍 Verifying environment...');
    
    for (const verification of verifications) {
      try {
        const result = await verification.check();
        console.log(`  ✅ ${verification.name}: ${result}`);
      } catch (error) {
        console.log(`  ❌ ${verification.name}: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Determine test execution strategy based on CI/CD context
   */
  async determineTestStrategy() {
    console.log('🎯 Determining test execution strategy...');
    
    const context = {
      isPullRequest: !!process.env.CI_PULL_REQUEST || !!process.env.GITHUB_PULL_REQUEST,
      isMasterBranch: this.testResults.branch === 'main' || this.testResults.branch === 'master',
      isDevelopBranch: this.testResults.branch === 'develop',
      isReleaseBranch: this.testResults.branch.startsWith('release/'),
      isFeatureBranch: this.testResults.branch.startsWith('feature/'),
      isNightlyBuild: process.env.CI_SCHEDULE_TYPE === 'nightly',
      hasChangedFiles: await this.getChangedFiles()
    };
    
    // Determine test suite based on context
    if (context.isPullRequest) {
      this.testStrategy = 'pull-request';
      this.testSuites = ['critical', 'regression'];
    } else if (context.isMasterBranch) {
      this.testStrategy = 'master-branch';
      this.testSuites = ['critical', 'regression', 'performance', 'integration'];
    } else if (context.isDevelopBranch) {
      this.testStrategy = 'develop-branch';
      this.testSuites = ['critical', 'regression', 'integration'];
    } else if (context.isReleaseBranch) {
      this.testStrategy = 'release-branch';
      this.testSuites = ['critical', 'regression', 'performance', 'integration', 'cross-browser'];
    } else if (context.isNightlyBuild) {
      this.testStrategy = 'nightly';
      this.testSuites = ['all'];
    } else {
      this.testStrategy = 'feature-branch';
      this.testSuites = ['critical'];
    }
    
    console.log(`📊 Test strategy: ${this.testStrategy}`);
    console.log(`🧪 Test suites: ${this.testSuites.join(', ')}`);
    
    return { context, testStrategy: this.testStrategy, testSuites: this.testSuites };
  }

  /**
   * Get list of changed files to optimize test execution
   */
  async getChangedFiles() {
    try {
      // Try to get changed files from git
      const gitDiff = execSync('git diff --name-only HEAD~1 HEAD', { 
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
      
      return gitDiff ? gitDiff.split('\n') : [];
    } catch (error) {
      console.log('⚠️ Could not determine changed files, running all tests');
      return [];
    }
  }

  /**
   * Execute tests based on determined strategy
   */
  async executeTests() {
    console.log('🧪 Executing test suites...');
    
    const suiteExecutors = {
      'critical': () => this.runCriticalTests(),
      'regression': () => this.runRegressionTests(),
      'performance': () => this.runPerformanceTests(),
      'integration': () => this.runIntegrationTests(),
      'cross-browser': () => this.runCrossBrowserTests(),
      'all': () => this.runAllTests()
    };
    
    for (const suite of this.testSuites) {
      if (suiteExecutors[suite]) {
        console.log(`🔄 Running ${suite} test suite...`);
        
        const startTime = Date.now();
        
        try {
          const result = await suiteExecutors[suite]();
          const duration = Date.now() - startTime;
          
          this.testResults.tests.push({
            suite: suite,
            duration: duration,
            result: result,
            passed: result.exitCode === 0
          });
          
          console.log(`✅ ${suite} tests completed in ${duration}ms`);
          
          if (result.exitCode !== 0) {
            console.log(`❌ ${suite} tests failed with exit code ${result.exitCode}`);
            this.exitCode = result.exitCode;
            
            // Fail fast on critical test failures
            if (suite === 'critical') {
              throw new Error(`Critical tests failed, stopping pipeline`);
            }
          }
          
        } catch (error) {
          console.error(`❌ ${suite} test suite failed:`, error);
          this.exitCode = 1;
          
          this.testResults.tests.push({
            suite: suite,
            duration: Date.now() - startTime,
            result: { exitCode: 1, error: error.message },
            passed: false
          });
          
          if (suite === 'critical') {
            throw error; // Fail fast on critical tests
          }
        }
      }
    }
  }

  /**
   * Run critical path tests (fast feedback)
   */
  async runCriticalTests() {
    console.log('⚡ Running critical path tests...');
    
    return this.executeTestCommand([
      'npx jest',
      '--testPathPattern="critical"',
      '--maxWorkers=2',
      '--coverage=false',
      '--verbose',
      '--json',
      `--outputFile="${path.join(this.reportPath, 'critical-results.json')}"`
    ]);
  }

  /**
   * Run regression test suite
   */
  async runRegressionTests() {
    console.log('🔄 Running regression tests...');
    
    return this.executeTestCommand([
      'npx jest',
      '--testPathPattern="regression"',
      '--maxWorkers=4',
      '--coverage',
      '--verbose',
      '--json',
      `--outputFile="${path.join(this.reportPath, 'regression-results.json')}"`
    ]);
  }

  /**
   * Run performance test suite
   */
  async runPerformanceTests() {
    console.log('📈 Running performance tests...');
    
    return this.executeTestCommand([
      'node',
      path.join(__dirname, '../frameworks/performance-automation/PerformanceTestRunner.js'),
      '--output',
      path.join(this.reportPath, 'performance-results.json')
    ]);
  }

  /**
   * Run integration test suite
   */
  async runIntegrationTests() {
    console.log('🔗 Running integration tests...');
    
    return this.executeTestCommand([
      'npx jest',
      '--testPathPattern="integration"',
      '--maxWorkers=2',
      '--timeout=60000',
      '--verbose',
      '--json',
      `--outputFile="${path.join(this.reportPath, 'integration-results.json')}"`
    ]);
  }

  /**
   * Run cross-browser compatibility tests
   */
  async runCrossBrowserTests() {
    console.log('🌐 Running cross-browser tests...');
    
    const browsers = ['chromium', 'firefox', 'webkit'];
    const results = [];
    
    for (const browser of browsers) {
      console.log(`Testing on ${browser}...`);
      
      const result = await this.executeTestCommand([
        'npx jest',
        '--testPathPattern="cross-browser"',
        '--maxWorkers=1',
        '--verbose',
        '--json',
        `--outputFile="${path.join(this.reportPath, `${browser}-results.json`)}"`,
        `--testEnvironmentOptions='{"browser":"${browser}"}'`
      ]);
      
      results.push({ browser, result });
    }
    
    // Aggregate browser results
    const overallExitCode = results.some(r => r.result.exitCode !== 0) ? 1 : 0;
    
    return {
      exitCode: overallExitCode,
      stdout: results.map(r => r.result.stdout).join('\n'),
      stderr: results.map(r => r.result.stderr).join('\n'),
      browserResults: results
    };
  }

  /**
   * Run complete test suite (nightly builds)
   */
  async runAllTests() {
    console.log('🎯 Running complete test suite...');
    
    const allSuites = ['critical', 'regression', 'performance', 'integration', 'cross-browser'];
    const results = [];
    
    for (const suite of allSuites) {
      console.log(`Running ${suite} as part of complete suite...`);
      
      try {
        let result;
        switch (suite) {
          case 'critical':
            result = await this.runCriticalTests();
            break;
          case 'regression':
            result = await this.runRegressionTests();
            break;
          case 'performance':
            result = await this.runPerformanceTests();
            break;
          case 'integration':
            result = await this.runIntegrationTests();
            break;
          case 'cross-browser':
            result = await this.runCrossBrowserTests();
            break;
        }
        
        results.push({ suite, result, passed: result.exitCode === 0 });
        
      } catch (error) {
        results.push({ 
          suite, 
          result: { exitCode: 1, error: error.message }, 
          passed: false 
        });
      }
    }
    
    const overallExitCode = results.some(r => !r.passed) ? 1 : 0;
    
    return {
      exitCode: overallExitCode,
      suiteResults: results,
      stdout: results.map(r => r.result.stdout || '').join('\n'),
      stderr: results.map(r => r.result.stderr || '').join('\n')
    };
  }

  /**
   * Execute test command with proper error handling and logging
   */
  async executeTestCommand(command) {
    return new Promise((resolve) => {
      const commandStr = command.join(' ');
      console.log(`🔧 Executing: ${commandStr}`);
      
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      
      const child = spawn(command[0], command.slice(1), {
        cwd: path.join(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'test',
          CI: 'true'
        }
      });
      
      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        process.stdout.write(chunk);
      });
      
      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        process.stderr.write(chunk);
      });
      
      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        console.log(`Command completed with exit code ${code} in ${duration}ms`);
        
        resolve({
          exitCode: code,
          stdout: stdout,
          stderr: stderr,
          duration: duration
        });
      });
      
      child.on('error', (error) => {
        console.error(`Command failed to start: ${error.message}`);
        resolve({
          exitCode: 1,
          stdout: stdout,
          stderr: stderr + error.message,
          duration: Date.now() - startTime
        });
      });
      
      // Timeout handling for long-running tests
      const timeout = setTimeout(() => {
        console.log('⏰ Test execution timeout, terminating process...');
        child.kill('SIGTERM');
        
        setTimeout(() => {
          child.kill('SIGKILL');
        }, 5000);
      }, 30 * 60 * 1000); // 30 minute timeout
      
      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Generate comprehensive CI/CD reports
   */
  async generateReports() {
    console.log('📊 Generating CI/CD reports...');
    
    const summary = this.calculateSummary();
    
    const reportData = {
      ...this.testResults,
      endTime: Date.now(),
      totalDuration: Date.now() - this.testResults.startTime,
      summary: summary,
      strategy: this.testStrategy,
      suites: this.testSuites
    };
    
    // Generate JSON report
    const jsonReportPath = path.join(this.reportPath, `ci-report-${this.testResults.buildId}.json`);
    await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2));
    
    // Generate JUnit XML report for CI/CD integration
    const junitReport = this.generateJUnitXML(reportData);
    const junitReportPath = path.join(this.reportPath, `junit-report-${this.testResults.buildId}.xml`);
    await fs.writeFile(junitReportPath, junitReport);
    
    // Generate HTML summary report
    const htmlReport = await this.generateHTMLReport(reportData);
    const htmlReportPath = path.join(this.reportPath, `ci-summary-${this.testResults.buildId}.html`);
    await fs.writeFile(htmlReportPath, htmlReport);
    
    // Generate test coverage report if available
    await this.generateCoverageReport();
    
    console.log(`📄 CI/CD reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   JUnit: ${junitReportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
    
    return reportData;
  }

  /**
   * Calculate test execution summary
   */
  calculateSummary() {
    const totalSuites = this.testResults.tests.length;
    const passedSuites = this.testResults.tests.filter(test => test.passed).length;
    const failedSuites = totalSuites - passedSuites;
    const passRate = totalSuites > 0 ? (passedSuites / totalSuites) * 100 : 0;
    
    const totalDuration = this.testResults.tests.reduce((sum, test) => sum + test.duration, 0);
    
    return {
      totalSuites,
      passedSuites,
      failedSuites,
      passRate,
      totalDuration,
      overallStatus: this.exitCode === 0 ? 'PASSED' : 'FAILED'
    };
  }

  /**
   * Generate JUnit XML report for CI/CD system integration
   */
  generateJUnitXML(reportData) {
    const testSuites = reportData.tests.map(test => {
      const suiteName = test.suite;
      const duration = (test.duration / 1000).toFixed(3);
      const status = test.passed ? 'passed' : 'failed';
      
      let testCaseXML = `    <testcase name="${suiteName}" classname="CI.Pipeline" time="${duration}">`;
      
      if (!test.passed) {
        const errorMessage = test.result.error || 'Test suite failed';
        testCaseXML += `\n      <failure message="${errorMessage}">`;
        testCaseXML += `\n        ${test.result.stderr || 'No error details available'}`;
        testCaseXML += `\n      </failure>`;
      }
      
      testCaseXML += '\n    </testcase>';
      
      return testCaseXML;
    }).join('\n');
    
    const totalDuration = (reportData.totalDuration / 1000).toFixed(3);
    const totalTests = reportData.tests.length;
    const failures = reportData.tests.filter(test => !test.passed).length;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="OHIF Enhanced Features CI Pipeline" 
             tests="${totalTests}" 
             failures="${failures}" 
             errors="0" 
             time="${totalDuration}"
             timestamp="${new Date(reportData.startTime).toISOString()}">
${testSuites}
  </testsuite>
</testsuites>`;
  }

  /**
   * Generate HTML summary report
   */
  async generateHTMLReport(reportData) {
    const statusColor = reportData.summary.overallStatus === 'PASSED' ? '#28a745' : '#dc3545';
    const passRateColor = reportData.summary.passRate >= 80 ? '#28a745' : 
                         reportData.summary.passRate >= 60 ? '#ffc107' : '#dc3545';
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>OHIF Enhanced Features - CI/CD Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .status { font-size: 24px; font-weight: bold; color: ${statusColor}; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .metric-label { color: #6c757d; }
        .test-results { margin: 20px 0; }
        .test-suite { margin: 10px 0; padding: 10px; border-left: 4px solid #dee2e6; }
        .passed { border-left-color: #28a745; }
        .failed { border-left-color: #dc3545; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; }
    </style>
</head>
<body>
    <div class="header">
        <h1>OHIF Enhanced Features - CI/CD Test Report</h1>
        <div class="status">${reportData.summary.overallStatus}</div>
        <p><strong>Pipeline:</strong> ${reportData.pipeline}</p>
        <p><strong>Branch:</strong> ${reportData.branch}</p>
        <p><strong>Commit:</strong> ${reportData.commit}</p>
        <p><strong>Build ID:</strong> ${reportData.buildId}</p>
        <p><strong>Strategy:</strong> ${reportData.strategy}</p>
    </div>
    
    <div class="metrics">
        <div class="metric">
            <div class="metric-value" style="color: ${passRateColor}">${reportData.summary.passRate.toFixed(1)}%</div>
            <div class="metric-label">Pass Rate</div>
        </div>
        <div class="metric">
            <div class="metric-value">${reportData.summary.totalSuites}</div>
            <div class="metric-label">Total Suites</div>
        </div>
        <div class="metric">
            <div class="metric-value" style="color: #28a745">${reportData.summary.passedSuites}</div>
            <div class="metric-label">Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value" style="color: #dc3545">${reportData.summary.failedSuites}</div>
            <div class="metric-label">Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${(reportData.totalDuration / 1000 / 60).toFixed(1)}m</div>
            <div class="metric-label">Duration</div>
        </div>
    </div>
    
    <div class="test-results">
        <h2>Test Suite Results</h2>
        ${reportData.tests.map(test => `
        <div class="test-suite ${test.passed ? 'passed' : 'failed'}">
            <h3>${test.suite} ${test.passed ? '✅' : '❌'}</h3>
            <p><strong>Duration:</strong> ${(test.duration / 1000).toFixed(2)}s</p>
            ${!test.passed ? `<p><strong>Error:</strong> ${test.result.error || 'Test suite failed'}</p>` : ''}
        </div>
        `).join('')}
    </div>
    
    <div class="footer">
        <p>Generated on ${new Date().toISOString()}</p>
        <p>OHIF Enhanced Features Automated Testing Framework</p>
    </div>
</body>
</html>`;
  }

  /**
   * Generate test coverage report
   */
  async generateCoverageReport() {
    try {
      const coveragePath = path.join(__dirname, '../coverage');
      const coverageReportPath = path.join(this.reportPath, 'coverage');
      
      // Check if coverage data exists
      await fs.access(coveragePath);
      
      // Copy coverage report to CI reports directory
      await fs.mkdir(coverageReportPath, { recursive: true });
      
      const lcovPath = path.join(coveragePath, 'lcov.info');
      const targetLcovPath = path.join(coverageReportPath, 'lcov.info');
      
      try {
        await fs.copyFile(lcovPath, targetLcovPath);
        console.log('📊 Coverage report copied to CI reports');
      } catch (error) {
        console.log('⚠️ No coverage data found');
      }
      
    } catch (error) {
      console.log('⚠️ Coverage report generation skipped - no coverage data');
    }
  }

  /**
   * Publish results to external systems
   */
  async publishResults() {
    console.log('📤 Publishing test results...');
    
    // Publish to GitHub (if running on GitHub Actions)
    if (process.env.GITHUB_ACTIONS) {
      await this.publishToGitHub();
    }
    
    // Publish to Azure DevOps (if running on Azure Pipelines)
    if (process.env.AZURE_HTTP_USER_AGENT) {
      await this.publishToAzureDevOps();
    }
    
    // Publish to Jenkins (if running on Jenkins)
    if (process.env.JENKINS_URL) {
      await this.publishToJenkins();
    }
    
    // Publish to Slack (if webhook configured)
    if (process.env.SLACK_WEBHOOK_URL) {
      await this.publishToSlack();
    }
  }

  /**
   * Publish results to GitHub Actions
   */
  async publishToGitHub() {
    try {
      const summary = this.testResults.summary;
      const status = summary.overallStatus === 'PASSED' ? '✅' : '❌';
      
      // Set GitHub output
      console.log(`::set-output name=test-status::${summary.overallStatus}`);
      console.log(`::set-output name=pass-rate::${summary.passRate.toFixed(1)}`);
      console.log(`::set-output name=total-suites::${summary.totalSuites}`);
      
      // Create job summary
      const summaryContent = `
# ${status} OHIF Enhanced Features Test Results

| Metric | Value |
|--------|-------|
| **Status** | ${summary.overallStatus} |
| **Pass Rate** | ${summary.passRate.toFixed(1)}% |
| **Total Suites** | ${summary.totalSuites} |
| **Passed** | ${summary.passedSuites} |
| **Failed** | ${summary.failedSuites} |
| **Duration** | ${(this.testResults.totalDuration / 1000 / 60).toFixed(1)} minutes |

## Test Suite Results
${this.testResults.tests.map(test => 
  `- ${test.passed ? '✅' : '❌'} **${test.suite}** (${(test.duration / 1000).toFixed(2)}s)`
).join('\n')}
`;
      
      await fs.writeFile(process.env.GITHUB_STEP_SUMMARY || '/dev/null', summaryContent);
      
      console.log('✅ Results published to GitHub Actions');
      
    } catch (error) {
      console.log('⚠️ Failed to publish to GitHub Actions:', error.message);
    }
  }

  /**
   * Publish results to Slack
   */
  async publishToSlack() {
    try {
      const summary = this.testResults.summary;
      const status = summary.overallStatus === 'PASSED' ? ':white_check_mark:' : ':x:';
      const color = summary.overallStatus === 'PASSED' ? 'good' : 'danger';
      
      const payload = {
        text: `OHIF Enhanced Features Test Results ${status}`,
        attachments: [
          {
            color: color,
            fields: [
              {
                title: 'Status',
                value: summary.overallStatus,
                short: true
              },
              {
                title: 'Pass Rate',
                value: `${summary.passRate.toFixed(1)}%`,
                short: true
              },
              {
                title: 'Branch',
                value: this.testResults.branch,
                short: true
              },
              {
                title: 'Commit',
                value: this.testResults.commit.substring(0, 8),
                short: true
              }
            ],
            footer: 'OHIF Automated Testing',
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      };
      
      // Send to Slack webhook (implementation would depend on HTTP client)
      console.log('📤 Slack payload prepared:', JSON.stringify(payload, null, 2));
      console.log('✅ Results prepared for Slack publication');
      
    } catch (error) {
      console.log('⚠️ Failed to publish to Slack:', error.message);
    }
  }

  /**
   * Cleanup resources and temporary files
   */
  async cleanup() {
    console.log('🧹 Cleaning up CI/CD resources...');
    
    // Clean up temporary files
    try {
      const tempDir = path.join(__dirname, '../temp');
      await fs.rmdir(tempDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    console.log('✅ Cleanup completed');
  }
}

// Execute if called directly
if (require.main === module) {
  const runner = new CIPipelineRunner();
  runner.run();
}

module.exports = CIPipelineRunner; 