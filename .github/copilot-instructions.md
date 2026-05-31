# Copilot instructions — MicrosoftCloudLogos

> Canonical standards live in the `dev-standards` repo on SOUNDWAVE/Gitea.

## What this repo is

An **asset collection** of Microsoft Cloud logos/icons, plus a Python script that
generates logo-data from them. Not a Home Assistant component, not an app.

## Repo shape

- `logos/` + `icons/` — the image assets (the actual deliverable).
- `generate-logo-data.py` — a generator script (produces logo-data, e.g. an
  index/manifest from the assets).
- `docs/`, `README.md`, `reorganisation_guidance.md`, `.devcontainer/`,
  `.github/`.

## Conventions

- Primarily an asset repo: the images are the content; `generate-logo-data.py` is
  the one piece of editable code.
- Re-run the generator after adding/reorganising assets rather than hand-editing
  any generated data files.
- Microsoft logos are **trademarked** — usage is governed by Microsoft's brand
  guidelines; this repo just collects them. Don't alter the marks themselves.

## Never

- Don't commit secrets. Don't modify the trademarked logos.
