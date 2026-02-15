"use client";
import React, { useState } from 'react';
import { FormControl, MenuItem, Select, Tab, Tabs } from '@mui/material';
import Link from 'next/link';
import WorkingHourYearChart from './WorkingHourYearChart';
import { yearData } from '@/data/dropdown-data';

interface AttendanceLeavesProps {
    leaveData: any[];
}

const AttendanceLeaves: React.FC<AttendanceLeavesProps> = ({ leaveData }) => {
    const [value, setValue] = useState<number>(0);
    const [selectYear, setSelectYear] = useState<string>(new Date().getFullYear().toString());

    // ✅ CALCULATIONS: Dynamically derived from the table data
    const totalAllocation = 20; // Set your company policy here (e.g., 20 days)
    
    // Sum "days" only for Approved status
    const leavesTaken = leaveData
        .filter(l => l.status?.toLowerCase() === "approved")
        .reduce((sum, item) => sum + (Number(item.days) || 0), 0);

    const pendingApproval = leaveData
        .filter(l => l.status?.toLowerCase() === "pending")
        .length;

    const lossOfPay = leaveData
        .filter(l => l.leaveType === "Unpaid" && l.status?.toLowerCase() === "approved")
        .length;

    const remaining = totalAllocation - leavesTaken;

    return (
        <>
            <div className="card__wrapper mb-[20px] no-height">
                <div className="card__title-wrap flex items-center justify-between mb-[20px]">
                    <h5 className="card__heading-title">Attendance & Leaves Summary</h5>
                </div>
                <div className="attendance__list">
                    <div className="grid grid-cols-12 gap-x-5">
                        <div className="col-span-6 md:col-span-4">
                            <div className="attendance__details mb-[10px]">
                                <h4 className="text-primary">{totalAllocation}</h4>
                                <p>Annual Allocation</p>
                            </div>
                        </div>
                        <div className="col-span-6 md:col-span-4">
                            <div className="attendance__details mb-[10px]">
                                <h4 className="text-secondary">{leavesTaken}</h4>
                                <p>Total Taken</p>
                            </div>
                        </div>
                        <div className="col-span-6 md:col-span-4">
                            <div className="attendance__details mb-[10px]">
                                <h4 className="text-success">{remaining > 0 ? remaining : 0}</h4>
                                <p>Available Balance</p>
                            </div>
                        </div>
                        <div className="col-span-6 md:col-span-4">
                            <div className="attendance__details mb-[10px]">
                                <h4 className="text-link">{pendingApproval}</h4>
                                <p>Pending Approval</p>
                            </div>
                        </div>
                        <div className="col-span-6 md:col-span-4">
                            <div className="attendance__details mb-[10px]">
                                <h4 className="text-info">260</h4>
                                <p>Working Days</p>
                            </div>
                        </div>
                        <div className="col-span-6 md:col-span-4">
                            <div className="attendance__details mb-[10px]">
                                <h4 className="text-danger">{lossOfPay}</h4>
                                <p>Loss of Pay</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="attendance-btn">
                    <Link className="btn btn-primary" href="/hrm/leaves-employee">Apply Leave</Link>
                </div>
            </div>

            <div className="chart-common mb-[20px]">
                <div className="card__wrapper style_two">
                    <h5 className="card__heading-title mb-4">Working Hours Insights</h5>
                    <WorkingHourYearChart />
                </div>
            </div>
        </>
    );
};

export default AttendanceLeaves;