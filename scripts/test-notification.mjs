#!/usr/bin/env node

/**
 * Simple script to test sending a notification to ntfy.sh
 * Usage: node scripts/test-notification.mjs [topic] [message]
 */

const topic = process.argv[2] || 'llm-notifications';
const message = process.argv[3] || 'Test notification from NotifyMe MCP';

console.log(`Sending test notification to topic: ${topic}`);
console.log(`Message: ${message}\n`);

try {
  const url = `https://ntfy.sh/${topic}`;
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

  console.log('✅ Notification sent successfully!');
  console.log(`\nTo receive this notification:`);
  console.log(`1. Install the ntfy app on your phone or visit https://ntfy.sh`);
  console.log(`2. Subscribe to the topic: ${topic}`);
  console.log(`3. Run this script again to see the notification\n`);
} catch (error) {
  console.error('❌ Failed to send notification:', error.message);
  console.error('\nTroubleshooting:');
  console.error('- Check your internet connection');
  console.error('- Verify ntfy.sh is accessible from your network');
  console.error('- Try using a different topic name\n');
  process.exit(1);
}
