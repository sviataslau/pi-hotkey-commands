/**
 * Hotkey Commands Extension
 *
 * Binds pi slash commands to keyboard shortcuts via a JSON config file.
 * Shortcuts are defined using pi's standard key format (see keybindings.md).
 *
 * Config files (merged, project takes precedence):
 * - ~/.pi/agent/hotkey-commands.json  (global)
 * - <cwd>/.pi/hotkey-commands.json    (project-local)
 *
 * Example hotkey-commands.json:
 * ```json
 * {
 *   "bindings": [
 *     {
 *       "shortcut": "ctrl+shift+r",
 *       "command": "/plannotator-review",
 *       "description": "Run plannotator review"
 *     },
 *     {
 *       "shortcut": "ctrl+shift+d",
 *       "command": "/deploy staging",
 *       "description": "Deploy to staging"
 *     }
 *   ]
 * }
 * ```
 *
 * Each binding has:
 *   - shortcut:    Key combo using pi's key format (e.g. "ctrl+super+r", "ctrl+shift+f1")
 *   - command:     Slash command to execute, with optional arguments (e.g. "/review", "/deploy prod")
 *   - description: (optional) Human-readable label shown in status/notifications
 *
 * On macOS, "super" = Command key. So "ctrl+super+r" = Ctrl+Cmd+R.
 *
 * After editing the config, run /reload to pick up changes.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

interface HotkeyBinding {
	shortcut: string;
	command: string;
	description?: string;
}

interface HotkeyCommandsConfig {
	bindings: HotkeyBinding[];
}

function loadConfigFile(path: string): HotkeyBinding[] {
	if (!existsSync(path)) return [];
	try {
		const content = readFileSync(path, "utf-8");
		const parsed = JSON.parse(content);
		return Array.isArray(parsed.bindings) ? parsed.bindings : [];
	} catch (err) {
		console.error(`[hotkey-commands] Failed to load config from ${path}: ${err}`);
		return [];
	}
}

function loadConfig(cwd: string): HotkeyCommandsConfig {
	const agentDir = join(homedir(), ".pi", "agent");
	const globalPath = join(agentDir, "hotkey-commands.json");
	const projectPath = join(cwd, ".pi", "hotkey-commands.json");

	const globalBindings = loadConfigFile(globalPath);
	const projectBindings = loadConfigFile(projectPath);

	// Merge: project bindings override global bindings with the same shortcut
	const merged = new Map<string, HotkeyBinding>();
	for (const b of globalBindings) merged.set(b.shortcut, b);
	for (const b of projectBindings) merged.set(b.shortcut, b);

	return { bindings: Array.from(merged.values()) };
}

export default function hotkeyCommandsExtension(pi: ExtensionAPI) {
	const config = loadConfig(process.cwd());

	for (const binding of config.bindings) {
		const cmd = binding.command.startsWith("/") ? binding.command : `/${binding.command}`;
		const label = binding.description || `Run ${cmd}`;

		pi.registerShortcut(binding.shortcut as any, {
			description: label,
			handler: async (ctx) => {
				// Flash the status bar to show which hotkey fired
				ctx.ui.setStatus(
					"hotkey-commands",
					ctx.ui.theme.fg("accent", `⌨ ${cmd}`),
				);
				// Set the command text in the editor, then simulate Enter.
				// This routes through the normal interactive input pipeline which
				// includes extension command dispatch — unlike sendUserMessage()
				// which bypasses command routing (expandPromptTemplates: false).
				ctx.ui.setEditorText(cmd);
				process.stdin.emit("data", "\r");
				// Revert status bar after 3 seconds
				setTimeout(() => {
					const count = config.bindings.length;
					ctx.ui.setStatus(
						"hotkey-commands",
						ctx.ui.theme.fg("dim", `⌨ ${count} hotkey${count !== 1 ? "s" : ""}`),
					);
				}, 3000);
			},
		});
	}

	pi.on("session_start", async (_event, ctx) => {
		const count = config.bindings.length;
		if (count > 0) {
			ctx.ui.setStatus(
				"hotkey-commands",
				ctx.ui.theme.fg("dim", `⌨ ${count} hotkey${count !== 1 ? "s" : ""}`),
			);
		}
	});
}
