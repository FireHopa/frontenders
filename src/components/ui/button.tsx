import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[0.95rem] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary to-[#4DE8FF] text-primary-foreground shadow-[0_0_30px_rgba(0,200,232,0.6)] hover:brightness-110",
        secondary: "bg-secondary text-secondary-foreground border border-border hover:border-primary/60",
        outline: "border border-primary/40 bg-background hover:bg-primary/10 hover:text-foreground",
        ghost: "border border-primary/40 text-foreground hover:bg-primary/10",
        destructive: "bg-destructive/15 text-destructive border border-destructive/40 shadow-soft hover:bg-destructive/20",
        glass:
          "glass text-foreground shadow-soft hover:bg-background/70",
        accent:
          "bg-gradient-to-br from-primary to-[#4DE8FF] text-primary-foreground shadow-[0_0_30px_rgba(0,200,232,0.6)] hover:brightness-110",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-10 rounded-lg px-4",
        lg: "h-12 rounded-xl px-7 text-[15px]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, loadingLabel, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isLoading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading ? true : undefined}
        {...props}
      >
        {isLoading ? <Spinner className="text-current" label={loadingLabel} /> : children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
