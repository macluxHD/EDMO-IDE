import { useEffect, useRef, useState } from "react";
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
import { updateServoDropdowns } from "./custom_blocks/setRotation";
import ModelSelectionOverlay from "./components/ModelSelectionOverlay";
import { useEdmoConfigurations } from "./hooks/useEdmoConfigurations";

function getModelIdFromPath(configIds: string[]): string | undefined {
  if (typeof window === "undefined" || configIds.length === 0) return undefined;
  const segments = window.location.pathname.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    if (configIds.includes(segments[i])) {
      return segments[i];
    }
  }
  return undefined;
}

function buildModelPath(modelId: string, configIds: string[]): string {
  if (typeof window === "undefined") {
    return `/${modelId}`;
  }
  const segments = window.location.pathname.split("/").filter(Boolean);
  const filteredSegments = segments.filter(
    (segment) => !configIds.includes(segment),
  );
  const prefix = filteredSegments.length ? `/${filteredSegments.join("/")}` : "";
  return `${prefix}/${modelId}`;
}

function updateUrlWithModel(modelId: string, configIds: string[]) {
  if (typeof window === "undefined") return;
  const newPath = buildModelPath(modelId, configIds);
  const search = window.location.search;
  const hash = window.location.hash;
  const nextUrl = `${newPath}${search}${hash}`;
  const currentUrl = `${window.location.pathname}${search}${hash}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
}

function isEntryRoute(configIds: string[]) {
  if (typeof window === "undefined") return false;
  const segments = window.location.pathname.split("/").filter(Boolean);
  const nonModelSegments = segments.filter(
    (segment) => !configIds.includes(segment),
  );
  return (
    segments.length === nonModelSegments.length &&
    nonModelSegments.length === 1 &&
    nonModelSegments[0] === "EDMO-IDE"
  );
}

function getInitialRobotConfigId() {
  if (typeof window === "undefined") return "";
  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  const isEntryPath = pathSegments.length <= 1;
  if (isEntryPath) {
    return "";
  }
  return localStorage.getItem("robotConfig") || "";
}

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
  } = useSaving(getInitialRobotConfigId());
  const {
    configurations,
    isLoading: configurationsLoading,
    error: configurationError,
  } = useEdmoConfigurations();
  const [isModelSelectionOpen, setModelSelectionOpen] = useState(
    () => !Boolean(robotConfigId),
  );
  const [isManualModelSelectionOpen, setIsManualModelSelectionOpen] =
    useState(false);
  const [entryRoutePending, setEntryRoutePending] = useState(() => {
    if (typeof window === "undefined") return false;
    const segments = window.location.pathname.split("/").filter(Boolean);
    return segments.length <= 1;
  });

  // Horizontal split (Blockly vs right column)
  const [editorFrac, setEditorFrac] = useState<number>(() => {
    const v = Number(localStorage.getItem("edmo_editor_frac"));
    return Number.isFinite(v) && v > 0.15 && v < 0.85 ? v : 0.62;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Vertical split inside right column (Simulation vs Code)
  const [simFrac, setSimFrac] = useState(0.6);
  const sideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!robotConfigId || configurations.length === 0) return;
    const configIds = configurations.map((config) => config.id);
    updateUrlWithModel(robotConfigId, configIds);
  }, [robotConfigId, configurations]);

  useEffect(() => {
    if (!configurations.length) return;
    const configIds = configurations.map((config) => config.id);
    const entryRoute = isEntryRoute(configIds);

    if (entryRoute && entryRoutePending) {
      if (robotConfigId) {
        setRobotConfigId("");
      }
      return;
    }

    if (!entryRoute && entryRoutePending) {
      setEntryRoutePending(false);
    }

    if (robotConfigId && !configIds.includes(robotConfigId)) {
      setRobotConfigId("");
      return;
    }

    const urlModelId = getModelIdFromPath(configIds);
    if (urlModelId && urlModelId !== robotConfigId) {
      setRobotConfigId(urlModelId);
      return;
    }

    if (!robotConfigId && !entryRoute) {
      setRobotConfigId(configurations[0].id);
    }
  }, [configurations, robotConfigId, setRobotConfigId, entryRoutePending]);

  useEffect(() => {
    if (!robotConfigId && configurations.length) {
      setModelSelectionOpen(true);
      setIsManualModelSelectionOpen(false);
    }
  }, [robotConfigId, configurations.length]);

  useEffect(() => {
    if (
      !robotConfigId ||
      !isModelSelectionOpen ||
      isManualModelSelectionOpen
    ) {
      return;
    }
    setModelSelectionOpen(false);
    setIsManualModelSelectionOpen(false);
  }, [robotConfigId, isModelSelectionOpen, isManualModelSelectionOpen]);

  const openModelSelectionModal = () => {
    setIsManualModelSelectionOpen(true);
    setModelSelectionOpen(true);
  };

  const handleModelSelection = (configId: string) => {
    setEntryRoutePending(false);
    setRobotConfigId(configId);
    setModelSelectionOpen(false);
    setIsManualModelSelectionOpen(false);
  };

  useEffect(() => {
    if (!robotConfigId || configurations.length === 0) return;
    const configIds = configurations.map((config) => config.id);
    updateUrlWithModel(robotConfigId, configIds);
  }, [robotConfigId, configurations]);

  function workspaceDidChange(workspace: Blockly.Workspace) {
    setWorkspace(workspace);

    const allBlocks = workspace.getAllBlocks(false);
    const startBlocks = allBlocks.filter((block) => block.type === "start");

    if (!javascriptGenerator.isInitialized) javascriptGenerator.init(workspace);

    setTimeout(() => updateServoDropdowns(), 100);

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
      stopCode(workspace, false); // Don't reset limbs when stopping to restart
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
            workspace={workspace}
            onWorkspaceChange={workspaceDidChange}
            onXmlChange={setXml}
            onRunCode={handleRunCode}
            onStopCode={() => workspace && stopCode(workspace, true)}
            onSaveFile={handleSaveFile}
            onLoadFile={handleLoadFile}
            onReloadWorkspace={reloadWorkspace}
            modelId={robotConfigId}
            onOpenModelSelection={openModelSelectionModal}
          />

        <div className="col-resizer" onMouseDown={startColDrag} />

        <div
          className="side-panels"
          ref={sideRef}
          style={{
            gridTemplateRows: `minmax(0, ${simFrac}fr) 6px minmax(0, ${
              1 - simFrac
            }fr)`,
          }}
        >
          <section className="panel">
            <header className="panel-header">{t("simulation.title")}</header>
            <div className="panel-body simulation">
              <Simulation
                configId={robotConfigId}
                configurations={configurations}
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
      <ModelSelectionOverlay
        isOpen={isModelSelectionOpen}
        configurations={configurations}
        isLoading={configurationsLoading}
        error={configurationError}
        onModelSelect={handleModelSelection}
      />
      <RobotConnection />
      <GlobalOverlays
        infiniteLoopState={infiniteLoopState}
        onCloseInfiniteLoopWarning={handleCloseWarning}
      />
    </>
  );
}

export default App;
