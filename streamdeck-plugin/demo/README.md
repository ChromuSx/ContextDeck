# ContextDeck moderator demo

This folder contains the reproducible setup used for the real-use moderation
video. It is intentionally separate from the empty profiles shipped to users.

`setup-demo-profiles.js` locates the four ContextDeck profiles belonging to the
connected Stream Deck+ serial number, copies each complete profile to a
timestamped backup in the system temporary directory, and fills the live copies
with standard Stream Deck hotkey actions and generated context-colored icons.

Run it only while Stream Deck is closed:

```powershell
node demo/setup-demo-profiles.js <STREAM_DECK_SERIAL>
```

The generated setup report prints the exact backup directory and profile paths.

Generate the neutral desktop and the isolated Explorer test workspace:

```powershell
node demo/generate-demo-assets.js
```

Run the complete live selection sequence:

```powershell
powershell.exe -WindowStyle Hidden -File demo/run-live-demo.ps1
```

Record the complete sequence and restart Stream Deck first so the plugin and its
native monitor begin from a known-good state:

```powershell
powershell.exe -File demo/record-live-demo.ps1
```

The runner temporarily minimizes existing windows, hides desktop icons, and
covers the primary display with the generated neutral background. These visual
changes are restored in a `finally` block. It opens an isolated text-selection
form followed by Explorer tests for a file, folder, and image, keeping the
Stream Deck application visible so every automatic profile change can be
recorded.
