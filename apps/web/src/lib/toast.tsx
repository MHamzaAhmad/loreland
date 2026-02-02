import * as React from "react";
import { toast } from "sonner";
import { Coin, Sparkle } from "@phosphor-icons/react";

/**
 * Custom toast helpers for consistent UI
 * 
 * Matches the design language: warm colors, amber accents for credits
 */
export const customToast = {
  /**
   * Success toast with optional credit amount badge
   */
  success: (message: string, credits?: number) => {
    toast.success(message, {
      icon: credits ? (
        <div className="flex items-center gap-1">
          <Coin className="w-4 h-4 text-amber-500" weight="fill" />
          <span className="text-xs font-bold text-amber-600">+{credits.toLocaleString()}</span>
        </div>
      ) : undefined,
    });
  },

  /**
   * Error toast
   */
  error: (message: string) => {
    toast.error(message);
  },

  /**
   * Info toast with sparkle icon
   */
  info: (message: string) => {
    toast(message, {
      icon: <Sparkle className="w-4 h-4 text-amber-500" weight="fill" />,
    });
  },

  /**
   * Purchase complete toast with credit amount
   */
  purchaseComplete: (credits: number) => {
    toast.success(`Added ${credits.toLocaleString()} credits!`, {
      icon: <Coin className="w-4 h-4 text-amber-500" weight="fill" />,
      duration: 5000,
    });
  },

  /**
   * Low credits warning
   */
  lowCredits: (currentBalance: number) => {
    toast.warning(`Low credits: ${currentBalance} remaining`, {
      icon: <Coin className="w-4 h-4 text-rose-500" weight="fill" />,
      duration: 4000,
    });
  },
};

/**
 * Re-export toast for direct use
 */
export { toast };
