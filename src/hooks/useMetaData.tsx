//@refresh
"use client";
import React, { ReactNode } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";

interface WrapperProps {
  children: ReactNode; // 👈 only once
  pageTitle: string;
}

const MetaData: React.FC<WrapperProps> = ({ children, pageTitle }) => {
  return (
    <HelmetProvider>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      {children}
    </HelmetProvider>
  );
};

export default MetaData;
