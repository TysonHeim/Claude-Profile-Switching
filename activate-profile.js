#!/usr/bin/env node

/**
 * Claude Profile Activator
 * Manages Claude Code profiles — skills, agents, commands, and MCP server configs
 *
 * Usage:
 *   node activate-profile.js [profile1] [profile2] ...
 *   node activate-profile.js --list
 *   node activate-profile.js --show
 *
 * Examples:
 *   node activate-profile.js example
 *   node activate-profile.js example minimal
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

// Resolve paths relative to this script's location
const repoDir = __dirname;
const profilesDir = path.join(repoDir, 'profiles');
const mcpConfigsDir = path.join(repoDir, 'mcp-configs');

// Claude Code directories (target)
const claudeDir = path.join(require('os').homedir(), '.claude');
const targetDirs = {
  skills: path.join(claudeDir, 'skills'),
  agents: path.join(claudeDir, 'agents'),
  commands: path.join(claudeDir, 'commands'),
};

// Resource types that use symlinks
const SYMLINK_TYPES = ['skills', 'agents', 'commands'];

// Agents that are always activated regardless of profile selection
const ALWAYS_ON_AGENTS = ['skills-manager.md'];

function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get all available profile names
 */
function getAvailableProfiles() {
  if (!fs.existsSync(profilesDir)) return [];
  return fs.readdirSync(profilesDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => e.name);
}

/**
 * Get entries in a profile subdirectory (skills/, agents/, or commands/)
 */
function getProfileEntries(profileName, type) {
  const dir = path.join(profilesDir, profileName, type);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !e.name.startsWith('.'))
    .map(e => e.name);
}

/**
 * Get MCP server names for a profile
 */
function getProfileMcpServers(profileName) {
  const mcpFile = path.join(profilesDir, profileName, 'mcp-servers.json');
  if (!fs.existsSync(mcpFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(mcpFile, 'utf-8'));
  } catch {
    print(`  Warning: Invalid mcp-servers.json in profile '${profileName}'`, 'yellow');
    return [];
  }
}

/**
 * Clear all symlinks from a target directory (preserving non-symlink files)
 */
function clearSymlinks(dir) {
  ensureDir(dir);
  for (const entry of fs.readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    if (fs.lstatSync(full).isSymbolicLink()) {
      fs.unlinkSync(full);
    }
  }
}

/**
 * Create a symlink, with copy fallback for Windows
 */
function createSymlink(target, linkPath) {
  try {
    if (fs.existsSync(linkPath) || fs.lstatSync(linkPath).isSymbolicLink()) {
      fs.unlinkSync(linkPath);
    }
  } catch { /* doesn't exist, fine */ }

  const relativePath = path.relative(path.dirname(linkPath), target);
  try {
    fs.symlinkSync(relativePath, linkPath, 'junction');
    return true;
  } catch {
    // Fallback: copy
    try {
      const stat = fs.statSync(target);
      if (stat.isDirectory()) {
        fs.cpSync(target, linkPath, { recursive: true });
      } else {
        fs.copyFileSync(target, linkPath);
      }
      return true;
    } catch (err) {
      print(`  Failed to link ${path.basename(linkPath)}: ${err.message}`, 'yellow');
      return false;
    }
  }
}

/**
 * Activate symlink-based resources (skills, agents, commands) for a profile
 */
function activateSymlinks(profileName, type) {
  const entries = getProfileEntries(profileName, type);
  let count = 0;
  for (const entry of entries) {
    const source = path.join(profilesDir, profileName, type, entry);
    // Resolve symlink to get the real source path
    const realSource = fs.realpathSync(source);
    const target = path.join(targetDirs[type], entry);
    if (createSymlink(realSource, target)) {
      print(`  + ${type}/${entry}`, 'reset');
      count++;
    }
  }
  return count;
}

/**
 * Load an MCP config fragment by server name
 */
function loadMcpFragment(serverName) {
  const fragPath = path.join(mcpConfigsDir, `${serverName}.json`);
  if (!fs.existsSync(fragPath)) {
    print(`  Warning: MCP config '${serverName}.json' not found`, 'yellow');
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(fragPath, 'utf-8'));
  } catch (err) {
    print(`  Warning: Invalid JSON in '${serverName}.json': ${err.message}`, 'yellow');
    return null;
  }
}

/**
 * Merge MCP configs from all requested profiles and write .mcp.json
 */
function activateMcp(profileNames) {
  const allServers = new Set();
  for (const profile of profileNames) {
    for (const server of getProfileMcpServers(profile)) {
      allServers.add(server);
    }
  }

  if (allServers.size === 0) return 0;

  const merged = { mcpServers: {} };
  let count = 0;

  for (const serverName of allServers) {
    const fragment = loadMcpFragment(serverName);
    if (fragment) {
      Object.assign(merged.mcpServers, fragment);
      print(`  + mcp/${serverName}`, 'reset');
      count++;
    }
  }

  if (count > 0) {
    const outputPath = path.join(process.cwd(), '.mcp.json');
    fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2) + '\n');
    print(`  Wrote ${outputPath}`, 'dim');
  }

  return count;
}

/**
 * Get current activation state by reading symlinks from target dirs
 */
