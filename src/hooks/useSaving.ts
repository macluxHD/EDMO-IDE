import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useWorkspaceReload } from "./useWorkspaceReload";

interface SaveData {
  xml: string;
  robotConfigId?: string;
}

export function useSaving() {
  const { t } = useTranslation();
  const [xml, setXml] = useState<string>(
    localStorage.getItem("blocklyWorkspaceXml") || ""
  );
  const { reloadWorkspace } = useWorkspaceReload();
  const [robotConfigId, setRobotConfigId] = useState<string>(
    localStorage.getItem("robotConfig") || ""
  );

  useEffect(() => {
    localStorage.setItem("blocklyWorkspaceXml", xml);
  }, [xml]);

  useEffect(() => {
    localStorage.setItem("robotConfig", robotConfigId);
  }, [robotConfigId]);

  const handleSaveFile = useCallback(() => {
    try {
      const saveData: SaveData = {
        xml,
        robotConfigId: robotConfigId || undefined,
      };
      const blob = new Blob([JSON.stringify(saveData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "workspace.edmo.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("save.success"));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(t(`save.error`, { errorMessage }));
      console.error("Save error:", error);
    }
  }, [xml, robotConfigId]);

  const handleLoadFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text === "string") {
            const data: SaveData = JSON.parse(text);

            if (data.xml) {
              setXml(data.xml);
              localStorage.setItem("blocklyWorkspaceXml", data.xml);
              if (data.robotConfigId) {
                setRobotConfigId(data.robotConfigId);
                localStorage.setItem("robotConfig", data.robotConfigId);
              }
              reloadWorkspace();
              toast.success(t("load.success"));
              return;
            }

            throw new Error("Invalid file content");
          } else {
            throw new Error("Invalid file content");
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          toast.error(t("load.error", { errorMessage }));
          console.error("Load error:", error);
        }
      };

      reader.onerror = () => {
        toast.error(t("load.error", { errorMessage: "Failed to read file" }));
        console.error("FileReader error:", reader.error);
      };

      reader.readAsText(file);
      event.target.value = "";
    },
    []
  );

  return {
    xml,
    setXml,
    robotConfigId,
    setRobotConfigId,
    handleSaveFile,
    handleLoadFile,
  };
}
