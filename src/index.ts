#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Default ntfy.sh topic
const DEFAULT_TOPIC = "llm-notifications";

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

    try {
      // Send notification to ntfy.sh
      const url = `https://ntfy.sh/${topic}`;
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return {
        content: [
          {
            type: "text",
            text: `Notification sent successfully to ${topic}!\nTitle: ${title}\nMessage: ${message}\nPriority: ${priority}\nTags: ${tags.join(", ")}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Failed to send notification: ${errorMessage}`,
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
