#!/usr/bin/env node

/**
 * Test script to validate release setup
 */
import fs from 'fs';
import path from 'path';

export function testReleaseSetup() {
  console.log('🧪 Testing release setup...\n');
  
  const errors = [];
  const warnings = [];
  
  // Check package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check required fields
    const requiredFields = ['name', 'version', 'main', 'module', 'types', 'files'];
    requiredFields.forEach(field => {
      if (!packageJson[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Check scripts
    const requiredScripts = ['prepublishOnly', 'version:patch', 'version:minor', 'version:major'];
    requiredScripts.forEach(script => {
      if (!packageJson.scripts[script]) {
        errors.push(`Missing required script: ${script}`);
      }
    });
    
    // Check files field
    if (packageJson.files && !packageJson.files.includes('dist/launchdarkly-angular')) {
      warnings.push('files field should include dist/launchdarkly-angular');
    }
    
    console.log(`✅ Package name: ${packageJson.name}`);
    console.log(`✅ Version: ${packageJson.version}`);
    console.log(`✅ Main entry: ${packageJson.main}`);
    console.log(`✅ Module entry: ${packageJson.module}`);
    console.log(`✅ Types: ${packageJson.types}`);
    
  } catch (error) {
    errors.push(`Error reading package.json: ${error.message}`);
  }
  
  // Check .npmignore
  if (fs.existsSync('.npmignore')) {
    console.log('✅ .npmignore file exists');
  } else {
    warnings.push('.npmignore file not found');
  }
  
  // Check GitHub workflow
  if (fs.existsSync('.github/workflows/publish.yml')) {
    console.log('✅ GitHub Actions publish workflow exists');
  } else {
    errors.push('GitHub Actions publish workflow not found');
  }
  
  // Check release notes script
  if (fs.existsSync('scripts/generate-release-notes.js')) {
    console.log('✅ Release notes script exists');
  } else {
    errors.push('Release notes script not found');
  }
  
  // Check dist directory (should exist after build)
  if (fs.existsSync('dist/launchdarkly-angular')) {
    console.log('✅ Build output directory exists');
  } else {
    warnings.push('Build output directory not found - run npm run build:prod first');
  }
  
  // Summary
  console.log('\n📊 Test Results:');
  console.log('─'.repeat(40));
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('🎉 All tests passed! Release setup is ready.');
  } else {
    if (errors.length > 0) {
      console.log('❌ Errors:');
      errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  Warnings:');
      warnings.forEach(warning => console.log(`   - ${warning}`));
    }
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Set NPM_TOKEN as a GitHub secret');
  console.log('2. Run: npm run build:prod');
  console.log('3. Test release: npm run release:patch');
  
  return errors.length === 0;
}

if (import.meta.main) {
  const success = testReleaseSetup();
  process.exit(success ? 0 : 1);
}
