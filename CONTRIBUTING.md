# Contributing to ContextDeck

Contributions, bug fixes, device testing, documentation improvements, and new
selection detectors are welcome.

## Before opening an issue

- Search existing issues for the same behavior.
- Confirm the problem with the latest version.
- Include the Stream Deck software version, Windows version, device model, and
  foreground application involved.
- Do not include selected text, private paths, or other sensitive content.

## Development setup

Requirements:

- Windows 10 or 11
- Node.js 20+
- npm
- .NET 8 SDK
- Stream Deck 6.9+

```powershell
cd streamdeck-plugin
npm install
npm test
npm run build
npm run validate
```

## Pull requests

1. Keep changes focused.
2. Add or update tests when behavior changes.
3. Run `npm test`, `npm run build`, and `npm run validate`.
4. Do not commit `node_modules`, build output, generated profiles, or packaged
   `.streamDeckPlugin` files.
5. Explain user-visible behavior, privacy impact, and supported device impact in
   the pull-request description.

By contributing, you agree that your contribution is licensed under the
project's MIT License.
