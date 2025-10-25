# NotifyMe MCP Server

An MCP (Model Context Protocol) server that sends notifications via [ntfy.sh](https://ntfy.sh) when your LLM finishes generating tokens. Perfect for long-running LLM tasks where you want to be notified when completion happens.

## Features

- Send push notifications to your devices via ntfy.sh
- Customizable notification messages, titles, priorities, and tags
- Simple integration with any MCP-compatible client
- Uses the free ntfy.sh service (or your own ntfy server)

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

## Quick Start

### 1. Set up ntfy.sh on your device

- Install the ntfy app on your phone ([iOS](https://apps.apple.com/us/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy))
- Subscribe to a topic (e.g., `llm-notifications`)
- Or use the web interface at [ntfy.sh](https://ntfy.sh)

### 2. Configure the MCP server in your client

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

#### For VS Code GitHub Copilot

Add to your Copilot instructions (see `COPILOT_INSTRUCTIONS.md` for examples):

```markdown
Always call the send_notification MCP tool as the very last step after completing any task or response.
```

### 3. Test the server

Test that notifications work correctly:

```bash
# Test sending a notification directly to ntfy.sh
node scripts/test-notification.mjs my-topic "Hello from NotifyMe!"

# Or use the default topic
node scripts/test-notification.mjs
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
- No data is logged or stored by this server
- You can use your own self-hosted ntfy server by changing the topic URL in the code
- Consider using unique/random topic names for privacy

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

**Notifications not arriving?**

- Verify your device is subscribed to the correct topic in the ntfy app
- Check that the topic name matches between the server and your subscription
- Ensure you have internet connectivity
- Try using the ntfy.sh web interface to verify the service is working

**MCP server not connecting?**

- Check the path to the server in your MCP configuration
- Look for error messages in the client logs
- Verify Node.js is installed and in your PATH

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [ntfy.sh](https://ntfy.sh) - Simple pub-sub notification service
