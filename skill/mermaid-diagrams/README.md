# Mermaid Diagrams Skill

Agent skill for creating and rendering Mermaid diagrams via the `mmdc` CLI.

## Requirements

### System Dependencies

| Dependency | Purpose | Install |
|------------|---------|---------|
| Node.js 18+ | Runtime for mermaid-cli | `mise use node@lts` or system package |
| Chromium/Chrome | Puppeteer rendering backend | Usually bundled with mermaid-cli |

### Installation

#### Arch Linux (recommended)

Native package in `extra` repo - no manual Node.js setup needed:

```bash
sudo pacman -S mermaid-cli
```

#### Other Linux / macOS

```bash
npm install -g @mermaid-js/mermaid-cli
# or
pnpm add -g @mermaid-js/mermaid-cli
```

**Package**: `@mermaid-js/mermaid-cli`  
**Binary**: `mmdc`  
**Tested version**: 11.12.0  
**License**: MIT

### Verify Installation

```bash
mmdc --version
# Expected: 11.12.0 or higher
```

## Supported Diagram Types

| Type | Declaration | Status |
|------|-------------|--------|
| Flowchart | `flowchart TD` | Stable |
| Sequence | `sequenceDiagram` | Stable |
| Class | `classDiagram` | Stable |
| State | `stateDiagram-v2` | Stable |
| ER | `erDiagram` | Stable |
| Gantt | `gantt` | Stable |
| Git Graph | `gitGraph` | Stable |
| Pie | `pie` | Stable |
| Mind Map | `mindmap` | Stable |
| User Journey | `journey` | Stable |
| Quadrant | `quadrantChart` | Stable |
| Requirement | `requirementDiagram` | Stable |
| Timeline | `timeline` | Stable |
| Sankey | `sankey-beta` | Beta |
| XY Chart | `xychart-beta` | Beta |
| Block | `block-beta` | Beta |
| Packet | `packet-beta` | Beta |
| Kanban | `kanban` | Beta |
| Architecture | `architecture-beta` | Beta |
| Radar | `radar-beta` | Beta (v11.6.0+) |
| Treemap | `treemap-beta` | Beta (v11.x+) |
| C4 | `C4Context` | Experimental |
| ZenUML | `zenuml` | Stable |

## Troubleshooting

### Linux Sandbox Errors

If `mmdc` fails with Chromium sandbox errors:

```bash
echo '{"args":["--no-sandbox"]}' > /tmp/puppeteer-config.json
mmdc -i input.mmd -o output.svg -p /tmp/puppeteer-config.json
```

### Missing Fonts

For proper text rendering, install common fonts:

```bash
# Debian/Ubuntu
sudo apt install fonts-noto fonts-liberation

# Fedora
sudo dnf install google-noto-fonts-common liberation-fonts
```

### Headless Server

On servers without display:

```bash
# Install virtual framebuffer
sudo apt install xvfb

# Run with xvfb
xvfb-run mmdc -i input.mmd -o output.svg
```

## File Structure

```
mermaid-diagrams/
├── README.md              # This file
├── SKILL.md               # Main skill instructions
└── references/
    └── syntax-reference.md  # Complete syntax for all diagram types
```

## Output Formats

| Format | Flag | Notes |
|--------|------|-------|
| SVG | `-o file.svg` | Default, best for web |
| PNG | `-o file.png` | Use `-s 2` for retina |
| PDF | `-o file.pdf` | Use `-f` to fit chart |

## Links

- [Mermaid Documentation](https://mermaid.js.org/)
- [Mermaid Live Editor](https://mermaid.live/)
- [mermaid-cli GitHub](https://github.com/mermaid-js/mermaid-cli)
- [Mermaid Releases](https://github.com/mermaid-js/mermaid/releases)
