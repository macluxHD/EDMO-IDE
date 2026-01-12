import { useState } from "react";

export function useWorkspaceReload() {
  const [version, setVersion] = useState(0);

  const reloadWorkspace = () => {
    setVersion((v) => v + 1);
  };

  return {
    version,
    reloadWorkspace,
  };
}
