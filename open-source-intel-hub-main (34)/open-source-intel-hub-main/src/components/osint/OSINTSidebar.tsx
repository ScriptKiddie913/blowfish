// src/components/osint/OSINTSidebar.tsx - COMPLETE WITH NEWS INTEL (ENTERPRISE / SOC)
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  Bell,
  Upload,
  Settings,
  Database,
  FileText,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Radar,
  Bug,
  Zap,
  Crown,
  AlertTriangle,
  User,
  Network,
  Eye,
  Newspaper,
  Send,
  Skull,
  Workflow,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCurrentUserRole, getUnreadMessageCount } from "@/services/adminService";

/* ===============================
   TYPES
================================ */

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  description?: string;
  hidden?: boolean;
}

interface OSINTSidebarProps {
  onSignOut?: () => void;
  userEmail?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

/* ===============================
   NAV CONFIG (UNCHANGED)
================================ */

const mainNavItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Overview & Statistics" },
  { name: "Threat Pipeline", href: "/dashboard/malware-pipeline", icon: Workflow, description: "Full Threat Pipeline" },
  { name: "StealthMole", href: "/dashboard/stealthmole", icon: Skull, description: "Deep Threat Intel" },
  { name: "Threat Intel", href: "/dashboard/threat-intel", icon: Radar, description: "Threat Analysis" },
  { name: "Live Threats", href: "/dashboard/live-threats", icon: Zap, description: "Real-time Threat Feeds" },
  { name: "CVE Explorer", href: "/dashboard/cve", icon: Bug, description: "Vulnerabilities & Exploits" },
  { name: "News Intel", href: "/dashboard/news", icon: Newspaper, description: "Real-time News & OSINT" },
];

const toolsNavItems: NavItem[] = [
  { name: "Username OSINT", href: "/dashboard/username", icon: User, description: "Username Lookup" },
  { name: "Dark Web", href: "/dashboard/darkweb", icon: Eye, description: "Dark Web OSINT" },
  { name: "Telegram Intel", href: "/dashboard/telegram", icon: Send, description: "Telegram OSINT" },
  { name: "Graph Map", href: "/dashboard/graph", icon: Network, description: "Threat Visualization" },
];

const dataNavItems: NavItem[] = [
  { name: "Import Data", href: "/dashboard/import", icon: Upload, description: "Upload Datasets" },
  { name: "Monitoring", href: "/dashboard/monitoring", icon: Bell, description: "Active Monitoring" },
  { name: "Search History", href: "/dashboard/history", icon: FileText, description: "Past Searches" },
];

const systemNavItems: NavItem[] = [
  { name: "Admin", href: "/dashboard/admin", icon: Crown, description: "User Management" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, description: "Configuration" },
];

/* ===============================
   COMPONENT
================================ */

