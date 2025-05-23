<p align="center">
  <img src="./assets/revett-hops-logo-2.png" width="200px">
</p>

# hops

Manage [Homebrew](https://brew.sh) packages across multiple machines with a single YAML file.

## Why?

Managing Homebrew packages with `Brewfile` is great, until you're juggling multiple machines.
Hops replaces scattered, duplicated configurations with a single declarative YAML config.

- ✅ One `hops.yml` config for all machines
- 📦 Generate a specific `Brewfile` for each machine
- 🧹 Prune unused floating packages
- ⚡ Installs, upgrades, and verifies with one command
- 💻 Designed for dotfiles

```yaml
brewfile: /Users/snape/Brewfile
machines:
  shared:
    taps:
      - homebrew/bundle
    formulae:
      - coreutils
    casks:
      - 1password
      - raycast
      - spotify
  personal:
    casks:
      - adobe-creative-cloud
  work:
    casks:
      - loom
      - slack
```

## Install

```bash
# Install via GitHub release
TODO

# Build from source (required Bun)
git clone https://github.com/revett/hops.git
cd hops
make build
./hops -h
```

## Usage

Optionally set the `HOPS_CONFIG` environment variable within your terminal profile:

```bash
# Defaults to ~/hops.yml if not set.
export HOPS_CONFIG=/path/to/hops.yml
```

Initialise the configuration file:

```bash
hops init
```

This will create `hops.yml` with a set of example packages; update these with your desired set of
packages and machines. This config file is designed to sit in your dotfiles and sync across all your
machines.

Apply the configuration for a specific machine:

```bash
hops generate --machine work
hops apply --machine work
```

Hops will take care of:

- Create a local `Brewfile` made up of the correct shared and machine specific packages
- Install any missing packages
- Update any outdated packages
- Remove any floating packages that are not outlined in the `Brewfile`

## Commands

```bash
# Initialize a new hops.yml configuration file with examples.
hops init
```

```bash
# Generate a local Brewfile for a specific machine without installing anything.
hops generate --machine work
```

```bash
# Generate Brewfile and apply changes via Homebrew commands (install, upgrade, cleanup).
hops apply --machine personal
```

## Examples

See [hops.yml](https://github.com/revett/dotfiles/blob/main/hops.yml) in
[revett/dotfiles](https://github.com/revett/dotfiles).
