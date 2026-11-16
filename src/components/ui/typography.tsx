/* eslint-disable react-refresh/only-export-components */
/**
 * Enforced typography API.
 *
 * Responsive pairing convention:
 *   display → "text-h1 md:text-display" (use the `responsive` prop on Heading)
 *   h1      → "text-h2 md:text-h1"
 *
 * Raw `text-h1`/`text-body` utilities exist for edge cases, but pages should
 * compose <Heading> and <Text> so hierarchy stays consistent.
 */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const headingVariants = cva("text-foreground", {
  variants: {
    level: {
      display: "text-display",
      h1: "text-h1",
      h2: "text-h2",
      h3: "text-h3",
      h4: "text-h4",
    },
    responsive: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    { level: "display", responsive: true, className: "text-h1 md:text-display" },
    { level: "h1", responsive: true, className: "text-h2 md:text-h1" },
    { level: "h2", responsive: true, className: "text-h3 md:text-h2" },
  ],
  defaultVariants: {
    level: "h2",
    responsive: false,
  },
});

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "span";

const defaultTagForLevel: Record<NonNullable<VariantProps<typeof headingVariants>["level"]>, HeadingElement> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
};

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  /** Override the rendered element while keeping the visual level. */
  as?: HeadingElement;
  asChild?: boolean;
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = "h2", responsive, as, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : (as ?? defaultTagForLevel[level ?? "h2"]);
    return (
      <Comp ref={ref} className={cn(headingVariants({ level, responsive }), className)} {...props} />
    );
  },
);
Heading.displayName = "Heading";

const textVariants = cva("", {
  variants: {
    variant: {
      "body-lg": "text-body-lg",
      body: "text-body",
      "body-sm": "text-body-sm",
      caption: "text-caption",
      overline: "text-overline uppercase",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      subtle: "text-muted-foreground/70",
    },
  },
  defaultVariants: {
    variant: "body",
    tone: "default",
  },
});

type TextElement = "p" | "span" | "div" | "label" | "figcaption";

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: TextElement;
  asChild?: boolean;
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, tone, as = "p", asChild = false, ...props }, ref) => {
    // `as` is a union of elements, so the ref can't be typed per element; the
    // public ref type stays HTMLParagraphElement.
    const Comp = (asChild ? Slot : as) as React.ElementType;
    return <Comp ref={ref} className={cn(textVariants({ variant, tone }), className)} {...props} />;
  },
);
Text.displayName = "Text";

export { Heading, Text, headingVariants, textVariants };
