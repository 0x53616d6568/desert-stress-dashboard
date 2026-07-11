import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({ defaultValue, value, onValueChange, children, className }) {
  const [active, setActive] = React.useState(value || defaultValue);
  React.useEffect(() => {
    if (value !== undefined) setActive(value);
  }, [value]);
  const change = (val) => {
    setActive(val);
    onValueChange?.(val);
  };
  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, { active, onChange: change }) : child
      )}
    </div>
  );
}

export function TabsList({ children, active, onChange, className }) {
  return (
    <div className={cn("inline-flex h-9 w-full items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, { active, onChange }) : child
      )}
    </div>
  );
}

export function TabsTrigger({ value, children, active, onChange, className }) {
  const isActive = active === value;
  return (
    <button
      type="button"
      onClick={() => onChange?.(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-background text-foreground shadow",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, active, className }) {
  if (active !== value) return null;
  return <div className={cn("mt-2", className)}>{children}</div>;
}
