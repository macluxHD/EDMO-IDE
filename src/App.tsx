import { useRef, useState } from "react";
import { javascriptGenerator } from "blockly/javascript";
import * as Blockly from "blockly";

import BlocklyEditor from "./components/blocklyEditor";
import CodeWindow from "./components/codeWindow";
import Simulation from "./components/simulation/Simulation";
import { RobotConnection } from "./components/RobotConnection";
import { useCodeRunner } from "./hooks/useCodeRunner";
import { useSaving } from "./hooks/useSaving";
import GlobalOverlays from "./components/overlays/GlobalOverlays";
import { useTranslation } from "react-i18next";
import { useWorkspaceReload } from "./hooks/useWorkspaceReload";

function App() {
  const { t } = useTranslation();
  const [javascriptCode, setJavascriptCode] = useState<string | string[]>("");
  const [workspace, setWorkspace] = useState<Blockly.Workspace | null>(null);
  const { runCodes, infiniteLoopState, stopCode, handleCloseWarning } =
    useCodeRunner();
  const { version, reloadWorkspace } = useWorkspaceReload();
  const {
    xml,
    setXml,
    robotConfigId,
    setRobotConfigId,
    handleSaveFile,
    handleLoadFile,
  } = useSaving();

  // Horizontal split (Blockly vs right column)
  const [editorFrac, setEditorFrac] = useState<number>(() => {
    const v = Number(localStorage.getItem("edmo_editor_frac"));
    return Number.isFinite(v) && v > 0.15 && v < 0.85 ? v : 0.62;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Vertical split inside right column (Simulation vs Code)
  const [simFrac, setSimFrac] = useState(0.6);
  const sideRef = useRef<HTMLDivElement>(null);

  function workspaceDidChange(workspace: Blockly.Workspace) {
    setWorkspace(workspace);

    const allBlocks = workspace.getAllBlocks(false);
    const startBlocks = allBlocks.filter((block) => block.type === "start");

    if (!javascriptGenerator.isInitialized) javascriptGenerator.init(workspace);

    let newCode: string | string[];
    if (startBlocks.length > 1) {
      // Generate code for each start block separately
      const codes = startBlocks
        .map((block) => {
          const code = javascriptGenerator.blockToCode(block);
          return Array.isArray(code) ? code[0] : code;
        })
        .filter((code) => code.trim().length > 0);

      newCode = codes.length > 0 ? codes : "";
    } else {
      // Single or no start block - use default behavior
      newCode = javascriptGenerator.workspaceToCode(workspace);
    }

    // Only update if the code has actually changed
    setJavascriptCode((prevCode) => {
      const prevStr = Array.isArray(prevCode) ? prevCode.join("\n") : prevCode;
      const newStr = Array.isArray(newCode) ? newCode.join("\n") : newCode;
      return prevStr === newStr ? prevCode : newCode;
    });
  }
  const handleRunCode = () => {
    if (workspace) {
      stopCode(workspace);
      runCodes(workspace);
    }
  };

  // Column drag
  const startColDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(ev.clientX - r.left, 160), r.width - 260);
      const f = x / r.width;
      const clamped = Math.min(0.85, Math.max(0.15, f));
      setEditorFrac(clamped);
      localStorage.setItem("edmo_editor_frac", String(clamped));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Row drag
  const startRowDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      if (!sideRef.current) return;
      const r = sideRef.current.getBoundingClientRect();
      const y = Math.min(Math.max(ev.clientY - r.top, 40), r.height - 40);
      const f = y / r.height;
      setSimFrac(Math.min(0.9, Math.max(0.1, f)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <>
      <div
        className="container"
        ref={containerRef}
        style={{
          gridTemplateColumns: `${editorFrac * 100}% 8px ${
            (1 - editorFrac) * 100
          }%`,
        }}
      >
        <BlocklyEditor
          xml={xml}
          version={version}
          onWorkspaceChange={workspaceDidChange}
          onXmlChange={setXml}
          onRunCode={handleRunCode}
          onStopCode={() => workspace && stopCode(workspace)}
          onSaveFile={handleSaveFile}
          onLoadFile={handleLoadFile}
          onReloadWorkspace={reloadWorkspace}
        />

        <div className="col-resizer" onMouseDown={startColDrag} />

        <div
          className="side-panels"
          ref={sideRef}
          style={{
            gridTemplateRows: `${simFrac * 100}% 6px ${(1 - simFrac) * 100}%`,
          }}
        >
          <section className="panel">
            <header className="panel-header">{t("simulation.title")}</header>
            <div className="panel-body simulation">
              <Simulation
                configId={robotConfigId}
                onConfigChange={setRobotConfigId}
              />
            </div>
          </section>

          <div className="row-resizer" onMouseDown={startRowDrag} />

          <section className="panel">
            <header className="panel-header">{t("codeWindow.title")}</header>
            <div className="panel-body code">
              <CodeWindow code={javascriptCode} />
            </div>
          </section>
        </div>
      </div>
      <RobotConnection />
      <GlobalOverlays
        infiniteLoopState={infiniteLoopState}
        onCloseInfiniteLoopWarning={handleCloseWarning}
      />
    </>
  );
}

export default App;
