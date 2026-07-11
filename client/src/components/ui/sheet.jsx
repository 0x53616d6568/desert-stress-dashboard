import * as React from "react";
import { cn } from "@/lib/utils";

export function Sheet({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" onClick={() => onOpenChange?.(false)}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-y-0 left-0 h-full w-3/4 max-w-sm bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function SheetContent({ className, children, side = "left", ...props }) {
  return (
    <div className={cn("h-full overflow-auto p-4", className)} {...props}>
      {children}
    </div>
  );
}

export function SheetTrigger({ asChild, children }) {
  return asChild ? children : <span>{children}</span>;
}
