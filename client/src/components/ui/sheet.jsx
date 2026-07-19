import * as React from "react";
import { cn } from "@/lib/utils";

const SheetContext = React.createContext({
  open: false,
  onOpenChange: () => {},
});

export function Sheet({ open, onOpenChange, children }) {
  return (
    <SheetContext.Provider value={{ open: Boolean(open), onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetContent({ className, children, side = "left", ...props }) {
  const { open, onOpenChange } = React.useContext(SheetContext);
  if (!open) return null;

  const positionClass = side === "right" ? "right-0" : "left-0";

  return (
    <div className="fixed inset-0 z-50" onClick={() => onOpenChange?.(false)}>
      <div className="fixed inset-0 bg-black/50" />
      <div
        className={cn("fixed inset-y-0 h-full w-3/4 max-w-sm bg-background shadow-2xl", positionClass)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn("h-full overflow-auto p-4", className)} {...props}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function SheetTrigger({ asChild, children }) {
  const { onOpenChange } = React.useContext(SheetContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...children.props,
      onClick: (event) => {
        children.props?.onClick?.(event);
        onOpenChange?.(true);
      },
    });
  }

  return (
    <button type="button" onClick={() => onOpenChange?.(true)}>
      {children}
    </button>
  );
}
