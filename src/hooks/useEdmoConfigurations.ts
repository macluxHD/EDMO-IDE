import { useEffect, useState } from "react";
import type { EdmoConfig } from "../components/simulation/types";

interface UseEdmoConfigurationsResult {
  configurations: EdmoConfig[];
  isLoading: boolean;
  error: string | null;
}

export function useEdmoConfigurations(): UseEdmoConfigurationsResult {
  const [configurations, setConfigurations] = useState<EdmoConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadConfigurations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const manifestRes = await fetch(
          "/EDMO-IDE/edmoConfigurations/manifest.json",
        );
        if (!manifestRes.ok) {
          throw new Error("Failed to load configuration manifest");
        }
        const fileList: string[] = await manifestRes.json();

        const configs = await Promise.all(
          fileList.map(async (file) => {
            const res = await fetch(`/EDMO-IDE/edmoConfigurations/${file}`);
            if (!res.ok) {
              throw new Error(`Failed to load configuration ${file}`);
            }
            const data = await res.json();
            return { ...data, file } as EdmoConfig;
          }),
        );

        if (!isMounted) return;
        setConfigurations(configs);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load configurations";
        setError(message);
        setConfigurations([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadConfigurations();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    configurations,
    isLoading,
    error,
  };
}
