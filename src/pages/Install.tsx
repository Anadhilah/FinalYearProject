import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <img src="/icon-192x192.png" alt="InternshipConnect" className="w-20 h-20 mx-auto mb-4 rounded-2xl" />
          <CardTitle className="text-2xl">Install InternshipConnect</CardTitle>
          <p className="text-muted-foreground mt-2">
            Add to your home screen for a native app experience — no app store needed.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-medium">App is already installed!</p>
              <Link to="/">
                <Button>Open App</Button>
              </Link>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} className="w-full" size="lg">
              <Download className="mr-2 h-5 w-5" />
              Install App
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <Smartphone className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium text-sm">iOS (Safari)</p>
                  <p className="text-xs text-muted-foreground">
                    Tap the Share button → "Add to Home Screen"
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <Monitor className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Android / Desktop (Chrome)</p>
                  <p className="text-xs text-muted-foreground">
                    Tap the menu (⋮) → "Install app" or "Add to Home Screen"
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to app
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
