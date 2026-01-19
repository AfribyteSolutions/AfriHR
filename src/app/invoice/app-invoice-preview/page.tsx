import Wrapper from "@/components/layouts/DefaultWrapper";
import AppInvoicePreviewMainArea from "@/components/pagesUI/invoice/app-invoice-preview/AppInvoicePreviewMainArea";
import MetaData from "@/hooks/useMetaData";
import React from "react";

interface InvoicePreviewPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

const InvoicePreviewMain = ({ searchParams }: InvoicePreviewPageProps) => {
  const invoiceId =
    typeof searchParams.id === "string" ? searchParams.id : null;

  return (
    <>
      <MetaData pageTitle="invoice preview">
        <Wrapper>
          <AppInvoicePreviewMainArea invoiceId={invoiceId} />
        </Wrapper>
      </MetaData>
    </>
  );
};

export default InvoicePreviewMain;
