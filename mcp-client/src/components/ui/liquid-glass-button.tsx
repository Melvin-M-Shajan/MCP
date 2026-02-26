"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

export const liquidButtonVariants = cva(
    "inline-flex items-center group justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
    {
        variants: {
            variant: {
                default:
                    "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]",
                destructive:
                    "bg-red-500/20 text-red-100 border border-red-500/30 hover:bg-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]",
                outline:
                    "border border-white/10 bg-transparent hover:bg-white/5 text-white backdrop-blur-sm",
                ghost: "hover:bg-white/10 hover:text-white text-white/80 shadow-none",
                liquid:
                    "bg-white/10 text-white border border-white/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:border-white/50 overflow-hidden",
            },
            size: {
                default: "h-11 px-6 py-2",
                sm: "h-9 rounded-lg px-4",
                lg: "h-14 rounded-2xl px-8 text-base",
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
    extends Omit<HTMLMotionProps<"button">, "disabled" | "ref">,
    VariantProps<typeof liquidButtonVariants> {
    asChild?: boolean;
    isLoading?: boolean;
    disabled?: boolean;
}

const LiquidGlassButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            asChild = false,
            isLoading = false,
            disabled = false,
            children,
            ...props
        },
        ref
    ) => {
        if (asChild) {
            return (
                <Slot
                    className={cn(liquidButtonVariants({ variant, size, className }))}
                    ref={ref as any}
                    {...(props as any)}
                >
                    {children}
                </Slot>
            );
        }

        return (
            <motion.button
                ref={ref}
                className={cn(liquidButtonVariants({ variant, size, className }), {
                    "cursor-not-allowed opacity-50": disabled || isLoading,
                })}
                disabled={disabled || isLoading}
                whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
                whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
                {...props}
            >
                {/* Animated fluid background for liquid variant */}
                {variant === "liquid" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 blur-xl mix-blend-overlay" />
                )}

                {/* Shimmer effect across the button */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shimmer" />

                {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-white/80" />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {children as React.ReactNode}
                </span>
            </motion.button>
        );
    }
);
LiquidGlassButton.displayName = "LiquidGlassButton";

export { LiquidGlassButton };
