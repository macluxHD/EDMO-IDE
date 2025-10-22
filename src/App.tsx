import "./App.css";
import { useState } from "react";
import { BlocklyWorkspace } from "@kuband/react-blockly";
import { javascriptGenerator } from 'blockly/javascript';
import * as Blockly from "blockly";

import Toolbox from "./toolbox";

function App() {
  const [xml, setXml] = useState<string>("");
  const [javascriptCode, setJavascriptCode] = useState("");

  function workspaceDidChange(workspace: Blockly.Workspace) {
    const code = javascriptGenerator.workspaceToCode(workspace);
    setJavascriptCode(code);
  }


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
    </>
  );
}

export default App;
