"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
}

const TooltipContext = React.createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
}>({
    open: false,
    setOpen: () => { },
});

const Tooltip = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false);
    return (
        <TooltipContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
                {children}
            </div>
        </TooltipContext.Provider>
    )
}

const TooltipTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
    if (asChild) {
        const child = React.Children.only(props.children) as React.ReactElement<any>;
        return React.cloneElement(child, {
            ...child.props,
            className: cn(child.props.className, className),
        });
    }
    return (
        <button
            ref={ref}
            className={cn(className)}
            {...props}
        />
    )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { sideOffset?: number }
>(({ className, sideOffset = 4, ...props }, ref) => {
    const { open } = React.useContext(TooltipContext);

    if (!open) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                "bottom-full left-1/2 -translate-x-1/2 mb-2", // Simple positioning: Always top centered
                className
            )}
            {...props}
        />
    )
})
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
