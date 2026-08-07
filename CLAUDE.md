# dotfiles

Dotfiles repo, deployed with [dotbot](https://github.com/anandpiyer/dotbot) via
`install.conf.yaml`.

## Claude config lives HERE, not in `~/.claude`

Several Claude Code files under `~/.claude/` are **symlinks into this repo**. The files in
`~/.claude/` are not real files — edit the source in this repo instead. `dotbot` recreates
the links on install (`relink: true`, `force: true`).

| Symlink (`~/.claude/…`) | Real file (this repo) |
|---|---|
| `~/.claude/CLAUDE.md` | `claude/CLAUDE.md` — the global instructions loaded into every session |
| `~/.claude/settings.json` | `claude/settings.json` |
| `~/.claude/skills/` | `claude/skills/` — currently `rest-api/`, `ui-design/` |

Rules:

- To change the global `CLAUDE.md`, a skill, or `settings.json`, edit the file under
  `claude/` in this repo. Never write to the `~/.claude/` path — it resolves to the same
  inode, but editing through the link hides the change from `git status` in the working
  directory you're actually in.
- Adding a new skill means creating `claude/skills/<name>/` here; it appears in
  `~/.claude/skills/` automatically because the whole directory is linked (no
  `install.conf.yaml` change needed).
- Adding a new *linked file* (not a skill) does require a new entry in the `link:` block of
  `install.conf.yaml`.
- Changes take effect immediately through the symlink; re-running dotbot is only needed
  after editing `install.conf.yaml`.
- Everything under `claude/` is committed — use conventional commits.

## Other links

The same applies to the shell/git dotfiles (`aliases`, `gitconfig`, `gitignore`, `zshrc`,
`zshenv`, `zprofile`, `starship.toml`): the versions in `$HOME` are symlinks, and this repo
holds the sources. See `install.conf.yaml` for the full mapping.
