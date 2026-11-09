# Dhiyan — Cyber Portfolio

Static portfolio for https://dhiyank.github.io, with an editorial cyber design and a lightweight, interactive 3D security sculpture. No build step or JavaScript dependencies are required.

## Preview locally

Run `python3 -m http.server 8765` in this folder and open http://localhost:8765.

## Files

- `index.html`, `about.html`, `projects.html`, `certs.html`, `contact.html`: portfolio pages.
- `style.css`: original styles, including the terminal.
- `cyber.css`: responsive cyber design and light theme.
- `cyber.js`: perspective-projected 3D rings and faceted core, motion controls, terminal accessibility label.
- `terminal.js`, `home.js`, `matrix.js`: preserved original functionality.
- `profile.jpg`, `cv.pdf`: original profile and CV.

The terminal retains help, ls, cd, whoami, date, clear, Tab completion, and command history. 3D motion pauses when offscreen or the tab is hidden, respects reduced-motion preferences, and has a manual pause control. The renderer uses Canvas 2D to project a 3D mesh without external libraries.

## Publish

Commit changes to the repository's `main` branch. GitHub Pages publishes the site using the repository's existing Pages configuration.

Design inspiration: the oversized editorial typography of the supplied Brand Revival / Second Story reference, reinterpreted with original cyber graphics and existing portfolio content.
