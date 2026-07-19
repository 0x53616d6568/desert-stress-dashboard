import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/providers/AuthProvider";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
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

const SIDEBAR_COLLAPSED_KEY = "dsm-sidebar-collapsed";

function GatewayStatus({ compact = false }) {
  const { isConnected } = useWebSocket();
  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-md bg-card/60 border border-border/30", compact && "justify-center px-2")}>
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
      {!compact && (
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {isConnected ? "Gateway Online" : "Gateway Offline"}
        </span>
      )}
      {isConnected ? <Wifi className={cn("h-3 w-3 text-emerald-500", compact ? "" : "ml-auto")} /> : <WifiOff className={cn("h-3 w-3 text-red-500", compact ? "" : "ml-auto")} />}
    </div>
  );
}

function AlertBadge({ compact = false }) {
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
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-md bg-card/60 border border-border/30", compact && "justify-center px-2")}>
      <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
      {!compact && <span className="text-[10px] font-mono uppercase text-muted-foreground">Alerts</span>}
      <Badge className={cn("bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 h-4 font-mono", compact ? "" : "ml-auto")}>
        {count}
      </Badge>
    </div>
  );
}

function SidebarNav({ isActive, onItemClick, isCollapsed = false, isMobile = false }) {
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
      title={item.label}
      className={cn(
        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isCollapsed ? "justify-center gap-0" : "gap-3",
        isActive(item.path) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4" />
      {!isCollapsed && <span>{item.label}</span>}
    </Link>
  );

  return (
    <div className="flex h-full flex-col p-4">
      <div className="border-b border-border/50 pb-4 mb-4">
        <div className={cn("flex items-center font-mono font-bold tracking-tight text-primary", isCollapsed ? "justify-center" : "gap-2")}>
          <Activity className="h-5 w-5" />
          {!isCollapsed && <span>{isMobile ? "DSM" : "DSM-CONTROL"}</span>}
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live telemetry active
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto space-y-6">
        <div>
          {!isCollapsed && <p className="mb-2 px-3 text-xs font-mono uppercase text-muted-foreground">Main</p>}
          <div className="space-y-1">
            {mainItems.map((item) => <NavLink key={item.path} item={item} />)}
          </div>
        </div>
        <div>
          {!isCollapsed && <p className="mb-2 px-3 text-xs font-mono uppercase text-muted-foreground">Admin</p>}
          <div className="space-y-1">
            {adminItems.map((item) => <NavLink key={item.path} item={item} />)}
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-4 mt-4 space-y-2">
        <GatewayStatus compact={isCollapsed} />
        <AlertBadge compact={isCollapsed} />

        <Link
          href="/help"
          onClick={onItemClick}
          title="Help"
          className={cn(
            "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isCollapsed ? "justify-center gap-0" : "gap-3",
            isActive("/help") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <HelpCircle className="h-4 w-4" />
          {!isCollapsed && <span>Help</span>}
        </Link>

        {!isCollapsed && (
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar name={user?.name || "Operator"} />
              <div className="flex flex-col min-w-0 overflow-hidden">
                <span className="text-xs font-semibold truncate">{user?.name || "Operator"}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{user?.role || "operator"}</span>
              </div>
            </div>
          </div>
        )}

        <div className={cn("flex gap-2", isCollapsed && "flex-col")}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 font-mono"
            title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className={cn("h-4 w-4", !isCollapsed && "mr-2")} /> : <Moon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />}
            {!isCollapsed && (theme === "dark" ? "Light" : "Dark")}
          </Button>
          <Button variant="destructive" size="sm" className="flex-1 font-mono" title="Logout" onClick={logout}>
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} /> {!isCollapsed && "Logout"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }) {
  const [location] = useLocation();
  const isActive = (path) => location === path;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  const contentRef = useRef(null);

  const routeTitles = {
    "/dashboard": "Dashboard",
    "/map": "Live Map",
    "/telemetry": "Telemetry",
    "/subjects": "Subjects",
    "/devices": "Devices",
    "/alerts": "Alerts",
    "/admin/ai-models": "AI Models",
    "/admin/datasets": "Datasets",
    "/admin/firmware": "Firmware",
    "/admin/inference-health": "Inference Health",
    "/help": "Help",
  };

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

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
    <div className="flex h-dvh min-h-dvh w-full bg-background overflow-hidden">
      <div className={cn("hidden md:flex shrink-0 border-r border-border/50 bg-sidebar h-full transition-all duration-200", isSidebarCollapsed ? "md:w-20" : "md:w-64 lg:w-72")}>
        <SidebarNav
          isActive={isActive}
          isCollapsed={isSidebarCollapsed}
          onItemClick={() => setIsMobileOpen(false)}
        />
      </div>

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
        <div className="h-14 shrink-0 border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-40 px-3 sm:px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="md:hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open menu" onClick={() => setIsMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex h-8 w-8"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>

            <span className="font-mono font-bold text-sm text-primary">DSM-CONTROL</span>
          </div>

          <div className="text-xs sm:text-sm font-medium text-muted-foreground truncate pl-3">
            {routeTitles[location] || "Console"}
          </div>
        </div>

        <div ref={contentRef} className="flex-1 overflow-auto">
          {children}
        </div>

        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden" onClick={() => setIsMobileOpen(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <aside
              className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-sidebar border-r border-sidebar-border shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-14 px-4 border-b border-sidebar-border flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-primary">DSM-CONTROL</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Close menu" onClick={() => setIsMobileOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 min-h-0">
                <SidebarNav
                  isActive={isActive}
                  isMobile
                  onItemClick={() => setIsMobileOpen(false)}
                />
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
