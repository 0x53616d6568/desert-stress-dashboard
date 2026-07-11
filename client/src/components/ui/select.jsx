import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ value, onValueChange, defaultValue, children }) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(value || defaultValue || "");

  React.useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  const handle = (val) => {
    setSelected(val);
    onValueChange?.(val);
    setOpen(false);
  };

  const selectedLabel = React.useMemo(() => {
    const findLabel = (items) => {
      for (const item of items) {
        if (!React.isValidElement(item)) continue;
        if (item.type === SelectItem && item.props.value === selected) return item.props.children;
        const childLabel = findLabel(React.Children.toArray(item.props.children));
        if (childLabel) return childLabel;
      }
      return null;
    };
    return findLabel(React.Children.toArray(children));
  }, [children, selected]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className="truncate">{selectedLabel || selected || "Select..."}</span>
        <span className="ml-2 text-muted-foreground">▼</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          {React.Children.map(children, (child) =>
            React.isValidElement(child) && child.type === SelectContent
              ? React.cloneElement(child, { onSelect: handle, selected })
              : null
          )}
        </div>
      )}
    </div>
  );
}

export function SelectContent({ children, onSelect, selected }) {
  return (
    <div className="py-1">
      {React.Children.map(children, (child) =>
        React.isValidElement(child) && child.type === SelectItem
          ? React.cloneElement(child, { onSelect, selected })
          : child
      )}
    </div>
  );
}

export function SelectItem({ value, children, onSelect, selected }) {
  return (
    <div
      className={cn(
        "cursor-pointer px-3 py-2 text-sm hover:bg-muted",
        selected === value && "bg-muted"
      )}
      onClick={() => onSelect?.(value)}
    >
      {children}
    </div>
  );
}

export function SelectTrigger({ children }) {
  return <>{children}</>;
}

export function SelectValue({ placeholder }) {
  return <span>{placeholder}</span>;
}
