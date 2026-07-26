# ContextDeck Stream Deck plugin

This directory contains the Stream Deck plugin runtime, native Windows helper,
profile generator, Property Inspector, tests, and packaging scripts.

## Context profiles

The build generates four empty, editable profiles for each supported layout:

- Text
- File
- Folder
- Image

Supported layouts:

- Stream Deck / MK.2
- Stream Deck Mini
- Stream Deck XL
- Stream Deck Mobile
- Stream Deck +
- Stream Deck Neo

The manifest contains 24 profile archives (`4 contexts × 6 layouts`), but Stream
Deck installs only the profiles compatible with the connected device. Bundled
profiles contain no actions. Users can add `ContextDeck Control` manually from
the Stream Deck actions list when they want pause/resume or settings access.

## Privacy model

The helper does not serialize selected content. Its JSON-lines protocol contains
only a category, process name, source, confidence, and timestamp:

```json
{
  "kind": "text",
  "process": "notepad",
  "source": "uia-text",
  "confidence": "high",
  "timestamp": "2026-07-25T00:00:00+00:00"
}
```

## Development

```powershell
npm install
npm test
npm run build
npm run validate
npm run package
```

The complete workflow is available as:

```powershell
npm run build:package
```

## Helper diagnostic

After building:

```powershell
.\com.chromusx.contextdeck.sdPlugin\ContextDeck.Helper.exe --once
```

This prints one privacy-safe observation for the current foreground selection.
