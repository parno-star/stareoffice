import { useState, useEffect } from "react";

export function useDbData<T>(url: string, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status}`);
        }
        const json = await res.json();
        if (isMounted) {
          setData(json);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(message);
          setIsLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [url]);

  return {
    data,
    isLoading,
    error,
    refetch: () =>
      fetch(url)
        .then((r) => r.json())
        .then(setData)
        .catch((err) => console.error("Refetch error:", err)),
  };
}
