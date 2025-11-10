const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const { listFunctionSummaries, getFunctionDetail } = require('./functionRegistry');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

// REST: list functions
app.get('/functions', (req, res) => {
  res.json({ functions: listFunctionSummaries() });
});

// REST: get specific function details
app.get('/functions/:name', (req, res) => {
  try {
    const name = req.params.name;
    const fn = getFunctionDetail(name);
    if (!fn) {
      return res.status(404).json({ error: 'not_found' });
    }
    res.json({ function: fn });
  } catch (error) {
    console.error('Failed to load function', req.params.name, error);
    res.status(500).json({ error: 'code_extraction_failed' });
  }
});

// Minimal health
app.get('/health', (req, res) => res.json({ ok: true }));

const server = app.listen(PORT, () => {
  console.log(`MCP prototype server listening on http://localhost:${PORT}`);
});

// WebSocket MCP endpoint
const wss = new WebSocketServer({ server, path: '/mcp' });

wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  console.log('mcp client connected', clientId);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', error: 'invalid_json' }));
      return;
    }

    handleMessage(ws, msg, clientId);
  });

  ws.on('close', () => console.log('mcp client disconnected', clientId));
});

function handleMessage(ws, msg, clientId) {
  if (!msg || !msg.type) {
    ws.send(JSON.stringify({ type: 'error', error: 'missing_type' }));
    return;
  }

  switch (msg.type) {
    case 'list_functions': {
      const list = listFunctionSummaries();
      ws.send(JSON.stringify({ type: 'list_functions.response', messageId: msg.messageId || null, functions: list }));
      break;
    }
    case 'get_function_code': {
      const name = msg.functionName;
      try {
        const fn = getFunctionDetail(name);
        if (!fn) {
          ws.send(JSON.stringify({ type: 'get_function_code.response', messageId: msg.messageId || null, error: 'not_found' }));
          return;
        }
        ws.send(JSON.stringify({
          type: 'get_function_code.response',
          messageId: msg.messageId || null,
          functionName: name,
          codeTemplate: fn.codeTemplate,
          blockXml: fn.blockXml
        }));
      } catch (error) {
        console.error('Failed to load function', name, error);
        ws.send(JSON.stringify({ type: 'get_function_code.response', messageId: msg.messageId || null, error: 'code_extraction_failed' }));
      }
      break;
    }
    default:
      ws.send(JSON.stringify({ type: 'error', error: 'unknown_type' }));
  }
}

// Convenience: allow broadcasting events to all connected IDE clients (not used in minimal prototype)
function broadcastEvent(event) {
  const raw = JSON.stringify(event);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(raw);
  }
}

module.exports = { app, server, wss };
