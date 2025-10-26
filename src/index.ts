#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Configuration interface
 */
interface Config {
  ntfyBaseUrl: string;
  defaultTopic?: string;
}

/**
 * Load configuration from notifyMeMCPconfig.json file
 * Throws error if file doesn't exist or ntfyBaseUrl is not configured
 */
function loadConfig(): Config {
  try {
  const configPath = join(__dirname, "../notifyMeMCPconfig.json");
    const configData = readFileSync(configPath, "utf-8");
    const config = JSON.parse(configData);
    
    if (!config.ntfyBaseUrl) {
  throw new Error("ntfyBaseUrl is required in notifyMeMCPconfig.json");
    }
    
    return config;
  } catch (error) {
    if (error instanceof Error) {
    throw new Error(`Failed to load notifyMeMCPconfig.json: ${error.message}`);
    }
    throw error;
  }
}

// Load configuration
const config = loadConfig();

/**
 * Base URL for the ntfy server
 * REQUIRED: Must be configured in notifyMeMCPconfig.json
 * This should be kept secret
 */
const NTFY_BASE_URL = config.ntfyBaseUrl;

/**
 * Default ntfy topic name
 * Loaded from notifyMeMCPconfig.json or defaults to llm-notifications
 */
const DEFAULT_TOPIC = config.defaultTopic || "llm-notifications";

// Interface for notification parameters
interface NotificationParams {
  message?: string;
  title?: string;
  priority?: number;
  tags?: string[];
  topic?: string;
}

// Create server instance
const server = new Server(
  {
    name: "notifyme-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the notification tool
const notifyTool: Tool = {
  name: "send_notification",
  description: "Send a notification via ntfy.sh when the LLM has finished generating tokens. This should be called as the last step in any conversation or task.",
  inputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "The notification message body (defaults to 'LLM has finished generating')",
      },
      title: {
        type: "string",
        description: "The notification title (defaults to 'LLM Complete')",
      },
      priority: {
        type: "number",
        description: "Priority level (1=min, 3=default, 5=max)",
        minimum: 1,
        maximum: 5,
      },
      tags: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of tags for the notification (e.g., ['checkmark', 'robot'])",
      },
      topic: {
        type: "string",
        description: `Custom ntfy.sh topic (defaults to '${DEFAULT_TOPIC}')`,
      },
    },
  },
};

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [notifyTool],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "send_notification") {
    const params = (request.params.arguments || {}) as NotificationParams;
    
    // Set defaults
    const topic = params.topic || DEFAULT_TOPIC;
    const title = params.title || "LLM Complete";
    const message = params.message || "LLM has finished generating";
    const priority = params.priority || 3;
    const tags = params.tags || ["white_check_mark", "robot"];
    
    // Construct URL for error reporting
    const url = `${NTFY_BASE_URL}/${topic}`;

    try {
      // Send notification to ntfy server
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Title": title,
          "Priority": priority.toString(),
          "Tags": tags.join(","),
        },
        body: message,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      // Silent success - only return success without verbose details
      return {
        content: [
          {
            type: "text",
            text: "",
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `ERROR: Failed to send notification to ${url}\n${errorMessage}\n\nPlease check:\n- Your notifyMeMCPconfig.json has the correct ntfyBaseUrl\n- The ntfy server is accessible\n- The topic name is valid`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log to stderr so it doesn't interfere with MCP protocol on stdout
  console.error("NotifyMe MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
