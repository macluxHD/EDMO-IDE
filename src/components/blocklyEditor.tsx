import { useRef, useMemo } from "react";
import { BlocklyWorkspace } from "@kuband/react-blockly";
import * as Blockly from "blockly";
import Toolbox from "../toolbox";
import logoUrl from "../assets/edmo-logo.png";

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

  // Custom theme
  const edmoTheme = useMemo(() => {
    const opts: any = {
      base: Blockly.Themes.Classic,
      componentStyles: {
        workspaceBackgroundColour: "#f6f7f9",
        toolboxBackgroundColour: "#e7e7e7",
        toolboxForegroundColour: "#222222",
        flyoutBackgroundColour: "#f1f1f1",
        flyoutForegroundColour: "#222222",
        flyoutOpacity: 1,
        scrollbarColour: "#a8a8a8",
        scrollbarOpacity: 0.7,
        insertionMarkerColour: "#df2323",
        insertionMarkerOpacity: 0.5,
        cursorColour: "#df2323",
        selectedGlowColour: "#df2323",
        replacementGlowColour: "#df2323",
      },
      categoryStyles: {
        logic_category: { colour: "#6aa84f" },
        loop_category: { colour: "#f6b26b" },
        math_category: { colour: "#3d85c6" },
        text_category: { colour: "#8e7cc3" },
        list_category: { colour: "#cc0000" },
        variable_category: { colour: "#ff9900" },
        procedure_category: { colour: "#38761d" },
      },
      fontStyle: {
        family: "Inter, system-ui, Segoe UI, Roboto, sans-serif",
        weight: "400",
        size: 12,
      },
      startHats: true,
    };
    return Blockly.Theme.defineTheme("edmoTheme", opts);
  }, []);

  return (
    <div className="editor-wrapper">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <img src={logoUrl} alt="EDMO Logo" className="editor-logo" />
        <div className="toolbar-buttons">
          <button onClick={onRunCode}>Run</button>
          <button onClick={onSaveFile}>Save as file</button>
          <button onClick={() => fileInputRef.current?.click()}>
            Load from file
          </button>
          <input
            type="file"
            accept=".edmo.json"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={onLoadFile}
          />
        </div>
      </div>

      {/* Blockly canvas */}
      <div className="editor-canvas">
        <BlocklyWorkspace
          key={version}
          toolboxConfiguration={Toolbox}
          initialXml={xml}
          className="workspace"
          workspaceConfiguration={{
            theme: edmoTheme,
            renderer: "geras",
            grid: { spacing: 24, length: 3, colour: "#5f5f5fff", snap: true },
            zoom: { controls: true, wheel: true },
            move: { scrollbars: true, drag: true, wheel: true },
          }}
          onWorkspaceChange={onWorkspaceChange}
          onXmlChange={onXmlChange}
        />
      </div>
    </div>
  );
}
