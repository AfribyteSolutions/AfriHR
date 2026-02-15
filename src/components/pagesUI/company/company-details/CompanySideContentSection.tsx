"use client"
import CustomDropdown from '@/components/dropdown/CustomDropdown';
import { dropdownItems } from '@/data/dropdown-data';
import { Tab, Tabs } from '@mui/material';
import React, { useState } from 'react';

interface CompanySideContentSectionProps {
    company: any;
}

const CompanySideContentSection: React.FC<CompanySideContentSectionProps> = ({ company }) => {
    const [value, setValue] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setIsLoading(true);
        setValue(newValue);

        // Simulate a slight delay for content update
        setTimeout(() => {
            setIsLoading(false);
        }, 300);
    };
    return (
        <>
            <div className="card__wrapper no-height">
                <div className="company__tab">
                    <div className="company-tabs-wrapper">
                        {/* Tabs */}
                        <Tabs className='mb-[10px] gap-[10px]' value={value} onChange={handleChange}>
                            <Tab label="Activites" />
                            <Tab label="Notes" />
                            <Tab label="Files" />
                        </Tabs>
                    </div>
                    <div className="company__tab-content">
                        <div className="tab-content">
                        {isLoading ? (
                        <div className="loading-spinner p-8 text-center">
                            <p>Loading...</p>
                        </div>
                    ) : (
                        <>
                            <div hidden={value !== 0}>
                                {value === 0 && (
                                    <div className="company__details-wrapper">
                                        <div className="company__details-top mb-5 flex items-center justify-between">
                                            <h2 className="company__details-title">Activities for {company?.name || "Company"}</h2>
                                        </div>
                                        <div className="company__details-content p-8 text-center">
                                            <i className="fa-light fa-folder-open text-6xl text-gray-300 mb-4"></i>
                                            <p className="text-gray-500">No activities recorded yet</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div hidden={value !== 1}>
                                {value === 1 && (
                                    <div className="company__details-wrapper">
                                        <div className="company__details-top mb-5 flex items-center justify-between">
                                            <h2 className="company__details-title">Notes for {company?.name || "Company"}</h2>
                                        </div>
                                        <div className="company__details-content p-8 text-center">
                                            <i className="fa-light fa-note-sticky text-6xl text-gray-300 mb-4"></i>
                                            <p className="text-gray-500">No notes available yet</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div hidden={value !== 2}>
                                {value === 2 && (
                                    <div className="company__details-wrapper">
                                        <div className="company__details-top mb-5 flex items-center justify-between">
                                            <h2 className="company__details-title">Files for {company?.name || "Company"}</h2>
                                        </div>
                                        <div className="company__details-content p-8 text-center">
                                            <i className="fa-light fa-file text-6xl text-gray-300 mb-4"></i>
                                            <p className="text-gray-500">No files uploaded yet</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            </>
                    )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CompanySideContentSection;