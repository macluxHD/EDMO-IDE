import "./App.css";
import { useState } from "react";
import { javascriptGenerator } from "blockly/javascript";
import * as Blockly from "blockly";

import BlocklyEditor from "./components/blocklyEditor";
import CodeWindow from "./components/codeWindow";
import Simulation from "./components/simulation";
import { useCodeRunner } from "./hooks/useCodeRunner";
import { useSaving } from "./hooks/useSaving";

function App() {
  const [javascriptCode, setJavascriptCode] = useState("");
  const { runCode } = useCodeRunner();
  const { xml, setXml, version, handleSaveFile, handleLoadFile } = useSaving();

  function workspaceDidChange(workspace: Blockly.Workspace) {
    const code = javascriptGenerator.workspaceToCode(workspace);
    setJavascriptCode(code);
  }

  const handleRunCode = () => {
    runCode(javascriptCode);
  };

  return (
    <>
      <div className="container">
        <BlocklyEditor
          xml={xml}
          version={version}
          onWorkspaceChange={workspaceDidChange}
          onXmlChange={setXml}
          onRunCode={handleRunCode}
          onSaveFile={handleSaveFile}
          onLoadFile={handleLoadFile}
        />
        <div className="simulation">
          <Simulation />
        </div>
        <CodeWindow code={javascriptCode} />
      </div>
    </>
  );
}

export default App;
