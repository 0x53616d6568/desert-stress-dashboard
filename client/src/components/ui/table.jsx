import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, children, ...props }) {
  return <div className={cn("w-full overflow-auto", className)} {...props}><table className="w-full caption-bottom text-sm">{children}</table></div>;
}

export function TableHeader({ className, children, ...props }) {
  return <thead className={cn("[&_tr]:border-b", className)} {...props}>{children}</thead>;
}

export function TableBody({ className, children, ...props }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>{children}</tbody>;
}

export function TableRow({ className, children, ...props }) {
  return <tr className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props}>{children}</tr>;
}

export function TableHead({ className, children, ...props }) {
  return <th className={cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground", className)} {...props}>{children}</th>;
}

export function TableCell({ className, children, ...props }) {
  return <td className={cn("p-2 align-middle", className)} {...props}>{children}</td>;
}