function getCurrentState() {
  const state = {};
  for (const type of SYMLINK_TYPES) {
    const dir = targetDirs[type];
    state[type] = [];
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (entry.startsWith('.')) continue;
      const full = path.join(dir, entry);
      if (fs.lstatSync(full).isSymbolicLink()) {
        state[type].push(entry);
      }
    }
  }
  return state;
}

/**
 * Ensure always-on agents are symlinked, even if no profile included them.
 */
function ensureAlwaysOnAgents() {
  let added = 0;
  for (const name of ALWAYS_ON_AGENTS) {
    const target = path.join(targetDirs.agents, name);
    if (fs.existsSync(target)) continue;
    const source = path.join(repoDir, 'agents-repo', name);
    if (createSymlink(source, target)) {
      print(`  + agents/${name} (always-on)`, 'dim');
      added++;
    }
  }
  return added;
}

// ── CLI Commands ──────────────────────────────────────────

function cmdList() {
  print('\n=== Available Profiles ===\n', 'blue');

  const profiles = getAvailableProfiles();
  if (profiles.length === 0) {
    print('No profiles found in profiles/', 'yellow');
    return;
  }

  print('Profile              Skills  Agents  Commands  MCP Servers', 'reset');
  print('─'.repeat(65), 'reset');

  for (const profile of profiles) {
    const skills = getProfileEntries(profile, 'skills').length;
    const agents = getProfileEntries(profile, 'agents').length;
    const commands = getProfileEntries(profile, 'commands').length;
    const mcp = getProfileMcpServers(profile).length;

    const row = [
      profile.padEnd(20),
      String(skills).padEnd(8),
      String(agents).padEnd(8),
      String(commands).padEnd(10),
      String(mcp),
    ].join('');

    print(row, 'reset');
  }

  print(`\nTotal profiles: ${profiles.length}`, 'dim');
  print('');
}

function cmdShow() {
  print('\n=== Current Activation ===\n', 'blue');

  const state = getCurrentState();
  let total = 0;

  for (const type of SYMLINK_TYPES) {
    const items = state[type];
    if (items.length === 0) continue;
    print(`${type} (${items.length}):`, 'green');
    for (const item of items) {
      print(`  ${item}`, 'reset');
    }
    total += items.length;
    print('');
  }

  if (total === 0) {
    print('No resources currently activated', 'yellow');
    print('');
    print('To activate: node activate-profile.js <profile1> [profile2] ...', 'reset');
  } else {
    print(`Total active resources: ${total}`, 'blue');
  }
  print('');
}

function cmdActivate(profileNames) {
  print('\n=== Claude Profile Activator ===\n', 'blue');

  // Validate all profiles exist
  for (const name of profileNames) {
    if (!fs.existsSync(path.join(profilesDir, name))) {
      print(`Profile '${name}' not found`, 'red');
      print(`Available: ${getAvailableProfiles().join(', ')}`, 'dim');
      process.exit(1);
    }
  }

  // Clear all symlink targets
  for (const type of SYMLINK_TYPES) {
    print(`Clearing ${type}...`, 'dim');
    clearSymlinks(targetDirs[type]);
  }
  print('');

  // Activate each profile
  const counts = { skills: 0, agents: 0, commands: 0, mcp: 0 };

  for (const name of profileNames) {
    print(`Profile: ${name}`, 'green');
    for (const type of SYMLINK_TYPES) {
      counts[type] += activateSymlinks(name, type);
    }
  }

  // MCP merging (across all profiles)
  counts.mcp = activateMcp(profileNames);

  // Ensure always-on agents are present
  counts.agents += ensureAlwaysOnAgents();

  print('');

  // Summary
  const parts = [];
  if (counts.skills) parts.push(`${counts.skills} skills`);
  if (counts.agents) parts.push(`${counts.agents} agents`);
  if (counts.commands) parts.push(`${counts.commands} commands`);
  if (counts.mcp) parts.push(`${counts.mcp} MCP servers`);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  print(`Activated ${total} resources (${parts.join(', ')}) from ${profileNames.length} profile(s)`, 'green');
  print(`Profiles: ${profileNames.join(', ')}`, 'dim');
  print('');
}

function cmdUsage() {
  print('\n=== Claude Profile Activator ===', 'blue');
  print('');
  print('Manages Claude Code skills, agents, commands, and MCP configs via profiles.', 'reset');
  print('');
  print('Usage:', 'reset');
  print('  node activate-profile.js <profile1> [profile2] ...', 'reset');
  print('  node activate-profile.js --list    List all profiles', 'reset');
  print('  node activate-profile.js --show    Show current activation', 'reset');
  print('');

  const profiles = getAvailableProfiles();
  if (profiles.length > 0) {
    print('Available profiles:', 'yellow');
    for (const p of profiles) {
      const s = getProfileEntries(p, 'skills').length;
      const a = getProfileEntries(p, 'agents').length;
      const c = getProfileEntries(p, 'commands').length;
      print(`  ${p} (${s} skills, ${a} agents, ${c} commands)`, 'reset');
    }
    print('');
  }
}

// ── Main ──────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list') || args.includes('-l')) {
    cmdList();
  } else if (args.includes('--show') || args.includes('-s')) {
    cmdShow();
  } else if (args.length === 0) {
    cmdUsage();
  } else {
    cmdActivate(args);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getAvailableProfiles, getCurrentState };
