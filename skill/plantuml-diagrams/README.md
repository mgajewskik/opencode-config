# PlantUML Diagrams Skill

## Requirements

### Core

```bash
# Arch/Manjaro
sudo pacman -S plantuml graphviz

# Ubuntu/Debian
sudo apt install plantuml graphviz

# macOS
brew install plantuml graphviz

# Fedora
sudo dnf install plantuml graphviz
```

### Optional

```bash
# PDF output support
sudo pacman -S texlive-core  # Arch
sudo apt install texlive-latex-base  # Debian/Ubuntu

# Preview (Linux - usually pre-installed)
xdg-open  # part of xdg-utils
```

## Verify Installation

```bash
plantuml -version
dot -V  # Graphviz
```

## Fallback (No Graphviz)

If Graphviz unavailable, add to `.puml` files:
```
!pragma layout smetana
```

Works for most diagram types except some edge cases.
