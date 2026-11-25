# Changelog

All notable changes to this website. Newest first.
Versions follow `vMAJOR.MINOR.PATCH` (see docs/deployment.md).

## [1.2.1] - 2026-11-25
### Added
- Google Search Console verification file. Do not delete it, or Search Console stops working.

## [1.2.0] - 2026-11-25
### Added
- Search engine basics: `sitemap.xml`, `robots.txt`, and structured data that tells Google who the site belongs to (with links to GitHub and LinkedIn) and marks the case studies as articles.
- Tests for the sitemap, robots.txt, canonical links and structured data.

## [1.1.0] - 2026-11-25
### Added
- Case study page for Brainy Blooms Student Assessment, linked from its project card.
- The live-site check now also opens the new case study page.

## [1.0.0] - 2026-11-22
### Added
- Project standard setup: CI on every pull request (lint, secrets check, build check, tests).
- Automatic live-site check after every merge to main (waits for Vercel, then opens the site).
- Tests for projects, certificates, skills, images and links.
- `.gitignore` that blocks `.env` files, `.env.example`, `.vscode` settings.
- README, this CHANGELOG, and docs (requirements, architecture, deployment).

### Already live before this version
- BLOCK CITY design with the 3D block background, night mode and certificate viewer.
- Projects: Teambull Fuel House, Brainy Blooms Work Tracker (with case study), Brainy Blooms Student Assessment, ProAuth IQ.
- "Next project" teaser (GoLocal Wheels).
- 10 certificates, resume download, contact links.
