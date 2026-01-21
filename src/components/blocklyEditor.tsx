import { useRef, useMemo } from "react";
import { BlocklyWorkspace } from "@kuband/react-blockly";
import * as Blockly from "blockly";
import createToolboxConfiguration from "../toolbox";
import logoUrl from "../assets/edmo-logo.png";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";

interface BlocklyEditorProps {
  xml: string;
  version: number;
  workspace: Blockly.Workspace | null;
  onWorkspaceChange: (workspace: Blockly.Workspace) => void;
  onXmlChange: (xml: string) => void;
  onRunCode: () => void;
  onStopCode: () => void;
  onSaveFile: () => void;
  onLoadFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReloadWorkspace: () => void;
  modelId?: string;
  onOpenModelSelection: () => void;
}

export default function BlocklyEditor({
  xml,
  version,
  workspace,
  onWorkspaceChange,
  onXmlChange,
  onRunCode,
  onStopCode,
  onSaveFile,
  onLoadFile,
  onReloadWorkspace,
  modelId,
  onOpenModelSelection,
}: BlocklyEditorProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolboxConfiguration = useMemo(
    () => createToolboxConfiguration(modelId),
    [modelId],
  );

  // Custom theme
  const edmoTheme = useMemo(() => {
    const opts = {
      name: "edmoTheme",
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
        <div className="toolbar-icons-left">
          <button
            onClick={() => workspace?.undo(false)}
            disabled={!workspace}
            title="Undo (Ctrl+Z)"
          >
            {t("undo")}
          </button>
          <button
            onClick={() => workspace?.undo(true)}
            disabled={!workspace}
            title="Redo (Ctrl+Y)"
          >
            {t("redo")}
          </button>
        </div>
        <div className="toolbar-buttons">
          <button onClick={onRunCode}>{t("run")}</button>
          <button onClick={onStopCode}>{t("stop")}</button>
          <div className="toolbar-divider" />
          <button onClick={onSaveFile}>{t("save.button")}</button>
          <button onClick={() => fileInputRef.current?.click()}>
            {t("load.button")}
          </button>
          <button onClick={onOpenModelSelection}>
            {t("modelSelection.changeButton")}
          </button>
          <input
            type="file"
            accept=".edmo.json"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={onLoadFile}
          />
        </div>
        <LanguageSelector onReloadWorkspace={onReloadWorkspace} />
      </div>

      {/* Blockly canvas */}
      <div className="editor-canvas">
        <BlocklyWorkspace
          key={version}
          toolboxConfiguration={toolboxConfiguration}
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
