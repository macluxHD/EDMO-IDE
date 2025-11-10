import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export function useSaving() {
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
      toast.success("Workspace saved successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to save file: ${errorMessage}`);
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
          toast.success("Workspace loaded successfully");
        } else {
          throw new Error("Invalid file content");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(`Failed to load file: ${errorMessage}`);
        console.error("Load error:", error);
      }
    };
    
    reader.onerror = () => {
      toast.error("Failed to read file");
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
