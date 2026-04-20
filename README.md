# pi-hotkey-commands

A [pi](https://pi.dev/) extension that binds slash commands to keyboard shortcuts. Everything is managed through a simple JSON config file.

## Installation

### Via pi package (recommended)

```bash
pi --install git:github.com/sviataslau/pi-hotkey-commands
```

### Manual

Copy `index.ts` to your pi extensions directory:

```bash
# As a directory-based extension
mkdir -p ~/.pi/agent/extensions/hotkey-commands
curl -o ~/.pi/agent/extensions/hotkey-commands/index.ts \
  https://raw.githubusercontent.com/sviataslau/pi-hotkey-commands/main/index.ts
```

Then run `/reload` inside pi.

## Configuration

Create a config file at either location (project-local overrides global):

| Location | Scope |
|----------|-------|
| `~/.pi/agent/hotkey-commands.json` | Global (all projects) |
| `<project>/.pi/hotkey-commands.json` | Project-local |

### Config format

```json
{
  "bindings": [
    {
      "shortcut": "ctrl+shift+r",
      "command": "/plannotator-review",
      "description": "Run plannotator review"
    }
  ]
}
```

Each binding has:

| Field | Required | Description |
|-------|----------|-------------|
| `shortcut` | ✅ | Key combo using pi's [key format](#key-format) |
| `command` | ✅ | Slash command to execute (with optional arguments) |
| `description` | | Human-readable label shown in notifications |

### Key format

Shortcuts use pi's standard key format: `modifier+key`

**Modifiers:** `ctrl`, `shift`, `alt`, `super` (combinable)

> On macOS, `super` = Command (⌘). So `ctrl+super+r` = Ctrl+⌘+R.

**Keys:** `a-z`, `0-9`, `f1-f12`, `escape`, `enter`, `tab`, `space`, `backspace`, `delete`, `home`, `end`, `pageUp`, `pageDown`, `up`, `down`, `left`, `right`, and symbols like `` ` ``, `-`, `=`, `[`, `]`, etc.

**Examples:**
- `ctrl+shift+r` — Ctrl+Shift+R
- `ctrl+super+d` — Ctrl+⌘+D (macOS)
- `alt+f5` — Alt+F5
- `ctrl+shift+alt+p` — Ctrl+Shift+Alt+P

## Behavior

- When pi is **idle**, the shortcut sends the command immediately (same as typing it)
- When pi is **busy** (streaming), the command is queued as a follow-up
- If both global and project configs define the same shortcut, the project binding wins
- A status indicator (`⌨ N hotkeys`) shows in the footer when bindings are active

## Updating

After editing the config file, run `/reload` in pi to pick up changes.

## License

MIT
