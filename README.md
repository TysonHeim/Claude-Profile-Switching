# Claude Profile Switching

Switch between curated sets of Claude Code **skills**, **agents**, **commands**, and **MCP server configs** with a single command.

## Why?

Claude Code loads metadata for every skill/agent/command at startup. As your collection grows, you pay a context-window tax even for resources you don't need. Profiles let you activate only what's relevant — frontend work, testing, data ops, etc.

## How It Works

```
Claude-Profile-Switching/
├── skills-repo/         # Actual skill directories (source of truth)
├── agents-repo/         # Agent .md files (source of truth)
├── commands-repo/       # Command .md files (source of truth)
├── mcp-configs/         # MCP server JSON fragments (source of truth)
├── profiles/            # Named profiles — curated subsets
│   ├── frontend/
│   │   ├── skills/      # symlinks → ../../skills-repo/*
│   │   ├── agents/      # symlinks → ../../agents-repo/*
│   │   ├── commands/    # symlinks → ../../commands-repo/*
│   │   └── mcp-servers.json  # ["server-name", ...]
│   ├── backend/
│   └── debugging/
├── activate-profile.js  # Core activation script
└── install.sh           # One-time setup
```

**Skills, agents, and commands** use symlinks — each profile directory contains symlinks pointing back to the repo's source-of-truth directories.

**MCP configs** use JSON fragment merging — each server has its own `.json` file in `mcp-configs/`, and profiles reference server names in `mcp-servers.json`. On activation, selected fragments are merged into a single `.mcp.json`.

## Quick Start

```bash
# 1. Clone this repo
git clone https://github.com/YOUR_USER/Claude-Profile-Switching.git
cd Claude-Profile-Switching

# 2. Run the installer (creates ~/.claude directories, copies activator)
./install.sh

# 3. Activate a profile
node activate-profile.js frontend
```

## Usage

```bash
# Activate one or more profiles (they merge)
node activate-profile.js frontend
node activate-profile.js frontend debugging

# List all available profiles
node activate-profile.js --list

# Show what's currently activated
node activate-profile.js --show
```

You can also run it from `~/.claude/` after install:

```bash
node ~/.claude/activate-profile.js frontend
```

## Always-On Agents

The `skills-manager` agent is always activated regardless of which profile you select. This ensures you can always manage skills and profiles from within Claude Code. The `ALWAYS_ON_AGENTS` array in `activate-profile.js` controls which agents are always present.

## Adding Your Own Content

### Add a Skill

1. Create a directory in `skills-repo/` with a `SKILL.md`:

```
skills-repo/my-skill/
└── SKILL.md
```

2. Symlink it into the profile(s) where it belongs:

```bash
cd profiles/frontend/skills
ln -s ../../../skills-repo/my-skill .
```

### Add an Agent

1. Create an `.md` file in `agents-repo/`:

```
agents-repo/my-agent.md
```

2. Symlink into profile(s):

```bash
cd profiles/frontend/agents
ln -s ../../../agents-repo/my-agent.md .
```

### Add a Command

Same pattern — create in `commands-repo/`, symlink into profiles.

### Add an MCP Server

1. Create a JSON fragment in `mcp-configs/`:

```json
// mcp-configs/my-server.json
{
  "my-server": {
    "type": "http",
    "url": "https://mcp.example.com/mcp"
  }
}
```

2. Add the server name to `mcp-servers.json` in the desired profile:

```json
["my-server"]
```

### Create a New Profile

```bash
mkdir -p profiles/my-profile/{skills,agents,commands}
# Add symlinks and optionally mcp-servers.json
```

## Profiles Merge

When you activate multiple profiles, resources are combined. If both profiles include the same skill, the last one wins (symlink is overwritten). MCP servers from all profiles are merged into a single `.mcp.json`.

## Included Profiles

| Profile | Skills | Agents | Commands | MCP Servers |
|---------|--------|--------|----------|-------------|
| `frontend` | component-patterns | skills-manager | lint, workflow | playwright, context7 |
| `backend` | api-patterns, testing-guide | skills-manager | test, workflow | context7 |
| `debugging` | debug-guide, testing-guide | skills-manager, code-reviewer | test | playwright, memory |

## File Reference

| File | Purpose |
|------|---------|
| `activate-profile.js` | Core script — clears targets, creates symlinks, merges MCP |
| `install.sh` | Creates `~/.claude/{skills,agents,commands}`, copies activator |
| `skills-repo/` | Source of truth for skill directories |
| `agents-repo/` | Source of truth for agent `.md` files |
| `commands-repo/` | Source of truth for command `.md` files |
| `mcp-configs/` | Source of truth for MCP server JSON fragments |
| `profiles/` | Named profile definitions |
