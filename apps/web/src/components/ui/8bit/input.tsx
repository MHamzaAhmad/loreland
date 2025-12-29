import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { Input as ShadcnInput } from "@/components/ui/input";

export const inputVariants = cva(
  "w-full bg-transparent border-b border-[var(--primary)]/30 px-4 py-2 text-sm font-bold tracking-[0.2em] placeholder:text-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none transition-all",
  {
    variants: {
      variant: {
        default: "",
        ghost: "border-none px-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BitInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
  VariantProps<typeof inputVariants> { }

function Input({ className, variant, ...props }: BitInputProps) {
  return (
    <div className="relative w-full group/input">
      <ShadcnInput
        {...props}
        className={cn(inputVariants({ variant }), "rounded-none", className)}
      />

      {/* HUD-Focus line */}
      <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--primary)] group-focus-within:w-full transition-all duration-700 shadow-[var(--hud-glow)]" />

      {/* Decorative dots */}
      <div className="absolute -bottom-1 left-0 flex gap-1 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500">
        <div className="size-0.5 bg-[var(--primary)]" />
        <div className="size-0.5 bg-[var(--primary)]/50" />
        <div className="size-0.5 bg-[var(--primary)]/20" />
      </div>
    </div>
  );
}

export { Input };
