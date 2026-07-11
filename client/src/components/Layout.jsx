import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/providers/AuthProvider";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { listAlerts } from "@/services/api";
import anime from "animejs";
import {
  Activity,
  LayoutDashboard,
  Map as MapIcon,
  Users,
  Cpu,
  Bell,
  BrainCircuit,
  Database,
  HardDrive,
  Stethoscope,
  HelpCircle,
  Moon,
  Sun,
  LogOut,
  Wifi,
  WifiOff,
  ShieldAlert,
  AlertTriangle,
  Info,
  Menu,
  Search,
} from "lucide-react";

function UserAvatar({ name }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary border border-primary/30 shrink-0">
      {initials}
    </div>
  );
}

function GatewayStatus() {
  const { isConnected } = useWebSocket();
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card/60 border border-border/30">
      <span className="relative flex h-2.5 w-2.5">
        {isConnected ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        )}
      </span>
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {isConnected ? "Gateway Online" : "Gateway Offline"}
      </span>
      {isConnected ? <Wifi className="h-3 w-3 text-emerald-500 ml-auto" /> : <WifiOff className="h-3 w-3 text-red-500 ml-auto" />}
    </div>
  );
}

function AlertBadge() {
  const [count, setCount] = useState(0);
  const { lastAlert } = useWebSocket();
  const [location] = useLocation();

  useEffect(() => {
    let mounted = true;
    const load = () => {
      listAlerts({ acknowledged: "false", limit: "50" })
        .then((alerts) => mounted && setCount(alerts.length))
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [lastAlert, location]);

  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-card/60 border border-border/30">
      <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
      <span className="text-[10px] font-mono uppercase text-muted-foreground">Alerts</span>
      <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 h-4 font-mono ml-auto">
        {count}
      </Badge>
    </div>
  );
}

function SidebarNav({ isActive, onItemClick }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const mainItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/map", icon: MapIcon, label: "Live Map" },
    { path: "/telemetry", icon: Activity, label: "Telemetry" },
    { path: "/subjects", icon: Users, label: "Subjects" },
    { path: "/devices", icon: Cpu, label: "Devices" },
    { path: "/alerts", icon: Bell, label: "Alerts" },
  ];
  const adminItems = [
    { path: "/admin/ai-models", icon: BrainCircuit, label: "AI Models" },
    { path: "/admin/datasets", icon: Database, label: "Datasets" },
    { path: "/admin/firmware", icon: HardDrive, label: "Firmware" },
    { path: "/admin/inference-health", icon: Stethoscope, label: "Inference Health" },
  ];

  const NavLink = ({ item }) => (
    <Link
      href={item.path}
      onClick={onItemClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive(item.path) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );

  return (
    <div className="flex h-full flex-col p-4">
      <div className="border-b border-border/50 pb-4 mb-4">
        <div className="flex items-center gap-2 font-mono font-bold tracking-tight text-primary">
          <Activity className="h-5 w-5" />
          <span className="hidden lg:inline">DSM-CONTROL</span>
          <span className="lg:hidden">DSM</span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live telemetry active
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-6">
        <div>
          <p className="mb-2 px-3 text-xs font-mono uppercase text-muted-foreground">Main</p>
          <div className="space-y-1">
            {mainItems.map((item) => <NavLink key={item.path} item={item} />)}
          </div>
        </div>
        <div>
          <p className="mb-2 px-3 text-xs font-mono uppercase text-muted-foreground">Admin</p>
          <div className="space-y-1">
            {adminItems.map((item) => <NavLink key={item.path} item={item} />)}
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-4 mt-4 space-y-2">
        <GatewayStatus />
        <AlertBadge />

        <Link
          href="/help"
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive("/help") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Help</span>
        </Link>

        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar name={user?.name || "Operator"} />
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-xs font-semibold truncate">{user?.name || "Operator"}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{user?.role || "operator"}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 font-mono"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {theme === "dark" ? "Light" : "Dark"}
          </Button>
          <Button variant="destructive" size="sm" className="flex-1 font-mono" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

export function Layout({ children }) {
  const [location] = useLocation();
  const isActive = (path) => location === path;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) return;
    anime({
      targets: contentRef.current.children[0],
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 400,
      easing: "easeOutCubic",
    });
  }, [location]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <div className="hidden md:flex md:w-64 lg:w-72 shrink-0 border-r border-border/50 bg-sidebar h-full">
        <SidebarNav isActive={isActive} onItemClick={() => setIsMobileOpen(false)} />
      </div>

      <div className="md:hidden flex items-center p-3 border-b bg-background/95 backdrop-blur sticky top-0 z-50 w-full absolute">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px] bg-sidebar">
            <SidebarNav isActive={isActive} onItemClick={() => setIsMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="ml-3 font-mono font-bold text-sm text-primary">DSM-CONTROL</span>
      </div>

      <main className="flex-1 overflow-auto relative">
        <div className="md:hidden h-14" />
        <div ref={contentRef} className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
