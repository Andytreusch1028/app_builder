/**
 * Comprehensive Test Runner
 * Runs all test suites and generates detailed reports
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: number;
  errors: string[];
}

interface TestReport {
  timestamp: Date;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalDuration: number;
  overallCoverage: number;
  results: TestResult[];
  status: 'PASS' | 'FAIL';
}

export class TestRunner {
  private results: TestResult[] = [];

  /**
   * Run all test suites
   */
  async runAll(): Promise<TestReport> {
    console.log('🧪 Starting Comprehensive Test Suite\n');
    console.log('=' .repeat(80));

    const startTime = Date.now();

    // Phase 1: Unit Tests
    await this.runPhase('Unit Tests', async () => {
      await this.runUnitTests();
    });

    // Phase 2: Integration Tests
    await this.runPhase('Integration Tests', async () => {
      await this.runIntegrationTests();
    });

    // Phase 3: API Tests
    await this.runPhase('API Tests', async () => {
      await this.runApiTests();
    });

    // Phase 4: E2E Tests
    await this.runPhase('End-to-End Tests', async () => {
      await this.runE2ETests();
    });

    // Phase 5: Performance Tests
    await this.runPhase('Performance Tests', async () => {
      await this.runPerformanceTests();
    });

    // Phase 6: Security Tests
    await this.runPhase('Security Tests', async () => {
      await this.runSecurityTests();
    });

    const totalDuration = Date.now() - startTime;

    // Generate report
    const report = this.generateReport(totalDuration);

    // Save report
    this.saveReport(report);

    // Display summary
    this.displaySummary(report);

    return report;
  }

  /**
   * Run a test phase
   */
  private async runPhase(name: string, fn: () => Promise<void>): Promise<void> {
    console.log(`\n📋 ${name}`);
    console.log('-'.repeat(80));
    
    try {
      await fn();
    } catch (error) {
      console.error(`❌ ${name} failed:`, error);
    }
  }

  /**
   * Run unit tests
   */
  private async runUnitTests(): Promise<void> {
    console.log('Running unit tests...\n');

    const testFiles = this.findTestFiles('tests/unit');
    
    for (const file of testFiles) {
      await this.runTestFile(file, 'Unit');
    }
  }

  /**
   * Run integration tests
   */
  private async runIntegrationTests(): Promise<void> {
    console.log('Running integration tests...\n');

    const testFiles = this.findTestFiles('tests/integration');
    
    for (const file of testFiles) {
      await this.runTestFile(file, 'Integration');
    }
  }

  /**
   * Run API tests
   */
  private async runApiTests(): Promise<void> {
    console.log('Running API tests...\n');

    const testFiles = this.findTestFiles('tests/api');
    
    for (const file of testFiles) {
      await this.runTestFile(file, 'API');
    }
  }

  /**
   * Run E2E tests
   */
  private async runE2ETests(): Promise<void> {
    console.log('Running E2E tests...\n');

    const testFiles = this.findTestFiles('tests/e2e');
    
    for (const file of testFiles) {
      await this.runTestFile(file, 'E2E');
    }
  }

  /**
   * Run performance tests
   */
  private async runPerformanceTests(): Promise<void> {
    console.log('Running performance tests...\n');

    const testFiles = this.findTestFiles('tests/performance');
    
    for (const file of testFiles) {
      await this.runTestFile(file, 'Performance');
    }
  }

  /**
   * Run security tests
   */
  private async runSecurityTests(): Promise<void> {
    console.log('Running security tests...\n');

    const testFiles = this.findTestFiles('tests/security');
    
    for (const file of testFiles) {
      await this.runTestFile(file, 'Security');
    }
  }

  /**
   * Find test files in directory
   */
  private findTestFiles(dir: string): string[] {
    const testFiles: string[] = [];

    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory not found: ${dir}`);
      return testFiles;
    }

    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory()) {
        testFiles.push(...this.findTestFiles(fullPath));
      } else if (file.name.endsWith('.test.ts') || file.name.endsWith('.spec.ts')) {
        testFiles.push(fullPath);
      }
    }

    return testFiles;
  }

  /**
   * Run a single test file
   */
  private async runTestFile(file: string, suite: string): Promise<void> {
    console.log(`  Testing: ${path.basename(file)}`);

    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Run the test file using ts-node or jest
      const output = execSync(`npx jest ${file} --json`, {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const result = JSON.parse(output);
      const duration = Date.now() - startTime;

      this.results.push({
        suite: `${suite}: ${path.basename(file)}`,
        passed: result.numPassedTests || 0,
        failed: result.numFailedTests || 0,
        skipped: result.numPendingTests || 0,
        duration,
        errors
      });

      console.log(`    ✅ Passed: ${result.numPassedTests || 0}`);
      if (result.numFailedTests > 0) {
        console.log(`    ❌ Failed: ${result.numFailedTests}`);
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      errors.push(error.message);

      this.results.push({
        suite: `${suite}: ${path.basename(file)}`,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration,
        errors
      });

      console.log(`    ❌ Test file failed to run`);
      console.log(`    Error: ${error.message}`);
    }
  }

  /**
   * Generate test report
   */
  private generateReport(duration: number): TestReport {
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalSkipped = this.results.reduce((sum, r) => sum + r.skipped, 0);
    
    return {
      timestamp: new Date(),
      totalTests: totalPassed + totalFailed + totalSkipped,
      totalPassed,
      totalFailed,
      totalSkipped,
      totalDuration: duration,
      overallCoverage: 0, // Calculate from coverage reports
      results: this.results,
      status: totalFailed === 0 ? 'PASS' : 'FAIL'
    };
  }

  /**
   * Save report to file
   */
  private saveReport(report: TestReport): void {
    const reportPath = path.join('test-reports', `report-${Date.now()}.json`);
    fs.mkdirSync('test-reports', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);
  }

  /**
   * Display summary
   */
  private displaySummary(report: TestReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Status: ${report.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`Passed: ${report.totalPassed} ✅`);
    console.log(`Failed: ${report.totalFailed} ❌`);
    console.log(`Skipped: ${report.totalSkipped} ⏭️`);
    console.log(`Duration: ${(report.totalDuration / 1000).toFixed(2)}s`);
    console.log(`Coverage: ${report.overallCoverage.toFixed(2)}%`);
    console.log('='.repeat(80));
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAll().then(report => {
    process.exit(report.status === 'PASS' ? 0 : 1);
  });
}

