import { useState, useEffect } from "react";

export function useSaving() {
  const [xml, setXml] = useState<string>(
    localStorage.getItem("blocklyWorkspaceXml") || ""
  );
  const [version, setVersion] = useState(0);

  useEffect(() => {
    localStorage.setItem("blocklyWorkspaceXml", xml);
  }, [xml]);

  const handleSaveFile = () => {
    const blob = new Blob([xml], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workspace.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setXml(text);
        localStorage.setItem("blocklyWorkspaceXml", text);
        setVersion((v) => v + 1);
      }
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
