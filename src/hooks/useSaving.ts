import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

export function useSaving() {
  const { t } = useTranslation();
  const [xml, setXml] = useState<string>(
    localStorage.getItem("blocklyWorkspaceXml") || ""
  );
  const [version, setVersion] = useState(0);

  useEffect(() => {
    localStorage.setItem("blocklyWorkspaceXml", xml);
  }, [xml]);

  const handleSaveFile = () => {
    try {
      const blob = new Blob([xml], { type: "text/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "workspace.xml";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("save.success"));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(t(`save.error`, { errorMessage }));
      console.error("Save error:", error);
    }
  };

  const handleLoadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === "string") {
          setXml(text);
          localStorage.setItem("blocklyWorkspaceXml", text);
          setVersion((v) => v + 1);
          toast.success(t("load.success"));
        } else {
          throw new Error("Invalid file content");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
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
  };

  return {
    xml,
    setXml,
    version,
    handleSaveFile,
    handleLoadFile,
  };
}