export function OSINTSidebar({
  onSignOut,
  userEmail,
  isOpen = true,
  onClose,
}: OSINTSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "soc" | "user">("user");
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();
  const isMobile = useIsMobile();

  /* ===============================
     ROLE & ALERT STATE
  ================================ */

  useEffect(() => {
    const checkStatus = async () => {
      setUserRole(await getCurrentUserRole());
      setUnreadCount(await getUnreadMessageCount());
    };

    checkStatus();

    const interval = setInterval(async () => {
      setUnreadCount(await getUnreadMessageCount());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  /* ===============================
     BADGE UPDATE
  ================================ */

  const updatedDataNavItems = dataNavItems.map((item) => {
    if (item.name === "Monitoring" && unreadCount > 0) {
      return { ...item, badge: unreadCount };
    }
    return item;
  });

  /* ===============================
     ROLE FILTERING
  ================================ */

  const filteredMainNavItems = mainNavItems.filter((item) =>
    userRole === "user" ? item.name === "Dashboard" : true
  );

  const filteredToolsNavItems = toolsNavItems.filter(() => userRole !== "user");

  const filteredDataNavItems = updatedDataNavItems.filter((item) =>
    userRole === "user"
      ? item.name === "Monitoring" || item.name === "Search History"
      : true
  );

  const filteredSystemNavItems = systemNavItems.filter((item) => {
    if (item.name === "Admin" && userRole !== "admin") return false;
    if (userRole === "user" && item.name !== "Settings") return false;
    return true;
  });

  /* ===============================
     RESPONSIVE
  ================================ */

  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && onClose) onClose();
  }, [location.pathname]);

  /* ===============================
     NAV LINK
  ================================ */

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;

    return (
      <Link
        to={item.href}
        onClick={() => isMobile && onClose?.()}
        className={cn(
          "flex items-center gap-3 px-3 py-2 text-sm font-medium border-l-2 transition-colors",
          isActive
            ? "border-primary bg-primary/5 text-primary"
            : "border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
        )}
        style={isActive ? { textShadow: "0 0 6px rgba(255,255,255,0.15)" } : undefined}
      >
        <item.icon
          className={cn(
            "h-4 w-4 shrink-0",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
          style={isActive ? { filter: "drop-shadow(0 0 4px rgba(255,255,255,0.25))" } : undefined}
        />

        {(!collapsed || isMobile) && (
          <>
            <div className="flex-1 truncate">
              <div className="truncate">{item.name}</div>
              {item.description && !isMobile && (
                <div className="text-[11px] text-muted-foreground/70 truncate">
                  {item.description}
                </div>
              )}
            </div>

            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto h-5 min-w-[20px] rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  /* ===============================
     HARD DIVIDER
  ================================ */

  const Divider = () => (
    <div className="my-4 border-t-2 border-sidebar-border" />
  );

  /* ===============================
     SIDEBAR CONTENT
  ================================ */

  const sidebarContent = (
    <>
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 h-16 border-b-2 border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center border border-sidebar-border">
            <Terminal
              className="h-4 w-4 text-foreground"
              style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.3))" }}
            />
          </div>
          {(!collapsed || isMobile) && (
            <div>
              <h1
                className="text-sm font-semibold"
                style={{ textShadow: "0 0 6px rgba(255,255,255,0.18)" }}
              >
                SoTaNik OSINT
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Platform v2.0
              </p>
            </div>
          )}
        </div>

        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* LANGUAGE (MOBILE) */}
      {isMobile && (
        <div className="px-3 py-2 border-b-2 border-sidebar-border">
          <LanguageSelector className="w-full justify-start" />
        </div>
      )}

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* THREAT INTEL */}
        <div className="space-y-1">
          {(!collapsed || isMobile) && (
            <div
              className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
              style={{ textShadow: "0 0 4px rgba(255,255,255,0.12)" }}
            >
              Threat Intelligence
            </div>
          )}
          {filteredMainNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <Divider />

        {/* ANALYSIS TOOLS */}
        {filteredToolsNavItems.length > 0 && (
          <div className="space-y-1">
            {(!collapsed || isMobile) && (
              <div
                className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                style={{ textShadow: "0 0 4px rgba(255,255,255,0.12)" }}
              >
                Analysis Tools
              </div>
            )}
            {filteredToolsNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}

        <Divider />

        {/* DATA MANAGEMENT */}
        <div className="space-y-1">
          {(!collapsed || isMobile) && (
            <div
              className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
              style={{ textShadow: "0 0 4px rgba(255,255,255,0.12)" }}
            >
              Data Management
            </div>
          )}
          {filteredDataNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <Divider />

        {/* SYSTEM */}
        <div className="space-y-1">
          {(!collapsed || isMobile) && (
            <div
              className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
              style={{ textShadow: "0 0 4px rgba(255,255,255,0.12)" }}
            >
              System
            </div>
          )}
          {filteredSystemNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* FOOTER */}
      {(!collapsed || isMobile) && (
        <div className="border-t-2 border-sidebar-border px-3 py-2">
          {userEmail && (
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-muted-foreground">{userEmail}</span>
              {onSignOut && (
                <Button variant="ghost" size="sm" onClick={onSignOut}>
                  Logout
                </Button>
              )}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-600" />
            System Online
          </div>
        </div>
      )}

      {/* COLLAPSE */}
      {!isMobile && (
        <div className="border-t-2 border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Collapse
              </>
            )}
          </Button>
        </div>
      )}
    </>
  );

  /* ===============================
     MOBILE / DESKTOP
  ================================ */

  if (isMobile) {
    return (
      <>
        {isOpen && <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r-2 border-sidebar-border transition-transform duration-300",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col bg-sidebar border-r-2 border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {sidebarContent}
    </aside>
  );
}
