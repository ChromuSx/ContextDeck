# Changelog

All notable changes to ContextDeck are documented in this file.

## [0.1.12] - 2026-07-28

### Fixed

- Removed the startup profile-repair cycle and profile-switch retries that
  could trigger repeated installation prompts.
- Context profiles now rely exclusively on Stream Deck's single bundled-profile
  prompt during plugin installation.

## [0.1.11] - 2026-07-26

### Changed

- Raised the manifest SDK compatibility to version 3 for Marketplace DRM.
- Switched distribution packaging and validation to the official Stream Deck
  CLI 1.7.4.
- Kept the minimum Stream Deck software version at 6.9, as required for DRM.

## [0.1.10] - 2026-07-26

### Changed

- Replaced every ContextDeck Control key-state image with the official logo.
- Added compact status badges for pause, detected context, and errors.
- Removed runtime key titles so status text no longer obscures the logo.

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
