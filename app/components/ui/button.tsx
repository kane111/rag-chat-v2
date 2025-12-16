"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
type Size = "sm" | "default" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const variantClasses: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground shadow hover:bg-primary",
  secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary",
  outline: "border border-input bg-background hover:bg-accent hover:text-foreground",
  ghost: "hover:bg-accent hover:text-foreground",
  destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 rounded-md px-3 text-sm",
  default: "h-10 px-4 py-2",
  lg: "h-11 rounded-md px-8 text-base",
  icon: "h-10 w-10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed active:translate-y-[1px] ring-offset-background",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref as any}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
