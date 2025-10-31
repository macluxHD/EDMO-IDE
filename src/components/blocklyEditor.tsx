import { useRef } from "react";
import { BlocklyWorkspace } from "@kuband/react-blockly";
import * as Blockly from "blockly";
import Toolbox from "../toolbox";

interface BlocklyEditorProps {
  xml: string;
  version: number;
  onWorkspaceChange: (workspace: Blockly.Workspace) => void;
  onXmlChange: (xml: string) => void;
  onRunCode: () => void;
  onSaveFile: () => void;
  onLoadFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function BlocklyEditor({
  xml,
  version,
  onWorkspaceChange,
  onXmlChange,
  onRunCode,
  onSaveFile,
  onLoadFile,
}: BlocklyEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="controls">
        <button onClick={onRunCode}>Run</button>
        <button onClick={onSaveFile}>Save as file</button>
        <button onClick={() => fileInputRef.current?.click()}>
          Load from file
        </button>
        <input
          type="file"
          accept=".xml"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={onLoadFile}
        />
      </div>
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
          onWorkspaceChange={onWorkspaceChange}
          onXmlChange={onXmlChange}
        />
      </div>
    </>
  );
}
