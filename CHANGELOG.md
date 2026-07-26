# Changelog

All notable changes to ContextDeck are documented in this file.

## [0.1.9] - 2026-07-26

### Changed

- Applied the official ContextDeck artwork to the plugin icon shown in Stream Deck preferences.
- Replaced the generic action-list glyph with a monochrome ContextDeck logo variant.
- Corrected the category icon sizes to the official 28 px and 56 px dimensions.

### Fixed

- Bumped the plugin version so Stream Deck refreshes cached plugin artwork after reinstalling.

## [0.1.8] - 2026-07-26

### Added

- Automatic profiles for selected text, files, folders, and image files.
- Support for Stream Deck, Mini, XL, Mobile, +, and Neo layouts.
- Multi-device profile switching.
- Privacy-safe self-contained Windows selection helper.
- Stream Deck-style Property Inspector with global settings.
- Optional ContextDeck Control action.
- Profile generation, structural validation, tests, and packaging scripts.

### Changed

- Bundled context profiles are empty and fully user-configurable.
- Image detection is limited to image files selected in File Explorer.

### Fixed

- Correct Stream Deck runtime context for global settings and profile switching.
- Valid page identifiers and directory entries in generated profile archives.
- Retry and repair behavior for profile installation across multiple devices.
