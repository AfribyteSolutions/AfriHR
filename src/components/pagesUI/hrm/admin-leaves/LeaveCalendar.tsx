"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

interface LeaveCalendarProps {
  leaveData: any[];
}

const LeaveCalendar: React.FC<LeaveCalendarProps> = ({ leaveData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const daysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const firstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const previousMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const today = () => setCurrentDate(new Date());

  const toggleFilter = (leaveType: string) => {
    setActiveFilters((prev) =>
      prev.includes(leaveType) ? prev.filter((t) => t !== leaveType) : [...prev, leaveType]
    );
  };

  const leavesInMonth = useMemo(() => {
    return leaveData.filter((leave) => {
      if (!leave.startDate) return false;
      const startDate = new Date(leave.startDate);
      const endDate = leave.endDate ? new Date(leave.endDate) : startDate;
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const isInMonth = startDate <= monthEnd && endDate >= monthStart;
      if (activeFilters.length > 0) {
        return isInMonth && activeFilters.includes(leave.leaveType?.toLowerCase());
      }
      return isInMonth;
    });
  }, [leaveData, currentDate, activeFilters]);

  const getLeavesForDay = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return leavesInMonth.filter((leave) => {
      const startDate = new Date(leave.startDate);
      const endDate = leave.endDate ? new Date(leave.endDate) : startDate;
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      targetDate.setHours(12, 0, 0, 0);
      return targetDate >= startDate && targetDate <= endDate;
    });
  };

  const leaveTypes = [
    { key: "sick leave",        label: "Sick",        dot: "#ef4444", lightBg: "#fef2f2", darkBg: "#2d1515", lightColor: "#dc2626", darkColor: "#f87171" },
    { key: "casual leave",      label: "Casual",      dot: "#3b82f6", lightBg: "#eff6ff", darkBg: "#0f1f3d", lightColor: "#2563eb", darkColor: "#60a5fa" },
    { key: "annual leave",      label: "Annual",      dot: "#10b981", lightBg: "#ecfdf5", darkBg: "#052e1c", lightColor: "#059669", darkColor: "#34d399" },
    { key: "maternity leave",   label: "Maternity",   dot: "#a855f7", lightBg: "#faf5ff", darkBg: "#1e0a2e", lightColor: "#9333ea", darkColor: "#c084fc" },
    { key: "paternity leave",   label: "Paternity",   dot: "#6366f1", lightBg: "#eef2ff", darkBg: "#12133a", lightColor: "#4f46e5", darkColor: "#818cf8" },
    { key: "unpaid leave",      label: "Unpaid",      dot: "#6b7280", lightBg: "#f9fafb", darkBg: "#1a1b1e", lightColor: "#4b5563", darkColor: "#9ca3af" },
    { key: "emergency leave",   label: "Emergency",   dot: "#f97316", lightBg: "#fff7ed", darkBg: "#2d1600", lightColor: "#ea580c", darkColor: "#fb923c" },
    { key: "bereavement leave", label: "Bereavement", dot: "#64748b", lightBg: "#f8fafc", darkBg: "#0f1923", lightColor: "#475569", darkColor: "#94a3b8" },
  ];

  const getLeaveType = (leaveType: string) =>
    leaveTypes.find((t) => {
      const n = leaveType?.toLowerCase().trim() || "";
      return t.key === n || t.key.startsWith(n);
    }) || { dot: "#f59e0b", lightBg: "#fffbeb", darkBg: "#2d1f00", lightColor: "#d97706", darkColor: "#fbbf24" };

  const formatLeaveTooltip = (leave: any) => {
    const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const displayName = leave.fullName || leave.employeeName || leave.email?.split("@")[0] || "Unknown";
    return `${displayName}\nEmail: ${leave.email || "N/A"}\nType: ${leave.leaveType}\nDates: ${fmt(leave.startDate)} - ${leave.endDate ? fmt(leave.endDate) : fmt(leave.startDate)}\nStatus: ${leave.status || "Pending"}\nReason: ${leave.reason || "N/A"}`;
  };

  const renderCalendar = () => {
    const days = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);
    const cells = [];
    const todayDate = new Date();

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`e-${i}`} className="lc-day lc-day--empty" />);
    }

    for (let day = 1; day <= days; day++) {
      const dayLeaves = getLeavesForDay(day);
      const isToday =
        day === todayDate.getDate() &&
        currentDate.getMonth() === todayDate.getMonth() &&
        currentDate.getFullYear() === todayDate.getFullYear();

      cells.push(
        <div
          key={day}
          className={`lc-day${isToday ? " lc-day--today" : ""}${dayLeaves.length > 0 ? " lc-day--active" : ""}`}
        >
          <span className={`lc-day__num${isToday ? " lc-day__num--today" : ""}`}>{day}</span>
          {dayLeaves.length > 0 && (
            <div className="lc-day__leaves">
              {dayLeaves.slice(0, 2).map((leave, idx) => {
                const name = leave.fullName || leave.employeeName || leave.email?.split("@")[0] || "Unknown";
                const lt = getLeaveType(leave.leaveType);
                return (
                  <Link
                    key={`${leave.id}-${idx}`}
                    href={`/hrm/leaves?id=${leave.id}`}
                    className="lc-leave-pill"
                    title={formatLeaveTooltip(leave)}
                    style={{
                      "--pill-dot":          lt.dot,
                      "--pill-light-bg":     lt.lightBg,
                      "--pill-dark-bg":      lt.darkBg,
                      "--pill-light-color":  lt.lightColor,
                      "--pill-dark-color":   lt.darkColor,
                    } as React.CSSProperties}
                  >
                    {leave.profilePictureUrl ? (
                      <Image src={leave.profilePictureUrl} alt={name} width={14} height={14} className="lc-leave-pill__avatar" />
                    ) : (
                      <span className="lc-leave-pill__initial" style={{ background: lt.dot }}>
                        {name[0]?.toUpperCase()}
                      </span>
                    )}
                    <span className="lc-leave-pill__name">{name}</span>
                  </Link>
                );
              })}
              {dayLeaves.length > 2 && (
                <span className="lc-day__more">+{dayLeaves.length - 2}</span>
              )}
            </div>
          )}
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="lc-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        /* ══════════════════════════════════════════
           LIGHT THEME TOKENS
        ══════════════════════════════════════════ */
        .lc-root {
          --bg:              #ffffff;
          --bg-subtle:       #f9fafb;
          --bg-day:          #fafafa;
          --bg-day-hover:    #ffffff;
          --bg-today:        #ffffff;
          --border:          #e5e7eb;
          --border-day:      #f0f0f0;
          --border-today:    #0f172a;
          --ring-today:      #0f172a;
          --text-primary:    #0f172a;
          --text-secondary:  #6b7280;
          --text-muted:      #9ca3af;
          --text-weekend:    #d1d5db;
          --accent:          #0f172a;
          --accent-text:     #ffffff;
          --nav-bg:          #ffffff;
          --nav-border:      #e5e7eb;
          --nav-text:        #374151;
          --chip-bg:         #ffffff;
          --chip-border:     #e5e7eb;
          --chip-text:       #374151;
          --chip-active-bg:  #0f172a;
          --chip-active-bd:  #0f172a;
          --chip-active-txt: #ffffff;
          --shadow:          0 1px 3px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.05);
        }

        /* ══════════════════════════════════════════
           DARK THEME TOKENS  (system preference)
        ══════════════════════════════════════════ */
        @media (prefers-color-scheme: dark) {
          .lc-root {
            --bg:              #0d1117;
            --bg-subtle:       #161b22;
            --bg-day:          #0d1117;
            --bg-day-hover:    #161b22;
            --bg-today:        #161b22;
            --border:          #21262d;
            --border-day:      #1c2128;
            --border-today:    #c9d1d9;
            --ring-today:      #c9d1d9;
            --text-primary:    #e6edf3;
            --text-secondary:  #8b949e;
            --text-muted:      #484f58;
            --text-weekend:    #30363d;
            --accent:          #e6edf3;
            --accent-text:     #0d1117;
            --nav-bg:          #161b22;
            --nav-border:      #30363d;
            --nav-text:        #8b949e;
            --chip-bg:         #161b22;
            --chip-border:     #30363d;
            --chip-text:       #8b949e;
            --chip-active-bg:  #e6edf3;
            --chip-active-bd:  #e6edf3;
            --chip-active-txt: #0d1117;
            --shadow:          0 1px 3px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.3);
          }
        }

        /* ══════════════════════════════════════════
           ALSO SUPPORT data-theme="dark" / "light"
           for manual overrides from parent
        ══════════════════════════════════════════ */
        [data-theme="dark"] .lc-root,
        .dark .lc-root {
          --bg:              #0d1117;
          --bg-subtle:       #161b22;
          --bg-day:          #0d1117;
          --bg-day-hover:    #161b22;
          --bg-today:        #161b22;
          --border:          #21262d;
          --border-day:      #1c2128;
          --border-today:    #c9d1d9;
          --ring-today:      #c9d1d9;
          --text-primary:    #e6edf3;
          --text-secondary:  #8b949e;
          --text-muted:      #484f58;
          --text-weekend:    #30363d;
          --accent:          #e6edf3;
          --accent-text:     #0d1117;
          --nav-bg:          #161b22;
          --nav-border:      #30363d;
          --nav-text:        #8b949e;
          --chip-bg:         #161b22;
          --chip-border:     #30363d;
          --chip-text:       #8b949e;
          --chip-active-bg:  #e6edf3;
          --chip-active-bd:  #e6edf3;
          --chip-active-txt: #0d1117;
          --shadow:          0 1px 3px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.3);
        }

        [data-theme="light"] .lc-root,
        .light .lc-root {
          --bg:              #ffffff;
          --bg-subtle:       #f9fafb;
          --bg-day:          #fafafa;
          --bg-day-hover:    #ffffff;
          --bg-today:        #ffffff;
          --border:          #e5e7eb;
          --border-day:      #f0f0f0;
          --border-today:    #0f172a;
          --ring-today:      #0f172a;
          --text-primary:    #0f172a;
          --text-secondary:  #6b7280;
          --text-muted:      #9ca3af;
          --text-weekend:    #d1d5db;
          --accent:          #0f172a;
          --accent-text:     #ffffff;
          --nav-bg:          #ffffff;
          --nav-border:      #e5e7eb;
          --nav-text:        #374151;
          --chip-bg:         #ffffff;
          --chip-border:     #e5e7eb;
          --chip-text:       #374151;
          --chip-active-bg:  #0f172a;
          --chip-active-bd:  #0f172a;
          --chip-active-txt: #ffffff;
          --shadow:          0 1px 3px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.05);
        }

        /* ══════════════════════════════════════════
           PILL TOKENS (per-pill via inline style)
        ══════════════════════════════════════════ */
        .lc-leave-pill {
          --pill-bg:    var(--pill-light-bg);
          --pill-color: var(--pill-light-color);
        }
        @media (prefers-color-scheme: dark) {
          .lc-leave-pill {
            --pill-bg:    var(--pill-dark-bg);
            --pill-color: var(--pill-dark-color);
          }
        }
        [data-theme="dark"] .lc-leave-pill,
        .dark .lc-leave-pill {
          --pill-bg:    var(--pill-dark-bg);
          --pill-color: var(--pill-dark-color);
        }
        [data-theme="light"] .lc-leave-pill,
        .light .lc-leave-pill {
          --pill-bg:    var(--pill-light-bg);
          --pill-color: var(--pill-light-color);
        }

        /* ══════════════════════════════════════════
           COMPONENT STYLES
        ══════════════════════════════════════════ */
        .lc-root {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          border-radius: 16px;
          padding: 28px;
          box-shadow: var(--shadow);
          max-width: 100%;
          overflow: hidden;
          transition: background 0.2s, box-shadow 0.2s;
        }

        .lc-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .lc-header__label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          display: block;
          margin-bottom: 4px;
        }

        .lc-header__title {
          font-size: 26px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          line-height: 1;
          margin: 0;
        }

        .lc-header__count {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 6px;
          display: block;
        }

        .lc-nav {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lc-nav__btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--nav-border);
          background: var(--nav-bg);
          cursor: pointer;
          color: var(--nav-text);
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          outline: none;
        }

        .lc-nav__btn:hover {
          background: var(--bg-subtle);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }

        .lc-nav__today {
          height: 36px;
          padding: 0 14px;
          border-radius: 10px;
          border: 1px solid var(--nav-border);
          background: var(--nav-bg);
          cursor: pointer;
          color: var(--nav-text);
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s ease;
          outline: none;
        }

        .lc-nav__today:hover {
          background: var(--accent);
          color: var(--accent-text);
          border-color: var(--accent);
        }

        .lc-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 6px;
        }

        .lc-weekday {
          text-align: center;
          padding: 8px 4px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .lc-weekday:first-child,
        .lc-weekday:last-child { color: var(--text-weekend); }

        .lc-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .lc-day {
          background: var(--bg-day);
          border: 1px solid var(--border-day);
          border-radius: 10px;
          min-height: 110px;
          padding: 8px 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow: hidden;
          transition: background 0.15s, border-color 0.15s;
        }

        .lc-day:not(.lc-day--empty):hover {
          border-color: var(--border);
          background: var(--bg-day-hover);
        }

        .lc-day--empty {
          background: transparent;
          border-color: transparent;
        }

        .lc-day--today {
          background: var(--bg-today);
          border-color: var(--border-today);
          box-shadow: 0 0 0 1px var(--ring-today);
        }

        .lc-day--active { background: var(--bg-day-hover); }

        .lc-day__num {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          line-height: 1;
          display: block;
          width: fit-content;
        }

        .lc-day__num--today {
          background: var(--accent);
          color: var(--accent-text);
          width: 22px;
          height: 22px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }

        .lc-day__leaves {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .lc-leave-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 6px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 600;
          text-decoration: none;
          overflow: hidden;
          min-width: 0;
          background: var(--pill-bg);
          color: var(--pill-color);
          border: 1px solid var(--pill-dot);
          transition: all 0.15s ease;
        }

        .lc-leave-pill:hover {
          filter: brightness(0.92);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }

        .lc-leave-pill__avatar {
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .lc-leave-pill__initial {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          color: #fff;
          font-size: 8px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lc-leave-pill__name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
        }

        .lc-day__more {
          font-size: 9px;
          font-weight: 700;
          color: var(--text-muted);
          font-family: 'DM Mono', monospace;
          padding-left: 2px;
        }

        .lc-legend {
          margin-top: 24px;
          padding: 16px;
          background: var(--bg-subtle);
          border-radius: 12px;
          border: 1px solid var(--border);
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          transition: background 0.2s, border-color 0.2s;
        }

        .lc-legend__label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          width: 100%;
          margin-bottom: 2px;
        }

        .lc-filter-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 20px;
          border: 1.5px solid var(--chip-border);
          background: var(--chip-bg);
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: var(--chip-text);
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s ease;
          outline: none;
        }

        .lc-filter-chip:hover {
          border-color: var(--text-secondary);
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        .lc-filter-chip--active {
          background: var(--chip-active-bg);
          border-color: var(--chip-active-bd);
          color: var(--chip-active-txt);
        }

        .lc-filter-chip__dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .lc-clear-btn {
          margin-left: auto;
          padding: 5px 14px;
          border-radius: 20px;
          border: 1.5px solid var(--chip-border);
          background: transparent;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s ease;
          outline: none;
        }

        .lc-clear-btn:hover {
          border-color: #ef4444;
          color: #ef4444;
        }

        @media (max-width: 640px) {
          .lc-root { padding: 16px; }
          .lc-day { min-height: 64px; padding: 5px 4px; }
          .lc-day--empty { min-height: 64px; }
          .lc-header__title { font-size: 20px; }
          .lc-leave-pill__name { display: none; }
          .lc-leave-pill { padding: 3px 4px; }
        }
      `}</style>

      {/* Header */}
      <div className="lc-header">
        <div>
          <span className="lc-header__label">Leave Calendar</span>
          <h3 className="lc-header__title">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <span className="lc-header__count">
            {leavesInMonth.length} leave{leavesInMonth.length !== 1 ? "s" : ""} this month
            {activeFilters.length > 0 && ` · ${activeFilters.length} filter${activeFilters.length !== 1 ? "s" : ""} active`}
          </span>
        </div>
        <div className="lc-nav">
          <button className="lc-nav__btn" onClick={previousMonth} title="Previous month">←</button>
          <button className="lc-nav__today" onClick={today}>Today</button>
          <button className="lc-nav__btn" onClick={nextMonth} title="Next month">→</button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="lc-weekdays">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="lc-weekday">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="lc-grid">{renderCalendar()}</div>

      {/* Legend / filters */}
      <div className="lc-legend">
        <span className="lc-legend__label">Filter by type</span>
        {leaveTypes.map((type) => {
          const isActive = activeFilters.includes(type.key);
          return (
            <button
              key={type.key}
              className={`lc-filter-chip${isActive ? " lc-filter-chip--active" : ""}`}
              onClick={() => toggleFilter(type.key)}
            >
              <span
                className="lc-filter-chip__dot"
                style={{ background: isActive ? "currentColor" : type.dot }}
              />
              {type.label}
            </button>
          );
        })}
        {activeFilters.length > 0 && (
          <button className="lc-clear-btn" onClick={() => setActiveFilters([])}>Clear all</button>
        )}
      </div>
    </div>
  );
};

export default LeaveCalendar;