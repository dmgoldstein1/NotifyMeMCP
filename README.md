# NotifyMe MCP Server

An MCP (Model Context Protocol) server that sends notifications via [ntfy.sh](https://ntfy.sh) when your LLM finishes generating tokens. Perfect for long-running LLM tasks where you want to be notified when completion happens.

## Features

- Send push notifications to your devices via ntfy
- Customizable notification messages, titles, priorities, and tags
- Simple integration with any MCP-compatible client
- **Requires configuration file** with your ntfy server URL
- Configuration file is git-ignored to keep your server URL private
- Silent on success, alerts LLM only on errors

## Installation

### Option 1: Install from npm (once published)

```bash
npm install -g notifymemcp
```

### Option 2: Install from source

```bash
git clone https://github.com/dmgoldstein1/NotifyMeMCP.git
cd NotifyMeMCP
npm install
npm run build
```

## Configuration

### Setting up your ntfy Server

**REQUIRED:** You must create a `notifyMeMCPconfig.json` file before running the MCP server.

1. Copy the example configuration file:

    ```bash
    cp config.example.json notifyMeMCPconfig.json
    ```

1. Edit `notifyMeMCPconfig.json` with your ntfy server URL:

    ```json
    {
      "ntfyBaseUrl": "https://ntfy.sh",
      "defaultTopic": "llm-notifications"
    }
    ```

1. The `notifyMeMCPconfig.json` file is automatically ignored by Git to keep your server URL private.

**Configuration Options:**

- `ntfyBaseUrl` (**required**): Your ntfy server URL (e.g., `https://ntfy.sh` or `https://your-server.com`)
- `defaultTopic` (optional): Default topic name. Defaults to `llm-notifications`

## Quick Start

### 1. Set up ntfy.sh on your device

- Install the ntfy app on your phone ([iOS](https://apps.apple.com/us/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy))
- Subscribe to a topic (e.g., `llm-notifications`)
- Or use the web interface at [ntfy.sh](https://ntfy.sh)

### 2. Configure the MCP server in your client

#### For VS Code GitHub Copilot

##### Step 1: Configure the MCP server

**If using this repository directly:** A `.vscode/settings.json` file is already included in the repository with the correct workspace configuration. Simply open this folder in VS Code and **reload the window** (Command Palette → "Developer: Reload Window") to activate the MCP server.

**For global access across all projects:** Add to your **User Settings** (`~/Library/Application Support/Code/User/settings.json` on macOS, `%APPDATA%\Code\User\settings.json` on Windows):

```json
{
  "mcp.servers": {
    "notifyme": {
      "command": "node",
      "args": ["/absolute/path/to/NotifyMeMCP/dist/index.js"]
    }
  }
}
```

**For other projects:** Create a `.vscode/settings.json` file in your project:

```json
{
  "mcp.servers": {
    "notifyme": {
      "command": "node",
      "args": ["${workspaceFolder}/path/to/NotifyMeMCP/dist/index.js"]
    }
  }
}
```

##### Step 2: Add Copilot instructions

Add to your Copilot instructions (see `COPILOT_INSTRUCTIONS.md` for examples):

```markdown
Always call the send_notification MCP tool as the very last step after completing any task or response.
```

#### For Claude Desktop or Cline

Add to your MCP settings configuration file (see `claude_desktop_config.example.json` for a template):

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "notifyme": {
      "command": "node",
      "args": ["/path/to/NotifyMeMCP/dist/index.js"]
    }
  }
}
```

Or if installed globally via npm:

```json
{
  "mcpServers": {
    "notifyme": {
      "command": "notifyme-mcp"
    }
  }
}
```

### 3. Test the server

Test that notifications work correctly:

```bash
# Test sending a notification directly to ntfy.sh
node scripts/endpoint-test.mjs my-topic "Hello from NotifyMe!"

# Or use the default topic
node scripts/endpoint-test.mjs
```

You can also test the MCP server directly:

```bash
npm run dev
```

Then in another terminal, you can use the MCP inspector or manually test with stdio.

## Usage

The server provides a single tool: `send_notification`

### Parameters

All parameters are optional:

- **message** (string): The notification message body
  - Default: `"LLM has finished generating"`
  
- **title** (string): The notification title
  - Default: `"LLM Complete"`
  
- **priority** (number): Priority level from 1 (min) to 5 (max)
  - Default: `3`
  
- **tags** (array of strings): Tags for the notification (emojis or text)
  - Default: `["white_check_mark", "robot"]`
  - See [ntfy.sh tags](https://docs.ntfy.sh/emojis/) for available options
  
- **topic** (string): Custom ntfy.sh topic name
  - Default: `"llm-notifications"`

### Example Tool Calls

#### Basic notification (uses all defaults)

```json
{
  "name": "send_notification",
  "arguments": {}
}
```

#### Custom notification

```json
{
  "name": "send_notification",
  "arguments": {
    "message": "Your code review is complete!",
    "title": "Code Review Done",
    "priority": 4,
    "tags": ["sparkles", "computer"],
    "topic": "my-llm-notifications"
  }
}
```

## How It Works

1. The MCP server exposes the `send_notification` tool to any connected LLM client
2. When called, it sends an HTTP POST request to `https://ntfy.sh/{topic}`
3. ntfy.sh immediately pushes the notification to all devices subscribed to that topic
4. You receive a notification on your phone/desktop!

## Privacy & Security

- This server uses the public ntfy.sh service by default
- Notifications are sent over HTTPS
- **Custom server URLs are stored in `notifyMeMCPconfig.json`**, which is git-ignored to protect your privacy
- The `notifyMeMCPconfig.json` file is never committed to the repository
- Consider using unique/random topic names for additional privacy

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run built version
npm start
```

## Troubleshooting

**Server fails to start:**

- Ensure you have created `notifyMeMCPconfig.json` (copy from `config.example.json`)
- Verify `ntfyBaseUrl` is set in your `notifyMeMCPconfig.json`
- Check that the JSON syntax in `notifyMeMCPconfig.json` is valid

**Notifications not arriving?**

- Check the error message from the MCP tool - the server will alert you if there's a problem
- Verify your `ntfyBaseUrl` in `notifyMeMCPconfig.json` is correct and accessible
- Ensure your device is subscribed to the correct topic in the ntfy app
- Verify the topic name matches between the server and your subscription
- Try accessing your ntfy server URL directly in a browser

**MCP server not connecting?**

- Check the path to the server in your MCP configuration
- Look for error messages in the client logs
- Verify Node.js is installed and in your PATH
- Ensure `notifyMeMCPconfig.json` exists in the project root

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [ntfy.sh](https://ntfy.sh) - Simple pub-sub notification service
