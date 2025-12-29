import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { Button as ShadcnButton } from "@/components/ui/button";
import { soundService } from "@/lib/sounds";

export const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold uppercase tracking-[0.3em] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 overflow-hidden group/btn",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--hud-glow)] hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-[var(--destructive)] text-[var(--destructive-foreground)] shadow-[0_0_15px_rgba(255,0,60,0.3)]",
        outline:
          "border border-[var(--primary)]/40 bg-transparent text-[var(--primary)] hover:bg-[var(--primary)]/10",
        secondary:
          "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/90",
        ghost: "hover:bg-[var(--primary)]/10 text-[var(--foreground)]",
        link: "text-[var(--primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-8 py-3",
        sm: "h-10 px-6 text-[10px]",
        lg: "h-14 px-12 text-base",
        icon: "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

function Button({ children, asChild, className, variant, size, ...props }: BitButtonProps) {
  return (
    <ShadcnButton
      {...props}
      className={cn(buttonVariants({ variant, size, className }), "rounded-none")}
      size={size}
      variant={variant}
      asChild={asChild}
      onMouseEnter={() => soundService.play('hover')}
      onClick={(e) => {
        soundService.play('click')
        props.onClick?.(e)
      }}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>

      {/* HUD Split-Border Brackets */}
      {variant !== 'link' && variant !== 'ghost' && (
        <>
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/40 group-hover/btn:border-white transition-colors" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/40 group-hover/btn:border-white transition-colors" />

          {/* Energy Swipe Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />

          {/* Subtle Scanline inside button */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px)] bg-[length:100%_3px]" />
        </>
      )}
    </ShadcnButton>
  );
}

export { Button };
