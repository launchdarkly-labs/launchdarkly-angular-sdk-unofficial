#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Generate release notes from git commits between tags
 */
export function generateReleaseNotes() {
  try {
    // Get the current version from package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const currentVersion = packageJson.version;
    
    // Get the previous tag
    let previousTag;
    try {
      previousTag = execSync('git describe --tags --abbrev=0 HEAD^', { encoding: 'utf8' }).trim();
    } catch (error) {
      // If no previous tag exists, get all commits
      previousTag = '';
    }
    
    // Get commits since the previous tag
    const commitRange = previousTag ? `${previousTag}..HEAD` : 'HEAD';
    const commits = execSync(`git log --pretty=format:"%s" ${commitRange}`, { encoding: 'utf8' })
      .split('\n')
      .filter(commit => commit.trim() && !commit.includes('chore: prepare release'));
    
    // Categorize commits
    const features = [];
    const fixes = [];
    const docs = [];
    const other = [];
    
    commits.forEach(commit => {
      const lowerCommit = commit.toLowerCase();
      if (lowerCommit.includes('feat:') || lowerCommit.includes('feature:')) {
        features.push(commit);
      } else if (lowerCommit.includes('fix:') || lowerCommit.includes('bug:')) {
        fixes.push(commit);
      } else if (lowerCommit.includes('doc:') || lowerCommit.includes('docs:')) {
        docs.push(commit);
      } else {
        other.push(commit);
      }
    });
    
    // Generate release notes
    let releaseNotes = `## Changes in v${currentVersion}\n\n`;
    
    if (features.length > 0) {
      releaseNotes += `### ✨ Features\n`;
      features.forEach(feature => {
        releaseNotes += `- ${feature}\n`;
      });
      releaseNotes += '\n';
    }
    
    if (fixes.length > 0) {
      releaseNotes += `### 🐛 Bug Fixes\n`;
      fixes.forEach(fix => {
        releaseNotes += `- ${fix}\n`;
      });
      releaseNotes += '\n';
    }
    
    if (docs.length > 0) {
      releaseNotes += `### 📚 Documentation\n`;
      docs.forEach(doc => {
        releaseNotes += `- ${doc}\n`;
      });
      releaseNotes += '\n';
    }
    
    if (other.length > 0) {
      releaseNotes += `### 🔧 Other Changes\n`;
      other.forEach(change => {
        releaseNotes += `- ${change}\n`;
      });
      releaseNotes += '\n';
    }
    
    // Add installation instructions
    releaseNotes += `### 📦 Installation\n\n`;
    releaseNotes += `\`\`\`bash\n`;
    releaseNotes += `npm install @launchtarqly/launchdarkly-angular@${currentVersion}\n`;
    releaseNotes += `\`\`\`\n\n`;
    
    // Add changelog link
    const repoUrl = packageJson.repository?.url?.replace('.git', '') || 'https://github.com/launchdarkly-labs/launchdarkly-angular';
    releaseNotes += `**Full Changelog**: ${repoUrl}/compare/${previousTag || 'initial'}...v${currentVersion}\n`;
    
    // Write to file
    const releaseNotesPath = path.join(process.cwd(), 'RELEASE_NOTES.md');
    fs.writeFileSync(releaseNotesPath, releaseNotes);
    
    console.log(`✅ Release notes generated: ${releaseNotesPath}`);
    console.log('\n📝 Release Notes Preview:');
    console.log('─'.repeat(50));
    console.log(releaseNotes);
    
  } catch (error) {
    console.error('❌ Error generating release notes:', error.message);
    process.exit(1);
  }
}

if (import.meta.main) {
  generateReleaseNotes();
}
