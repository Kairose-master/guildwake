# Guildwake

**여명의 길드 — a small guild, a living island, one more expedition.**

A playable, browser-local guild management game. Select two companions, choose an expedition and approach, make a decision in the field, return with supplies, and rebuild your guild house. Korean interface; original low-poly Blender assets.

## Play locally

Requires Node.js **24+** (the test suite uses native TypeScript stripping).

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 4173
```

Open the URL printed by the server (normally http://localhost:4173/).

- **Chapter objective:** hall level 3, reputation 30, at least 5 expeditions.
- Pick **two** of three starting companions. A fourth can be recruited.
- Scouting helps in the forest; crafting in the mine; guarding at the tower.
- Expeditions take eight seconds each way, with a player decision in between.
- Fatigue reduces ability. Free rest restores the team and at least two supplies, preventing a resource soft lock.
- Rewards are claimed once. The next areas open at reputation 5 and 14.
- State saves to this browser. Reloading resumes the journey; corrupt data is preserved until an explicit reset.
- Drag the map to orbit; use zoom/reset controls. If WebGL is unavailable, the game remains playable with a rendered map.

## What this version is

A complete **first playable chapter**, not an online economy or production blockchain game. Companion behavior and encounter outcomes are deterministic game rules, not live LLM calls. Gold is fictional. No wallet, payment, remote generation, or on-chain transaction is performed.

The game runs independently of Handsel. See [integration boundaries](docs/integrations.md) for the planned Handsel/Higgsfield paths and why local results are not trusted settlement evidence.

## Architecture

- `app/page.tsx`: game UI; uses the same state machine as optional WebMCP actions.
- `src/game.ts`: pure expedition, probability, progression, and save-validation rules.
- `src/store.ts`: synchronous action boundary, external-store subscription, local persistence.
- `src/scene.ts`: batches the static Blender world by material to reduce draw calls.
- `components/world.tsx`: Three.js island, moving expedition pawns, map pins, visible level 2/3 buildings, resource cleanup.
- `src/webmcp.ts`: optional browser tools for state, expedition start, encounter choice, and reward claim. Feature-detected; no external MCP server or credentials required.
- `scripts/build_world.py`, `scripts/build_upgrades.py`: reproducible Blender source.
- `public/assets/manifest.json`: generated asset sizes, triangles and SHA-256 hashes.

## Assets

Original assets were built with Blender 5.2.1 LTS. The repo includes editable `.blend` sources, web `.glb` exports and a rendered PNG fallback. No third-party model packs or paid generations are included.

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/build_world.py
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/build_upgrades.py
npm run check:assets
```

The base island is about 415 KiB; each companion is about 24 KiB. Asset checking rejects invalid GLB headers, external file dependencies and non-finite bounds. Scene tests parse every GLB using the same loader as the game.

## Checks

```sh
npm run check
```

Covers rule transitions, unlocks, resource recovery, fatigue, seeded results, complete campaign, storage/reload, duplicate rewards, corrupt saves, WebMCP contracts, and real GLB loading/batching. Browser UI interaction and real browser WebMCP validation are separate checks; mocked contract tests are not a claim of browser certification.

The untouched generated `components/ui` catalog and `hooks/use-mobile.ts` are excluded from product lint because the scaffold ships with rules incompatible with some of its own vendored components. TypeScript still checks them. All authored game code remains linted.

## Boundaries

- Local saves are user-editable and are **not** authoritative, signed, tamper-resistant, or eligible for real payouts.
- Progress is device-local; no cross-device/cloud sync or multiplayer.
- No paid Higgsfield calls, Handsel escrow, deployment or mainnet setup has been performed.
- WebMCP is optional and can be unavailable in a browser; normal controls remain the primary path.

MIT — see [LICENSE](LICENSE).

Dependency audit at creation: application dependencies were updated to patched compatible releases. Production-only audit reported zero findings. Four remaining high audit entries trace to the development preview image-processing dependency (`sharp` through Miniflare/Wrangler); npm proposes incompatible downgrades, which were not applied. Do not expose the development server publicly. Production deployment remains outside this release.
