# Tech Stack

## Core Technologies
- **HTML5** — single `index.html` file, no templating engine
- **CSS3** — vanilla CSS, no preprocessors or frameworks; supports `prefers-color-scheme` for auto dark mode
- **Vanilla JavaScript (ES6+)** — no frameworks, no libraries, no npm

## Storage
- **Browser Local Storage API** — all persistence is client-side; no server or database

## Constraints
- **Zero dependencies** — no third-party libraries or CDN imports
- **No build tooling** — no webpack, Vite, npm, or compilation step
- **Standalone file** — must work when opened via `file://` URL directly from the filesystem
- **Browser targets** — current stable Chrome, Firefox, Edge, Safari

## Common Commands
There are no build, compile, or test commands. Development workflow:

```
# Open directly in browser
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

## Code Style Guidelines
- Use `const`/`let`, never `var`
- Prefer `addEventListener` over inline `on*` attributes
- Keep JS modular with clearly named functions per feature area
- CSS custom properties (`--var-name`) for theming/colors
- Semantic HTML elements (`<section>`, `<button>`, `<input>`, etc.)
- WCAG 2.1 AA contrast ratios (minimum 4.5:1 for normal text)
- Minimum body font size: 14px
- Responsive layout supporting 320px–1920px viewport widths
