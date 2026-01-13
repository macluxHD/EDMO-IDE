# EDMO IDE
Blockly-based IDE and simulator for the EDMO modular robot, built for Project 3-1 (BCS3300) at Maastricht University.

## Live Demo
Try the hosted build at https://macluxhd.github.io/EDMO-IDE/.

## Local Development
**Requirements:** Node.js (18+ recommended) and git.

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/macluxHD/EDMO-IDE
   cd EDMO-IDE
   npm install
   ```
2. Start the Vite dev server:
   ```bash
   npm run dev
   ```
3. Open the URL printed in the terminal to access the IDE.

Workspace XML is cached in `localStorage`, and the UI lets you export/import `.xml` files for portability.

## MCP Prototype & AI Integration
The repository ships with a lightweight MCP-style server (`server/mcpServer.js`) and a client helper (`src/mcpConnector.ts`). The server reads the real TypeScript sources and returns *only* the exact function definition that is exported in the codebase, so external agents always see the authoritative implementation.

### Running the MCP server
```powershell
cd server
npm install
npm start
```
The server listens on `http://localhost:4000` (override with `PORT`). It exposes both REST and WebSocket interfaces:

- `GET /functions` - list function metadata (`name`, `signature`, `description`).
- `GET /functions/:name` - compute the current code snippet straight from the TypeScript file and return it as `codeTemplate` plus optional `blockXml`.
- WebSocket `/mcp` - send `{ type: "list_functions" }` or `{ type: "get_function_code", functionName }` to receive the same payloads. Message envelopes include `.response` suffixes and echo your `messageId`.

### Available functions today
| Name | Source | Description |
| --- | --- | --- |
| `setServoRotation` | `src/custom_blocks/setRotation.ts` | Routes Blockly block output into the simulation by rotating the left/right EDMO arms. |
| `sleep` | `src/custom_blocks/sleep.ts` | Creates an abort-aware sleep helper used by generated asynchronous Blockly code. |

To consume the API from the frontend, import helpers from `src/mcpConnector.ts` and call `fetchFunctionList`, `requestFunctionCode`, or use `connectMCP` for a persistent WebSocket session.

## Acknowledgements
This project uses STL files from the educational modular robot platform **EDMO**, developed by the DKE SwarmLab at Maastricht University. Please acknowledge their work if you build upon these materials. Read more at the [EDMO project page](https://www.maastrichtuniversity.nl/edmo).
