import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-indigo disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-chart-indigo text-white hover:bg-chart-indigo/90",
        ghost: "text-text-secondary hover:bg-border/60 hover:text-text-primary",
        outline: "border border-border text-text-primary hover:bg-border/40",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
