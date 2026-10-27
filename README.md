# openchamber-file-browser

An [OpenChamber](https://openchamber.dev) extension that turns OpenChamber into a
local filesystem browser: browse the open project through the host file APIs, read
file content, preview it, and save edits back through the same granted path.

- **Panel + page**: compact rail panel for quick lookups; full-screen page
  (OpenChamber → *Extension pages*) as the primary workspace.
- **Host-native file access**: the panel calls `host.listDir` / `host.readFile` /
  `host.stat` / `host.writeFile` on the OpenChamber host. No local service, no
  second token, no proxy layer.
- **Scoped by capability**: relative paths resolve inside the open project
  (`files`); paths outside it need a declared `contributes.filesystem` glob and the
  `filesystem` capability.

## Capabilities

```json
{
  "contributes": {
    "panel": {
      "id": "openchamber-file-browser",
      "name": "File Browser",
      "icon": "folder",
      "entry": "panel/index.html"
    },
    "page": true,
    "capabilities": ["files"],
    "filesystem": ["~/.**"]
  }
}
```

- `capabilities: ["files"]` grants read **and** write inside the open project.
- `contributes.filesystem` declares `["~/.**"]`, which grants the `filesystem`
  capability for paths outside the open project (home-relative globs).

Install approves this once in **Settings → Extensions**.

## Build (development)

```bash
bun install
bun run check   # bun test && tsc --noEmit && build panel
```

Built artifact: `panel/main.js` (classic IIFE). Rebuild after editing TypeScript sources.

## Internationalization

UI copy lives in `panel/i18n.ts` (`en` and `zh`). The panel resolves its locale
from OpenChamber's session language: any `zh-*` variant maps to `zh`, everything
else falls back to `en`.

## Architecture

```
┌──────────────────────────── OpenChamber ────────────────────────────┐
│  panel/index.html (sandboxed guest, panel or page surface)         │
│    panel/main.ts      host lifecycle, shell, load                     │
│    panel/file-view   directory listing + navigation + selection     │
│    panel/preview     content preview + edit + save                 │
│    panel/state.ts     reducer, request generations                  │
│    panel/api.ts       typed client over host file methods           │
│              │  host.listDir / readFile / stat / writeFile          │
│              ▼                                                     │
│        OpenChamber host file runtime                              │
└─────────────────────────────────────────────────────────────────────┘
```

## Troubleshooting

| State you see | Meaning | Fix |
| --- | --- | --- |
| Filesystem access is not granted | The user has not approved the `filesystem` capability | Settings → Extensions → review/approve, then **Retry** |
| No project is open | Relative paths need an open project | Open a project in OpenChamber |
| File not found | The path no longer exists | Pick another file |
| File is too large | Content over the host limit | Split or trim the file |
| Access denied | OS refused the file access | Retry / re-grant permission |

## License

MIT
