// Simple MCP connector for the IDE (prototype)
// Provides helpers to fetch available functions and request function code from the MCP prototype server.

export async function fetchFunctionList(baseUrl = 'http://localhost:4000') {
  const res = await fetch(`${baseUrl}/functions`);
  if (!res.ok) throw new Error(`Failed to fetch functions: ${res.status}`);
  const body = await res.json();
  return body.functions || [];
}

export async function requestFunctionCode(functionName: string, baseUrl = 'http://localhost:4000') {
  const res = await fetch(`${baseUrl}/functions/${encodeURIComponent(functionName)}`);
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error((payload && payload.error) || `Failed to fetch function ${functionName}`);
  }
  const body = await res.json();
  return body.function;
}

// WebSocket MCP connector (lightweight). Handlers: onOpen, onClose, onError, onMessage, onFunctionsList, onFunctionCode
export function connectMCP(wsUrl = 'ws://localhost:4000/mcp', token?: string, handlers: any = {}) {
  const url = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;
  const ws = new WebSocket(url);

  ws.onopen = (ev: Event) => {
    handlers.onOpen && handlers.onOpen(ev);
  };

  ws.onclose = (ev: CloseEvent) => {
    handlers.onClose && handlers.onClose(ev);
  };

  ws.onerror = (ev: Event) => {
    handlers.onError && handlers.onError(ev);
  };

  ws.onmessage = (ev: MessageEvent) => {
    let msg: any;
    try {
      msg = JSON.parse(ev.data as string);
    } catch (err) {
      handlers.onMessage && handlers.onMessage(ev.data);
      return;
    }

    // route known responses
    if (msg.type === 'list_functions.response') {
      handlers.onFunctionsList && handlers.onFunctionsList(msg.functions, msg);
      return;
    }
    if (msg.type === 'get_function_code.response') {
      handlers.onFunctionCode && handlers.onFunctionCode(msg.functionName, msg.codeTemplate, msg.blockXml, msg);
      return;
    }

    handlers.onMessage && handlers.onMessage(msg);
  };

  function send(obj: any) {
    ws.send(JSON.stringify(obj));
  }

  function listFunctions(messageId?: string) {
    send({ type: 'list_functions', messageId: messageId || Date.now().toString() });
  }

  function getFunctionCode(functionNameArg: string, messageId?: string) {
    send({ type: 'get_function_code', messageId: messageId || Date.now().toString(), functionName: functionNameArg });
  }

  return { ws, send, listFunctions, getFunctionCode, close: () => ws.close() };
}

/* Example usage in the IDE:
import { connectMCP, requestFunctionCode, fetchFunctionList } from './mcpConnector';

// HTTP: one-off
const functions = await fetchFunctionList();

// WS: persistent
const conn = connectMCP('ws://localhost:4000/mcp', null, {
  onFunctionsList: (fns) => console.log('functions', fns),
  onFunctionCode: (name, codeTemplate, blockXml) => console.log(name, codeTemplate, blockXml)
});
conn.listFunctions();
*/
