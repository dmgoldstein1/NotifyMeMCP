# Example Copilot Instructions

Add this to your `.github/copilot-instructions.md` or workspace settings to automatically trigger notifications:

```markdown
## Notification Protocol

Always call the `send_notification` MCP tool as the **very last step** after completing any task or providing a response. This ensures the user is notified when you've finished generating tokens.

Example usage:
- After completing a code implementation
- After answering a complex question
- After finishing a multi-step task
- After any long-running generation

Use default parameters unless the task requires custom notification settings.
```

## Custom Notification Examples

### For successful code completion

```json
{
  "name": "send_notification",
  "arguments": {
    "title": "Code Complete",
    "message": "Your code implementation is ready!",
    "tags": ["computer", "white_check_mark"],
    "priority": 4
  }
}
```

### For important alerts

```json
{
  "name": "send_notification",
  "arguments": {
    "title": "Urgent: Review Needed",
    "message": "Critical issue detected - please review immediately",
    "tags": ["warning", "rotating_light"],
    "priority": 5
  }
}
```

### For routine completions

```json
{
  "name": "send_notification",
  "arguments": {
    "title": "Task Complete",
    "message": "Your request has been processed",
    "priority": 3
  }
}
```
