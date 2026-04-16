"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { statusColor } from "@/lib/utils";

interface SidebarProps {
  initiatives: { id: string; name: string; status: string }[];
  collapsed: boolean;
  onToggle: () => void;
}

const navIcon = (name: string) => {
  const icons: Record<string, React.ReactNode> = {
    dashboard: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7" />
      </svg>
    ),
    sboTracker: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none" opacity=".75" />
        <circle cx="11" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none" opacity=".75" />
        <path d="M1 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.3" fill="none" opacity=".75" />
        <path d="M7 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.3" fill="none" opacity=".75" />
      </svg>
    ),
    assistant: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 1l1.5 4.5H14l-3.6 2.6 1.4 4.4L8 10l-3.8 2.5 1.4-4.4L2 5.5h4.5L8 1z"
          fill="currentColor"
          opacity=".75"
        />
      </svg>
    ),
    artifacts: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.4" fill="none" opacity=".75" />
        <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.4" fill="none" opacity=".75" />
      </svg>
    ),
    transcripts: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 1v10M4 7l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          opacity=".75"
        />
        <path d="M2 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".75" />
      </svg>
    ),
    settings: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" opacity=".75" />
        <path
          d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity=".75"
        />
      </svg>
    ),
  };
  return icons[name] || null;
};

export function Sidebar({ initiatives, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/" || pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  const linkClasses = (path: string) =>
    `flex items-center gap-2.5 px-2.5 py-2 rounded-[5px] text-[13px] cursor-pointer transition-colors select-none ${
      isActive(path) ? "bg-navy-a text-white" : "text-cream hover:bg-navy-h hover:text-[#E8E4DC]"
    }`;

  return (
    <aside
      className={`${collapsed ? "w-0 min-w-0 overflow-hidden" : "w-[260px] min-w-[260px]"} bg-navy flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-200`}
    >
      <div className="px-[18px] py-[22px] pb-[18px] border-b border-white/[0.06] flex items-center gap-[11px]">
        <div className="w-[34px] h-[34px] bg-accent rounded-[7px] flex items-center justify-center font-serif font-bold text-[13px] text-white shrink-0 tracking-wide">
          TLP
        </div>
        <div>
          <div className="font-serif text-[15px] font-semibold text-[#E8E4DC] leading-tight">TLP Hub</div>
          <div className="text-[9.5px] text-cream-d uppercase tracking-wider mt-px">Technology Lifecycle</div>
        </div>
      </div>

      <nav className="flex-1 px-2.5 py-3.5">
        <Link href="/dashboard" className={linkClasses("/dashboard")}>
          {navIcon("dashboard")} Dashboard
        </Link>

        <span className="block text-[9.5px] font-semibold text-cream-d uppercase tracking-widest px-2 pt-3 pb-1.5">
          Q2 2026 Initiatives
        </span>
        {initiatives.map((init) => (
          <Link key={init.id} href={`/initiatives/${init.id}`} className={linkClasses(`/initiatives/${init.id}`)}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColor(init.status) }} />
            {init.name.split("—")[0].trim()}
          </Link>
        ))}

        <span className="block text-[9.5px] font-semibold text-cream-d uppercase tracking-widest px-2 pt-3 pb-1.5">
          SBO Tracker
        </span>
        <Link href="/sbos" className={linkClasses("/sbos")}>
          {navIcon("sboTracker")} SBO Hub
        </Link>

        <span className="block text-[9.5px] font-semibold text-cream-d uppercase tracking-widest px-2 pt-3 pb-1.5">
          Tools
        </span>
        <Link href="/assistant" className={linkClasses("/assistant")}>
          {navIcon("assistant")} AI Assistant
        </Link>
        <Link href="/artifacts" className={linkClasses("/artifacts")}>
          {navIcon("artifacts")} Artifacts
        </Link>
        <Link href="/transcripts" className={linkClasses("/transcripts")}>
          {navIcon("transcripts")} Transcripts
        </Link>

        <span className="block text-[9.5px] font-semibold text-cream-d uppercase tracking-widest px-2 pt-3 pb-1.5">
          Config
        </span>
        <Link href="/settings" className={linkClasses("/settings")}>
          {navIcon("settings")} Settings
        </Link>
      </nav>

      <div className="p-2.5 border-t border-white/[0.06]">
        <div className="text-center text-[9.5px] text-cream-d tracking-wider py-1.5">Q2 2026 · BambooHR IT</div>
      </div>

      {/* Mobile toggle */}
      <button onClick={onToggle} className="md:hidden absolute top-4 right-4 text-cream z-50">
        ☰
      </button>
    </aside>
  );
}
