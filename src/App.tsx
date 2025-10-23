import "./App.css";
import { useState, useRef, useEffect } from "react";
import { BlocklyWorkspace } from "@kuband/react-blockly";
import { javascriptGenerator } from "blockly/javascript";
import * as Blockly from "blockly";

import { setServoRotation } from "./custom_blocks/setRotation";
import { sleep } from "./custom_blocks/sleep";

import Toolbox from "./toolbox";

import Simulation from "./components/simulation";

function App() {
  const [xml, setXml] = useState<string>(localStorage.getItem("blocklyWorkspaceXml") as string | "");
  const [javascriptCode, setJavascriptCode] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

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
        sleep: sleep(signal)
      };
      const evalArgs = Object.keys(evalContext);
      const evalVals = Object.values(evalContext);
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const evalFunction = new AsyncFunction(...evalArgs, javascriptCode);

      await evalFunction(...evalVals);
      console.log("Execution completed");
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
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

  return (
    <>
      <BlocklyWorkspace
        toolboxConfiguration={Toolbox}
        initialXml={xml}
        className="fill-height"
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
      <textarea
        id="code"
        style={{ height: "200px", width: "400px" }}
        value={javascriptCode}
        readOnly
      ></textarea>
      <button onClick={runCode}>Run</button>
      <div style={{ height: 1000 }}>
        <Simulation />
      </div>
    </>
  );
}

export default App;
