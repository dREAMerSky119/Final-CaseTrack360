
import { NavLink } from "react-router-dom";
import {
  Activity,
  Bell,
  Building2,
  ChartNoAxesCombined,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  Network,
  Settings,
  ShieldCheck
} from "lucide-react";

const links = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/complaints", label: "Complaints", icon: ClipboardList },
  { to: "/institutions", label: "Institutions", icon: Building2 },
  { to: "/analytics", label: "Insights & analytics", icon: ChartNoAxesCombined },
  { to: "/relationships", label: "Related cases", icon: Network },
  { to: "/alerts", label: "Alerts", icon: Bell }
];

export default function Sidebar({ complaintCount = 0, user }) {
  const isAdmin = user?.role === "Administrator";
  const visibleLinks = isAdmin ? links : [...links.filter(link => ["/", "/complaints", "/relationships"].includes(link.to)), { to: "/profile", label: "My profile", icon: Settings }];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <ShieldCheck size={22} />
        </div>
        <div>
          <strong>CaseTrack <span>360</span></strong>
          <small>COMPLAINT INTELLIGENCE</small>
        </div>
      </div>

      <div className="workspace-label">WORKSPACE</div>

      <nav className="side-nav">
        {visibleLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            end={to === "/"}
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>

            {label === "Complaints" && (
              <span className="nav-count">{complaintCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {isAdmin && <NavLink to="/settings" className="nav-link"><Settings size={18} /><span>Settings</span></NavLink>}

        <div className="sidebar-footer">
          <span className="live-dot"></span>
          Demo environment
          <span className="version">v0.1</span>
        </div>
      </div>
    </aside>
  );
}
