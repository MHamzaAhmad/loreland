import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Input as ShadcnInput } from "@/components/ui/input";

export const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        ghost: "border-none shadow-none focus-visible:ring-0 px-0",
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
    <ShadcnInput
      {...props}
      className={cn(inputVariants({ variant }), className)}
    />
  );
}

export { Input };
