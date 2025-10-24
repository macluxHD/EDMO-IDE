import "./App.css";
import { useState, useRef, useEffect } from "react";
import { BlocklyWorkspace } from "@kuband/react-blockly";
import { javascriptGenerator } from "blockly/javascript";
import * as Blockly from "blockly";

import { setServoRotation } from "./custom_blocks/setRotation";
import { sleep } from "./custom_blocks/sleep";

import Toolbox from "./toolbox";

import Simulation from "./components/simulation";

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function App() {
  const [xml, setXml] = useState<string>(
    localStorage.getItem("blocklyWorkspaceXml") as string | ""
  );
  const [javascriptCode, setJavascriptCode] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const [version, setVersion] = useState(0);

  function workspaceDidChange(workspace: Blockly.Workspace) {
    const code = javascriptGenerator.workspaceToCode(workspace);
    setJavascriptCode(code);
  }

  useEffect(() => {
    localStorage.setItem("blocklyWorkspaceXml", xml);
  }, [xml]);

  // TODO: Add some way to be able to cancel infinite loops that do not have any sleep calls
  const runCode = async () => {
    // Abort any previous execution
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("Previous execution stopped");
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const evalContext = {
        setServoRotation,
        sleep: sleep(signal),
      };
      const evalArgs = Object.keys(evalContext);
      const evalVals = Object.values(evalContext);
      const AsyncFunction = Object.getPrototypeOf(
        async function () {}
      ).constructor;
      const evalFunction = new AsyncFunction(...evalArgs, javascriptCode);

      await evalFunction(...evalVals);
      console.log("Execution completed");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Execution aborted");
      } else {
        console.error("Execution error:", error);
      }
    } finally {
      // Clean up if this execution completes normally
      if (abortControllerRef.current?.signal === signal) {
        abortControllerRef.current = null;
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveFile = () => {
    const blob = new Blob([xml], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workspace.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setXml(text);
        localStorage.setItem("blocklyWorkspaceXml", text);
        setVersion((v) => v + 1);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <>
      <div className="controls">
        <button onClick={runCode}>Run</button>
        <button onClick={handleSaveFile}>Save as file</button>
        <button onClick={() => fileInputRef.current?.click()}>
          Load from file
        </button>
        <input
          type="file"
          accept=".xml"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleLoadFile}
        />
      </div>
      <div className="container">
        <div className="editor">
          <BlocklyWorkspace
            key={version}
            toolboxConfiguration={Toolbox}
            initialXml={xml}
            className="workspace"
            workspaceConfiguration={{
              grid: {
                spacing: 20,
                length: 3,
                colour: "#df2323ff",
                snap: true,
              },
            }}
            onWorkspaceChange={workspaceDidChange}
            onXmlChange={setXml}
          />
        </div>
        <div className="simulation">
          <Simulation />
        </div>
        <div className="output">
          <SyntaxHighlighter
            language="javascript"
            style={oneDark}
            customStyle={{
              borderRadius: "8px",
              padding: "12px",
              height: "100%",
              overflowY: "auto",
            }}
            showLineNumbers
          >
            {javascriptCode}
          </SyntaxHighlighter>
        </div>
      </div>
    </>
  );
}

export default App;
