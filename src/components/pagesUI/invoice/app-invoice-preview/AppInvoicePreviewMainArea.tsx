"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import logoLight from "../../../../../public/assets/images/logo/logo.svg";
import darkLogo from "../../../../../public/assets/images/logo/logo-white.svg";
import Link from "next/link";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import InvoicePreviewTable from "./InvoicePreviewTable";
import { toast } from "react-hot-toast";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  billingAddress: {
    fullName: string;
    email: string;
    address: string;
    mobileNumber: string;
    phoneNumber: string;
  };
  shippingAddress: {
    fullName: string;
    email: string;
    address: string;
    mobileNumber: string;
    phoneNumber: string;
  };
  items: Array<{
    id: string;
    productName: string;
    productDetails: string;
    rate: number;
    quantity: number;
    amount: number;
  }>;
  paymentMethod: {
    type: string;
    cardName?: string;
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    paypalEmail?: string;
  };
  notes: string;
  discount: number;
  tax: number;
  shippingCharge: number;
  rebate: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: string;
}

interface AppInvoicePreviewMainAreaProps {
  invoiceId: string | null;
}

const AppInvoicePreviewMainArea: React.FC<AppInvoicePreviewMainAreaProps> = ({
  invoiceId,
}) => {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) {
        setError("No invoice ID provided");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/invoice?id=${invoiceId}`);
        const result = await response.json();

        if (response.ok && result.success) {
          setInvoice(result.invoice);
        } else {
          setError(result.error || "Failed to fetch invoice");
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Invoice Preview" subTitle="Home" />
        <div className="grid grid-cols-12 justify-center">
          <div className="col-span-12">
            <div className="card__wrapper">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading invoice...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Invoice Preview" subTitle="Home" />
        <div className="grid grid-cols-12 justify-center">
          <div className="col-span-12">
            <div className="card__wrapper">
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">
                  {error || "Invoice not found"}
                </p>
                <Link
                  href="/invoice/app-invoice-list"
                  className="btn btn-primary"
                >
                  Back to Invoices
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      {/* -- App side area start -- */}
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Invoice Preview" subTitle="Home" />
        <div className="grid grid-cols-12 justify-center">
          <div className="col-span-12">
            <div className="card__wrapper">
              <div className="flex justify-between xl:flex-row sm:flex-row flex-col">
                <div className="mb-[5px]">
                  <div className="invoice__logo mb-5">
                    <Image
                      className="light-logo"
                      src={logoLight}
                      priority
                      alt="payslip logo"
                    />
                    <Image
                      className="dark-logo"
                      src={darkLogo}
                      priority
                      alt="payslip logo"
                    />
                  </div>
                  {/* Company information should come from company settings/API */}
                  <p className="mb-[5px] text-muted">
                    Company information not available
                  </p>
                </div>
                <div>
                  <div className="mb-2.5">
                    <h5 className="card__heading-title">
                      Invoice No. {invoice.invoiceNumber}
                    </h5>
                  </div>
                  <div className="mb-2.5">
                    <span>Date: </span>
                    <span className="font-semibold">
                      {new Date(invoice.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mb-2.4">
                    <span>Date Due: </span>
                    <span className="font-semibold">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="invoice-line"></div>
              <div className="grid grid-cols-12 gap-y-5 gap-0 md:gap-x-[60px]">
                <div className="col-span-12 sm:col-span-6">
                  <div className="mb-5">
                    <h5 className="card__heading-title">Billing Address</h5>
                  </div>
                  <div className="invoice__address">
                    <h6 className="mb-[15px] font-semibold">
                      {invoice.billingAddress.fullName}
                    </h6>
                    <p>
                      Email: <span>{invoice.billingAddress.email}</span>{" "}
                    </p>
                    <p>
                      Address: <span>{invoice.billingAddress.address}</span>
                    </p>
                    <p>
                      Phone: <span>{invoice.billingAddress.mobileNumber}</span>
                    </p>
                    {invoice.billingAddress.phoneNumber && (
                      <p>
                        Fax:{" "}
                        <span>{invoice.billingAddress.phoneNumber}</span>{" "}
                      </p>
                    )}
                  </div>
                </div>
                <div className="col-span-12 sm:col-span-6">
                  <div className="mb-5">
                    <h5 className="card__heading-title">Shipping Address</h5>
                  </div>
                  <div className="invoice__address">
                    <h6 className="mb-[15px] font-semibold">
                      {invoice.shippingAddress.fullName}
                    </h6>
                    <p>
                      Email: <span>{invoice.shippingAddress.email}</span>{" "}
                    </p>
                    <p>
                      Address: <span>{invoice.shippingAddress.address}</span>
                    </p>
                    <p>
                      Phone: <span>{invoice.shippingAddress.mobileNumber}</span>
                    </p>
                    {invoice.shippingAddress.phoneNumber && (
                      <p>
                        Fax:{" "}
                        <span>{invoice.shippingAddress.phoneNumber}</span>{" "}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="invoice-line"></div>
              <InvoicePreviewTable
                items={invoice.items}
                discount={invoice.discount}
                tax={invoice.tax}
                shippingCharge={invoice.shippingCharge}
                rebate={invoice.rebate}
                subtotal={invoice.subtotal}
                discountAmount={invoice.discountAmount}
                taxAmount={invoice.taxAmount}
                total={invoice.total}
                notes={invoice.notes}
              />
              <div className="invoice-line"></div>
              <div className="invoice__payment-details">
                <h5 className="card__heading-title mb-[15px]">
                  Payment Details:
                </h5>
                <p>
                  Payment Method:{" "}
                  <span>
                    {invoice.paymentMethod.type === "bank"
                      ? "Bank Account"
                      : invoice.paymentMethod.type === "paypal"
                        ? "PayPal"
                        : "Cash on Delivery"}
                  </span>
                </p>
                {invoice.paymentMethod.type === "bank" && (
                  <>
                    {invoice.paymentMethod.cardName && (
                      <p>
                        Card Holder:{" "}
                        <span>{invoice.paymentMethod.cardName}</span>
                      </p>
                    )}
                    {invoice.paymentMethod.cardNumber && (
                      <p>
                        Card Number:{" "}
                        <span>{invoice.paymentMethod.cardNumber}</span>
                      </p>
                    )}
                  </>
                )}
                {invoice.paymentMethod.type === "paypal" &&
                  invoice.paymentMethod.paypalEmail && (
                    <p>
                      PayPal Email:{" "}
                      <span>{invoice.paymentMethod.paypalEmail}</span>
                    </p>
                  )}
                <p>
                  Total Amount: <span>${invoice.total.toFixed(2)}</span>
                </p>
              </div>
              <div className="invoice-line"></div>
              <div className="flex flex-wrap gap-2.5 lg:justify-end">
                <button type="submit" className="btn btn-success">
                  <i className="fa-sharp fa-light fa-floppy-disk"></i> Save
                </button>
                <Link
                  className="btn btn-warning"
                  href="assets/pdf/invoice-print-version.pdf"
                  download="invoice-print-version.pdf"
                >
                  <i className="fa-sharp fa-thin fa-file-arrow-down"></i>{" "}
                  Download
                </Link>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-light fa-paper-plane"></i> Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* -- App side area end -- */}
    </>
  );
};

export default AppInvoicePreviewMainArea;
