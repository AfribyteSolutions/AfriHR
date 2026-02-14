"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";

interface LeaveCalendarProps {
  leaveData: any[];
}

const LeaveCalendar: React.FC<LeaveCalendarProps> = ({ leaveData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Get leaves for the current month
  const leavesInMonth = useMemo(() => {
    return leaveData.filter((leave) => {
      if (!leave.startDate) return false;

      const startDate = new Date(leave.startDate);
      const endDate = leave.endDate ? new Date(leave.endDate) : startDate;
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      return (startDate <= monthEnd && endDate >= monthStart);
    });
  }, [leaveData, currentDate]);

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
    const colors: Record<string, string> = {
      sick: "bg-red-100 text-red-800 border-red-300",
      casual: "bg-blue-100 text-blue-800 border-blue-300",
      annual: "bg-green-100 text-green-800 border-green-300",
      maternity: "bg-purple-100 text-purple-800 border-purple-300",
      paternity: "bg-indigo-100 text-indigo-800 border-indigo-300",
      unpaid: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colors[leaveType.toLowerCase()] || "bg-yellow-100 text-yellow-800 border-yellow-300";
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
              {dayLeaves.slice(0, 3).map((leave, idx) => (
                <Link
                  key={`${leave.id}-${idx}`}
                  href={`/hrm/leaves?id=${leave.id}`}
                  className={`leave-item ${getLeaveTypeColor(leave.leaveType)}`}
                  title={`${leave.employeeName} - ${leave.leaveType}`}
                >
                  <span className="leave-name">{leave.employeeName}</span>
                </Link>
              ))}
              {dayLeaves.length > 3 && (
                <div className="more-leaves text-xs text-gray-600">
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
        }

        .weekday {
          background: #f9fafb;
          padding: 12px;
          text-align: center;
          font-weight: 600;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: #e5e7eb;
          border: 1px solid #e5e7eb;
        }

        .calendar-day {
          background: white;
          min-height: 120px;
          padding: 8px;
          position: relative;
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
        }

        .calendar-day.today .day-number {
          background: #3b82f6;
          color: white;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .leaves-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .leave-item {
          padding: 4px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          border: 1px solid;
          text-decoration: none;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .leave-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .leave-name {
          font-weight: 500;
        }

        .more-leaves {
          padding: 2px 6px;
          text-align: center;
          font-style: italic;
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
        <div className="legend-item">
          <div className="legend-color bg-red-100 border-red-300"></div>
          <span>Sick Leave</span>
        </div>
        <div className="legend-item">
          <div className="legend-color bg-blue-100 border-blue-300"></div>
          <span>Casual Leave</span>
        </div>
        <div className="legend-item">
          <div className="legend-color bg-green-100 border-green-300"></div>
          <span>Annual Leave</span>
        </div>
        <div className="legend-item">
          <div className="legend-color bg-purple-100 border-purple-300"></div>
          <span>Maternity Leave</span>
        </div>
        <div className="legend-item">
          <div className="legend-color bg-indigo-100 border-indigo-300"></div>
          <span>Paternity Leave</span>
        </div>
        <div className="legend-item">
          <div className="legend-color bg-gray-100 border-gray-300"></div>
          <span>Unpaid Leave</span>
        </div>
      </div>
    </div>
  );
};

export default LeaveCalendar;
