#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get version from command line argument
const version = process.argv[2];
if (!version) {
    console.error('Please provide version as argument');
    process.exit(1);
}

// Read CHANGELOG.md
const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
const content = fs.readFileSync(changelogPath, 'utf8');

// Split content into sections by h2 headers
const sections = content.split(/\n## /);

// Find the section for the specified version
const versionSection = sections.find(section => section.trim().startsWith(version));

if (!versionSection) {
    console.error(`No changelog found for version ${version}`);
    process.exit(1);
}

// Extract and format the changelog entries
const lines = versionSection
    .split('\n')
    .slice(1) // Remove the version line itself
    .filter(line => line.trim().startsWith('- ')) // Only keep bullet points
    .join('\n')
    .trim();

if (!lines) {
    console.error('No bullet points found in changelog section');
    process.exit(1);
}

console.log(lines);
