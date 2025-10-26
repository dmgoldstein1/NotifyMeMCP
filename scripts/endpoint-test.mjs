#!/usr/bin/env node

/**
 * Simple script to test sending a notification using notifyMeMCPconfig.json
 * Usage: node scripts/endpoint-test.mjs [topic] [message]
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load configuration from notifyMeMCPconfig.json
let config;
try {
  const configPath = join(__dirname, '../notifyMeMCPconfig.json');
  const configData = readFileSync(configPath, 'utf-8');
  config = JSON.parse(configData);
  
  if (!config.ntfyBaseUrl) {
    throw new Error('ntfyBaseUrl is required in notifyMeMCPconfig.json');
  }
} catch (error) {
  console.error('ERROR: Failed to load notifyMeMCPconfig.json');
  console.error(error.message);
  console.error('\nPlease create notifyMeMCPconfig.json from config.example.json:');
  console.error('  cp config.example.json notifyMeMCPconfig.json\n');
  process.exit(1);
}

const topic = process.argv[2] || config.defaultTopic || 'llm-notifications';
const message = process.argv[3] || 'Test notification from NotifyMe MCP';

console.log(`Using ntfy server: ${config.ntfyBaseUrl}`);
console.log(`Sending test notification to topic: ${topic}`);
console.log(`Message: ${message}\n`);

try {
  const url = `${config.ntfyBaseUrl}/${topic}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Title': 'NotifyMe MCP Test',
      'Priority': '3',
      'Tags': 'white_check_mark,test',
    },
    body: message,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  console.log('SUCCESS: Notification sent successfully!');
  console.log(`\nTo receive this notification:`);
  console.log(`1. Install the ntfy app on your phone or visit ${config.ntfyBaseUrl}`);
  console.log(`2. Subscribe to the topic: ${topic}`);
  console.log(`3. Run this script again to see the notification\n`);
} catch (error) {
  console.error('ERROR: Failed to send notification:', error.message);
  console.error('\nTroubleshooting:');
  console.error('- Check your internet connection');
  console.error(`- Verify ${config.ntfyBaseUrl} is accessible from your network`);
  console.error('- Verify the ntfyBaseUrl in notifyMeMCPconfig.json is correct');
  console.error('- Try using a different topic name\n');
  process.exit(1);
}
