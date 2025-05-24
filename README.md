<p align="center">
  <img src="./assets/logo.png" width="250px">
</p>

# hops

Manage [Homebrew](https://brew.sh) packages across multiple machines with a single YAML file.

## Why?

Managing Homebrew packages with `Brewfile` is great, until you're juggling multiple machines.
Hops replaces scattered, duplicated configurations with a single declarative YAML config.

- ✅ One `hops.yml` config for all machines
- 📦 Generates a specific `Brewfile` for each machine
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
curl -L https://github.com/revett/hops/releases/download/vX.Y.Z/hops_X.Y.Z_darwin_arm64.tar.gz -o hops.tar.gz
tar -xzf hops.tar.gz
xattr -c ./hops
sudo mv hops /usr/local/bin
hops -h

# Build from source (required Bun)
git clone https://github.com/revett/hops.git
cd hops
make build
sudo mv hops /usr/local/bin
hops -h
```

## Usage

Optionally set the `HOPS_CONFIG` environment variable within your terminal profile:

```bash
# Defaults to ~/hops.yml if not set
export HOPS_CONFIG=/path/to/hops.yml
```

Initialise the configuration file:

```bash
hops init
```

This will create a `hops.yml` with a set of example packages; update these with your desired set of
machines and packages. This config file is designed to sit in your dotfiles and sync across all your
machines.

Apply the configuration for a specific machine:

```bash
hops generate --machine work
hops apply --machine work
```

Hops will take care of:

- Creating a local `Brewfile` made up of the correct shared and machine specific packages
- Install any missing packages
- Update any outdated packages
- Remove any floating packages that are not outlined in the `Brewfile`

## Commands

```bash
# Initialize a new hops.yml configuration file with examples
hops init

# Generate a local Brewfile for a specific machine without installing anything
hops generate --machine work

# Generate Brewfile and apply changes via Homebrew commands (install, upgrade, cleanup)
hops apply --machine personal
```

## Examples

See [hops.yml](https://github.com/revett/dotfiles/blob/main/hops.yml) in
[revett/dotfiles](https://github.com/revett/dotfiles).

## Releases

1. Bump version in `package.json` and push
1. `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
1. `git push origin vX.Y.Z`
1. `make release VERSION=vX.Y.Z`
1. Create release in GitHub
