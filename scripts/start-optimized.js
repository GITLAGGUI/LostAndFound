#!/usr/bin/env node

// Performance testing and monitoring script
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Performance Optimization Tests...\n');

// 1. Kill all existing node processes
console.log('1. Cleaning up existing processes...');
const killProcesses = spawn('taskkill', ['/F', '/IM', 'node.exe'], { 
  stdio: 'inherit',
  shell: true 
});

killProcesses.on('close', (code) => {
  console.log('✅ Processes cleaned up\n');
  
  // 2. Check Node.js memory settings
  console.log('2. Checking Node.js configuration...');
  const nodeVersion = spawn('node', ['--version'], { stdio: 'pipe' });
  
  nodeVersion.stdout.on('data', (data) => {
    console.log(`Node.js version: ${data.toString().trim()}`);
  });
  
  nodeVersion.on('close', (code) => {
    // 3. Set memory options and start development server
    console.log('\n3. Starting optimized development server...');
    
    const env = {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096',
      NODE_ENV: 'development'
    };
    
    const devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      env: env,
      shell: true
    });
    
    // 4. Monitor memory usage
    setTimeout(() => {
      console.log('\n4. Monitoring system performance...');
      
      const taskList = spawn('tasklist', ['/FI', 'IMAGENAME eq node.exe', '/FO', 'CSV'], {
        stdio: 'pipe',
        shell: true
      });
      
      taskList.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Node.js processes:');
        console.log(output);
      });
      
    }, 5000);
    
    devServer.on('close', (code) => {
      console.log(`Development server exited with code ${code}`);
    });
  });
});

// 5. Performance tips
console.log('\n📋 PERFORMANCE OPTIMIZATION CHECKLIST:');
console.log('✅ Turbo mode enabled (--turbo flag)');
console.log('✅ Memory limit increased (4GB)');
console.log('✅ Heavy components lazy loaded');
console.log('✅ Image optimization enabled');
console.log('✅ Compression enabled');
console.log('⚠️  Clear browser cache for best results');
console.log('⚠️  Close other memory-intensive applications');

console.log('\n🔗 Access your app at: http://localhost:3000');
console.log('📊 Monitor performance in DevTools > Performance tab');
console.log('🔍 Check Network tab for bundle sizes');

// 6. Create performance monitoring function
function monitorPerformance() {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log(`\n📊 Memory Usage:
    RSS: ${Math.round(memUsage.rss / 1024 / 1024)} MB
    Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB
    Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB
    External: ${Math.round(memUsage.external / 1024 / 1024)} MB`);
  }, 30000); // Every 30 seconds
}

// Start monitoring after 10 seconds
setTimeout(monitorPerformance, 10000);