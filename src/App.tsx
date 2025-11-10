import "./App.css";
import { useState } from "react";
import { javascriptGenerator } from "blockly/javascript";
import * as Blockly from "blockly";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import BlocklyEditor from "./components/blocklyEditor";
import CodeWindow from "./components/codeWindow";
import Simulation from "./components/simulation";
import { useCodeRunner } from "./hooks/useCodeRunner";
import { useSaving } from "./hooks/useSaving";
import { processAsyncFunctions } from "./utils/processAsyncFunctions";

function App() {
  const [javascriptCode, setJavascriptCode] = useState("");
  const { runCode } = useCodeRunner();
  const { xml, setXml, version, handleSaveFile, handleLoadFile } = useSaving();

  function workspaceDidChange(workspace: Blockly.Workspace) {
    let code = javascriptGenerator.workspaceToCode(workspace);
    code = processAsyncFunctions(code);
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
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}

export default App;
