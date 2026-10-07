# Copilot instructions — MicrosoftCloudLogos

> Canonical standards live in the `dev-standards` repo on SOUNDWAVE/Gitea.

## What this repo is

An **asset collection** of Microsoft Cloud logos/icons and their metadata. Not a
Home Assistant component, an app, or the website's source repository.

## Repo shape

- `logos/` + `icons/` — the image assets (the actual deliverable).
- `metadata.md` files — product names, status, aliases, and family information.
- `README.md`, `CONTRIBUTING.md`, `reorganisation_guidance.md`,
  `.devcontainer/`, and `.github/` — contributor guidance and repository tooling.

## Conventions

- Primarily an asset repo: commit logo files and matching metadata only.
- The independently deployed website at `www.mscloudlogos.com` rebuilds its
  catalogue from this repository after changes reach `main`; do not add or
  commit generated website data here.
- Microsoft logos are **trademarked** — usage is governed by Microsoft's brand
  guidelines; this repo just collects them. Don't alter the marks themselves.

## Never

- Don't commit secrets. Don't modify the trademarked logos.
