# Contributing to Microsoft Cloud Product Logos

First off — thank you! This repository is a community-maintained collection of
current and legacy Microsoft cloud product logos, and it only stays useful
because people like you help keep it accurate and complete.

This guide explains how to contribute properly so your changes can be merged
quickly and without rework. It complements the
[Contributing section in the README](README.md#contributing) and the conventions
described in [reorganisation_guidance.md](reorganisation_guidance.md).

> **Trademark note:** All logos are the property of Microsoft Corporation and are
> subject to [Microsoft's Trademark and Brand Guidelines](https://learn.microsoft.com/en-us/microsoft-365/cloud-storage-partner-program/online/branding).
> This project simply collects them — **never alter or recreate the marks themselves.**

---

## Before you start

Please **thoroughly check the repository first.** Many products have moved,
been renamed, or have legacy versions tucked into sub-folders (see the structure
rules below). Checking first avoids duplicate issues and pull requests.

---

## Ways to contribute

| You want to… | Do this |
| :--- | :--- |
| Report an incorrect, outdated, or missing logo | [Open an issue](../../issues/new) |
| Add a new logo | Open a pull request (see below) |
| Update / replace an existing logo | Open a pull request (see below) |
| Suggest a structural or process change | Open an issue to discuss first |

If you spot something incorrect and know the fix, a pull request is welcome —
otherwise an issue is perfectly fine.

---

## Adding or updating a logo

### 1. Place the file in the correct folder

- Logos live under `logos/` grouped by **product**, in a folder named after that
  product.
- Folder and file names are **lowercase**, use **hyphens** instead of spaces, and
  contain **no spaces** (e.g. `microsoft-scout`, `azure-app-service`).
- Group products by their current product family where applicable. Outliers
  (e.g. Entra, Intune, Power BI) are handled case-by-case — see the
  [README structure notes](README.md#file--folder-structure).
- **Renamed products:** put the old logos in a sub-folder of the *current* name
  (e.g. Yammer lives under `viva-engage`).
- **Retired products:** move them into a `zzFORMER_PRODUCTS` folder within their
  product family where possible.
- **Multiple versions / eras:** keep older logos in sub-folders named by their
  years of existence and style (e.g. `2019-current_full-color`).

### 2. Follow the file naming convention

- Prefer scalable vector art. Name single SVGs `<product>-scalable.svg`
  (e.g. `microsoft-scout-scalable.svg`).
- For raster files, include the dimensions in the filename where relevant
  (e.g. `agent-365-300x300.png`).
- Keep sizing/padding consistent with sibling files in the product family.

### 3. Add or update `metadata.md`

Every product folder contains a `metadata.md` file. The site
([www.mscloudlogos.com](https://www.mscloudlogos.com)) is built from these files,
so accurate metadata is essential.

| Field | Description | Required |
| :--- | :--- | :--- |
| `name` | Current product name | Yes |
| `type` | `Product`, `Family`, or `Feature` | Yes |
| `status` | `Active`, `Retired`, or `Renamed (TO: <name>)` | Yes |
| `altnames` | Alternative / former names, abbreviations (comma-separated) | No |
| `prodfamilies` | Product family or families it belongs to (comma-separated) | No |

Example:

```text
name: Microsoft Scout

type: Product

status: Active

altnames: Scout, Frontier

prodfamilies: Microsoft 365
```

See [reorganisation_guidance.md](reorganisation_guidance.md) for more worked
examples (renamed products, families, and features).

### 4. Do **not** hand-edit `docs/js/logo-data.js`

`docs/js/logo-data.js` is **auto-generated** from the logo files and their
`metadata.md` by [`generate-logo-data.py`](generate-logo-data.py). Never edit it
by hand.

You have two options:

- **Let CI do it (simplest):** just commit your logo file(s) and `metadata.md`.
  The [Update GitHub Pages workflow](.github/workflows/update-github-pages.yml)
  regenerates and commits `logo-data.js` for branches in this repo, and comments
  on fork pull requests asking you to regenerate it.
- **Regenerate it yourself:** run the generator and commit the result:

  ```bash
  python generate-logo-data.py
  ```

> **Heads-up about the diff:** each logo's `id` in `logo-data.js` is a positional
> index. Adding a logo renumbers the IDs of everything after it, so the generated
> diff can look large. **This is expected** — the IDs aren't referenced by the
> website (lookups use `productSlug` and `path`), and CI produces the same result.

---

## Submitting your pull request

1. **Fork** the repository and create a descriptive branch
   (e.g. `add-microsoft-scout-logo`).
2. Make your changes following the conventions above.
3. Keep each pull request focused — one product or one logical change is ideal.
4. Write a clear PR title and description explaining what you added or fixed, and
   where you sourced the logo if relevant.
5. Open the pull request against the `main` branch and respond to any review
   feedback.

---

## Sources

Official Microsoft icon sets are linked in the
[References and sources section of the README](README.md#references-and-sources).
When possible, use official sources and note where a logo came from in your PR.

Thanks again for contributing! 🎉
