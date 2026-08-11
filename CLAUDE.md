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
| `~/.claude/skills/` | `claude/skills/` — one directory per skill (see below) |

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

## Skills in `claude/skills/`

The skills here are **generic, portable technique references** — they are consumed by every
project, so nothing in them may assume a particular repo's layout. Which skill to invoke for
which task is documented in the routing table at the top of `claude/CLAUDE.md`; that table and
the directory listing must stay in sync.

Conventions for a skill in this repo:

- `SKILL.md` — YAML frontmatter (`name` matching the directory, `description` phrased as
  *what it does* + *when to use it*, since that description is the only thing Claude sees when
  deciding whether to invoke it), then a short index. Keep it short.
- `references/` — the detailed guides, linked from `SKILL.md`.
- `templates/`, `scripts/`, `assets/` — copy-in implementations.

When editing a skill here:

- Adding, removing, or renaming a skill directory means **updating the routing table in
  `claude/CLAUDE.md`** in the same commit. A dangling skill reference in the global
  instructions is worse than no reference — it sends Claude looking for a file that isn't there.
- If a new skill overlaps an existing one, add a tie-breaker line to the "Overlapping skills"
  section of `claude/CLAUDE.md` saying which to pick when.
- Skills sourced from elsewhere often carry stack assumptions I don't use (TypeScript,
  Sequelize/Prisma, `winston`, `console.log`). Leave the skill generic and record the
  translation as a delta in `claude/CLAUDE.md` rather than forking the skill.

## Other links

The same applies to the shell/git dotfiles (`aliases`, `gitconfig`, `gitignore`, `zshrc`,
`zshenv`, `zprofile`, `starship.toml`): the versions in `$HOME` are symlinks, and this repo
holds the sources. See `install.conf.yaml` for the full mapping.
