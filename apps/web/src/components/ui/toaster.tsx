import { Toaster as SonnerToaster } from "sonner";
import { Sparkle, Warning, CheckCircle } from "@phosphor-icons/react";

/**
 * Toaster component with custom styling matching the design language
 * 
 * Warm paper background, dashed borders, amber accents for credits
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: "#fcfbf9", // warm paper background
          border: "1px dashed rgba(120, 113, 108, 0.2)", // dashed border
          color: "#1c1917",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "14px",
        },
        className: "font-sans",
      }}
      icons={{
        success: <CheckCircle className="w-4 h-4 text-emerald-500" weight="fill" />,
        error: <Warning className="w-4 h-4 text-rose-500" weight="fill" />,
        info: <Sparkle className="w-4 h-4 text-amber-500" weight="fill" />,
      }}
    />
  );
}
