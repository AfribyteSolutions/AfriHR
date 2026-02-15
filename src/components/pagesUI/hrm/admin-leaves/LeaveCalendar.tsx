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
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const toggleFilter = (leaveType: string) => {
    setActiveFilters((prev) => {
      if (prev.includes(leaveType)) {
        return prev.filter((type) => type !== leaveType);
      } else {
        return [...prev, leaveType];
      }
    });
  };

  // Get leaves for the current month
  const leavesInMonth = useMemo(() => {
    return leaveData.filter((leave) => {
      if (!leave.startDate) return false;

      const startDate = new Date(leave.startDate);
      const endDate = leave.endDate ? new Date(leave.endDate) : startDate;
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const isInMonth = startDate <= monthEnd && endDate >= monthStart;

      // Apply filters if any are active
      if (activeFilters.length > 0) {
        return isInMonth && activeFilters.includes(leave.leaveType?.toLowerCase());
      }

      return isInMonth;
    });
  }, [leaveData, currentDate, activeFilters]);

  // Get leaves for a specific day
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

  const getLeaveTypeColor = (leaveType: string) => {
    const normalizedType = leaveType?.toLowerCase().trim() || "";
    const colors: Record<string, string> = {
      sick: "bg-red-500 text-white border-red-600",
      "sick leave": "bg-red-500 text-white border-red-600",
      casual: "bg-blue-500 text-white border-blue-600",
      "casual leave": "bg-blue-500 text-white border-blue-600",
      annual: "bg-green-500 text-white border-green-600",
      "annual leave": "bg-green-500 text-white border-green-600",
      maternity: "bg-purple-500 text-white border-purple-600",
      "maternity leave": "bg-purple-500 text-white border-purple-600",
      paternity: "bg-indigo-500 text-white border-indigo-600",
      "paternity leave": "bg-indigo-500 text-white border-indigo-600",
      unpaid: "bg-gray-500 text-white border-gray-600",
      "unpaid leave": "bg-gray-500 text-white border-gray-600",
      emergency: "bg-orange-500 text-white border-orange-600",
      "emergency leave": "bg-orange-500 text-white border-orange-600",
      bereavement: "bg-slate-500 text-white border-slate-600",
      "bereavement leave": "bg-slate-500 text-white border-slate-600",
    };
    return colors[normalizedType] || "bg-yellow-500 text-white border-yellow-600";
  };

  const formatLeaveTooltip = (leave: any) => {
    const startDate = new Date(leave.startDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const endDate = leave.endDate
      ? new Date(leave.endDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : startDate;

    // Extract name from email if it's an email
    const displayName = leave.fullName || leave.employeeName || leave.email?.split("@")[0] || "Unknown";

    return `${displayName}
Email: ${leave.email || "N/A"}
Type: ${leave.leaveType}
Dates: ${startDate} - ${endDate}
Status: ${leave.status || "Pending"}
Reason: ${leave.reason || "N/A"}`;
  };

  const renderCalendar = () => {
    const days = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);
    const calendarDays = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(
        <div key={`empty-${i}`} className="calendar-day empty"></div>
      );
    }

    // Actual days of the month
    for (let day = 1; day <= days; day++) {
      const dayLeaves = getLeavesForDay(day);
      const isToday =
        day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear();

      calendarDays.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? "today" : ""} ${
            dayLeaves.length > 0 ? "has-leaves" : ""
          }`}
        >
          <div className="day-number">{day}</div>
          {dayLeaves.length > 0 && (
            <div className="leaves-list">
              {dayLeaves.slice(0, 3).map((leave, idx) => {
                const displayName = leave.fullName || leave.employeeName || leave.email?.split("@")[0] || "Unknown";
                return (
                  <Link
                    key={`${leave.id}-${idx}`}
                    href={`/hrm/leaves?id=${leave.id}`}
                    className={`leave-item ${getLeaveTypeColor(leave.leaveType)}`}
                    title={formatLeaveTooltip(leave)}
                  >
                    {leave.profilePictureUrl && (
                      <div className="leave-avatar">
                        <Image
                          src={leave.profilePictureUrl}
                          alt={displayName}
                          width={16}
                          height={16}
                          className="rounded-full object-cover"
                        />
                      </div>
                    )}
                    <span className="leave-name" title={displayName}>{displayName}</span>
                  </Link>
                );
              })}
              {dayLeaves.length > 3 && (
                <div className="more-leaves text-xs text-gray-600 font-medium">
                  +{dayLeaves.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return calendarDays;
  };

  return (
    <div className="leave-calendar-wrapper">
      <style jsx>{`
        .leave-calendar-wrapper {
          background: white;
          border-radius: 8px;
          padding: 20px;
          overflow: hidden;
          max-width: 100%;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .calendar-title {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .calendar-nav {
          display: flex;
          gap: 10px;
        }

        .calendar-nav button {
          padding: 8px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .calendar-nav button:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          margin-bottom: 1px;
          background: #e5e7eb;
          overflow: hidden;
        }

        .weekday {
          background: #f9fafb;
          padding: 12px;
          text-align: center;
          font-weight: 600;
          font-size: 0.875rem;
          color: #6b7280;
          overflow: hidden;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: #e5e7eb;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          max-width: 100%;
        }

        .calendar-day {
          background: white;
          min-height: 120px;
          max-height: 160px;
          padding: 8px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .calendar-day.empty {
          background: #f9fafb;
        }

        .calendar-day.today {
          background: #eff6ff;
        }

        .day-number {
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .calendar-day.today .day-number {
          background: #3b82f6;
          color: white;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 0.75rem;
        }

        .leaves-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
          max-width: 100%;
          overflow: hidden;
          flex: 1;
          min-height: 0;
        }

        .leave-item {
          padding: 3px 5px;
          border-radius: 3px;
          font-size: 0.65rem;
          border: 1px solid;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 3px;
          transition: all 0.2s;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
        }

        .leave-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          z-index: 10;
        }

        .leave-avatar {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          overflow: hidden;
        }

        .leave-name {
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
          flex: 1;
          word-break: break-all;
        }

        .more-leaves {
          padding: 2px 4px;
          text-align: center;
          font-style: italic;
          font-size: 0.6rem;
        }

        .legend {
          display: flex;
          gap: 20px;
          margin-top: 20px;
          flex-wrap: wrap;
          padding: 15px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 6px;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .legend-item:hover {
          background: #e5e7eb;
        }

        .legend-item.active {
          background: white;
          border-color: #3b82f6;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .legend-color {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 1px solid;
        }
      `}</style>

      <div className="calendar-header">
        <h3 className="calendar-title">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="calendar-nav">
          <button onClick={previousMonth}>
            <i className="fa-solid fa-chevron-left"></i> Previous
          </button>
          <button onClick={today}>Today</button>
          <button onClick={nextMonth}>
            Next <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="calendar-weekdays">
        <div className="weekday">Sun</div>
        <div className="weekday">Mon</div>
        <div className="weekday">Tue</div>
        <div className="weekday">Wed</div>
        <div className="weekday">Thu</div>
        <div className="weekday">Fri</div>
        <div className="weekday">Sat</div>
      </div>

      <div className="calendar-grid">{renderCalendar()}</div>

      <div className="legend">
        <div className="text-sm text-gray-600 w-full mb-2">
          Click on leave types to filter (showing {leavesInMonth.length} leaves)
        </div>
        <div
          className={`legend-item ${activeFilters.includes("sick") || activeFilters.includes("sick leave") ? "active" : ""}`}
          onClick={() => toggleFilter("sick leave")}
        >
          <div className="legend-color bg-red-500 border-red-600"></div>
          <span>Sick Leave</span>
        </div>
        <div
          className={`legend-item ${activeFilters.includes("casual") || activeFilters.includes("casual leave") ? "active" : ""}`}
          onClick={() => toggleFilter("casual leave")}
        >
          <div className="legend-color bg-blue-500 border-blue-600"></div>
          <span>Casual Leave</span>
        </div>
        <div
          className={`legend-item ${activeFilters.includes("annual") || activeFilters.includes("annual leave") ? "active" : ""}`}
          onClick={() => toggleFilter("annual leave")}
        >
          <div className="legend-color bg-green-500 border-green-600"></div>
          <span>Annual Leave</span>
        </div>
        <div
          className={`legend-item ${activeFilters.includes("maternity") || activeFilters.includes("maternity leave") ? "active" : ""}`}
          onClick={() => toggleFilter("maternity leave")}
        >
          <div className="legend-color bg-purple-500 border-purple-600"></div>
          <span>Maternity Leave</span>
        </div>
        <div
          className={`legend-item ${activeFilters.includes("paternity") || activeFilters.includes("paternity leave") ? "active" : ""}`}
          onClick={() => toggleFilter("paternity leave")}
        >
          <div className="legend-color bg-indigo-500 border-indigo-600"></div>
          <span>Paternity Leave</span>
        </div>
        <div
          className={`legend-item ${activeFilters.includes("unpaid") || activeFilters.includes("unpaid leave") ? "active" : ""}`}
          onClick={() => toggleFilter("unpaid leave")}
        >
          <div className="legend-color bg-gray-500 border-gray-600"></div>
          <span>Unpaid Leave</span>
        </div>
        {activeFilters.length > 0 && (
          <button
            onClick={() => setActiveFilters([])}
            className="ml-auto px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default LeaveCalendar;
