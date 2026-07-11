import * as React from "react";
import { cn } from "@/lib/utils";

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '1rem'
      }}
      onClick={() => onOpenChange?.(false)}
    >
      {children}
    </div>
  );
}

export function DialogContent({ className, children, ...props }) {
  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '28rem',
        maxHeight: 'calc(100vh - 2rem)',
        overflowY: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
      className={cn("rounded-lg border border-border bg-background p-6 shadow-lg", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className, children, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props}>{children}</div>;
}

export function DialogTitle({ className, children, ...props }) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props}>{children}</h2>;
}

export function DialogTrigger({ asChild, children }) {
  return asChild ? children : <span>{children}</span>;
}