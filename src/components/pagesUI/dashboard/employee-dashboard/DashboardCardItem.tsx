"use client";
import React from 'react';

interface Props {
    stats: {
        tickets: number;
        resolvedTickets: number;
        projects: number;
        leaves: number;
    };
}

const DashboardCardItem: React.FC<Props> = ({ stats }) => {
    return (
        <>
            {[
                { label: "New Tickets", value: stats.tickets, icon: "fa-user", color: "blue" },
                { label: "Resolved", value: stats.resolvedTickets, icon: "fa-house-person-leave", color: "green" },
                { label: "Projects", value: stats.projects, icon: "fa-gear", color: "purple" },
                { label: "Leaves", value: stats.leaves, icon: "fa-badge-check", color: "orange" }
            ].map((card, i) => (
                <div key={i} className="col-span-12 sm:col-span-6 xxl:col-span-3">
                    <div className="card__wrapper">
                        <div className="flex items-center gap-[20px]">
                            <div className={`card__icon bg-${card.color}-100 p-4 rounded-xl`}>
                                <i className={`fa-sharp fa-regular ${card.icon}`}></i>
                            </div>
                            <div className="card__title-wrap">
                                <h6 className="card__sub-title text-gray-500">{card.label}</h6>
                                <h4 className="card__title font-bold text-2xl">{card.value}</h4>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

export default DashboardCardItem;