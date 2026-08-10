import { useEffect } from "react";
import { useToast } from "./use-toast";

export function useAppUpdate() {
  const { toast } = useToast();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const handleControllerChange = () => {
      toast({
        title: "App Updated",
        description: "New version is ready. Refresh to see the latest features.",
        variant: "default",
        action: {
          label: "Refresh",
          onClick: () => window.location.reload(),
        },
        duration: 0, // Keep toast visible until user acts
      });
    };

    const checkForUpdates = async () => {
      try {
        registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        // Listen for controller change (new SW activated)
        navigator.serviceWorker.controller?.addEventListener(
          "controllerchange",
          handleControllerChange
        );

        // Check for updates periodically
        const checkUpdate = async () => {
          try {
            await registration?.update();
          } catch (error) {
            console.debug("Service worker update check failed:", error);
          }
        };

        // Check immediately
        checkUpdate();

        // Check every 30 seconds
        const interval = setInterval(checkUpdate, 30000);

        return () => {
          clearInterval(interval);
          navigator.serviceWorker.controller?.removeEventListener(
            "controllerchange",
            handleControllerChange
          );
        };
      } catch (error) {
        console.debug("Service worker check failed:", error);
      }
    };

    const cleanup = checkForUpdates();
    return () => {
      cleanup?.then((fn) => fn?.());
    };
  }, [toast]);
}
