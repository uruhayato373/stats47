import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";


const itemVariants = cva(
  "flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground shadow-sm",
        outline: "border-border",
        muted: "bg-muted/50",
      },
      size: {
        default: "p-4",
        sm: "p-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof itemVariants> {
  asChild?: boolean;
}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        className={cn(itemVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Item.displayName = "Item";

const ItemGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props} />
));
ItemGroup.displayName = "ItemGroup";

const ItemSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("h-px bg-border", className)} {...props} />
));
ItemSeparator.displayName = "ItemSeparator";

const ItemMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "icon" | "image";
  }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex-shrink-0",
      {
        "flex h-10 w-10 items-center justify-center rounded-md":
          variant === "icon",
        "flex h-10 w-10 items-center justify-center rounded-md bg-muted":
          variant === "default",
        "flex h-10 w-10 items-center justify-center rounded-md overflow-hidden":
          variant === "image",
      },
      className
    )}
    {...props}
  />
));
ItemMedia.displayName = "ItemMedia";

const ItemContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 space-y-1", className)} {...props} />
));
ItemContent.displayName = "ItemContent";

const ItemTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-medium leading-none", className)}
    {...props}
  />
));
ItemTitle.displayName = "ItemTitle";

const ItemDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ItemDescription.displayName = "ItemDescription";

const ItemActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-shrink-0", className)} {...props} />
));
ItemActions.displayName = "ItemActions";

const ItemHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
ItemHeader.displayName = "ItemHeader";

const ItemFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-2", className)}
    {...props}
  />
));
ItemFooter.displayName = "ItemFooter";

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle
};

