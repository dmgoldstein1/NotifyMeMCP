#!/usr/bin/env node

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the MCP server
const serverPath = join(__dirname, '../dist/index.js');
const server = spawn('node', [serverPath]);

let buffer = '';
let messageId = 1;

// Handle server output
server.stdout.on('data', (data) => {
  buffer += data.toString();
  
  // Try to parse complete JSON-RPC messages
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('Received:', JSON.stringify(response, null, 2));
      } catch (e) {
        // Not a complete JSON message yet
      }
    }
  });
});

server.stderr.on('data', (data) => {
  console.error('Server stderr:', data.toString());
});

// Send a JSON-RPC request
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: messageId++,
    method,
    params
  };
  console.log('\nSending:', JSON.stringify(request, null, 2));
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Wait a bit for server to start, then send test requests
setTimeout(() => {
  console.log('=== Testing MCP Server ===\n');
  
  // 1. Initialize
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {
      roots: {
        listChanged: true
      }
    },
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  });
  
  setTimeout(() => {
    // 2. List tools
    sendRequest('tools/list');
    
    setTimeout(() => {
      // 3. Call the notification tool
      sendRequest('tools/call', {
        name: 'send_notification',
        arguments: {
          message: 'Test notification from MCP server',
          title: 'Test Complete',
          priority: 3,
          tags: ['white_check_mark', 'test'],
          topic: 'mcp-test-' + Date.now()
        }
      });
      
      // Give it time to complete
      setTimeout(() => {
        console.log('\n=== Test Complete ===');
        server.kill();
        process.exit(0);
      }, 3000);
    }, 1000);
  }, 1000);
}, 500);

// Handle timeout
setTimeout(() => {
  console.error('Test timeout');
  server.kill();
  process.exit(1);
}, 10000);
