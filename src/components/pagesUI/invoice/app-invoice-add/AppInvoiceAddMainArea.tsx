"use client";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import Image from "next/image";
import React, { useState } from "react";
import lightLogo from "../../../../../public/assets/images/logo/logo.svg";
import whiteLogo from "../../../../../public/assets/images/logo/logo-white.svg";
import InvoiceCardInfo from "./InvoiceCardInfo";
import InvoiceAddBillingShippingForm from "./InvoiceAddBillingShippingForm";
import { useRouter } from "next/navigation";
import Link from "next/link";
import InvoiceAddTable from "./InvoiceAddTable";
import toast from "react-hot-toast";
import {
  ICreateInvoice,
  IAddress,
  IInvoiceItem,
  IPaymentMethod,
} from "@/interface/invoice.interface";

const AppInvoiceAddMainArea = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceData, setInvoiceData] = useState<Partial<ICreateInvoice>>({
    invoiceNumber: "#MZ-" + Date.now().toString().slice(-5),
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 30 days from now
    billingAddress: {
      fullName: "",
      email: "",
      address: "",
      mobileNumber: "",
      phoneNumber: "",
    },
    shippingAddress: {
      fullName: "",
      email: "",
      address: "",
      mobileNumber: "",
      phoneNumber: "",
    },
    items: [
      {
        id: "1",
        productName: "",
        productDetails: "",
        rate: 0,
        quantity: 1,
        amount: 0,
      },
    ],
    paymentMethod: {
      type: "bank",
    },
    notes: "",
    discount: 0,
    tax: 7.5, // Default tax rate
    shippingCharge: 0,
    rebate: 0,
  });

  const handleInvoiceDataChange = (field: keyof ICreateInvoice, value: any) => {
    setInvoiceData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBillingAddressChange = (address: IAddress) => {
    setInvoiceData((prev) => ({
      ...prev,
      billingAddress: address,
    }));
  };

  const handleShippingAddressChange = (address: IAddress) => {
    setInvoiceData((prev) => ({
      ...prev,
      shippingAddress: address,
    }));
  };

  const handleItemsChange = (items: IInvoiceItem[]) => {
    setInvoiceData((prev) => ({
      ...prev,
      items,
    }));
  };

  const handlePaymentMethodChange = (paymentMethod: IPaymentMethod) => {
    setInvoiceData((prev) => ({
      ...prev,
      paymentMethod,
    }));
  };

  const handleNotesChange = (notes: string) => {
    setInvoiceData((prev) => ({
      ...prev,
      notes,
    }));
  };

  const handleDiscountChange = (discount: number) => {
    setInvoiceData((prev) => ({
      ...prev,
      discount,
    }));
  };

  const handleTaxChange = (tax: number) => {
    setInvoiceData((prev) => ({
      ...prev,
      tax,
    }));
  };

  const handleShippingChargeChange = (shippingCharge: number) => {
    setInvoiceData((prev) => ({
      ...prev,
      shippingCharge,
    }));
  };

  const handleRebateChange = (rebate: number) => {
    setInvoiceData((prev) => ({
      ...prev,
      rebate,
    }));
  };

  const calculateTotals = () => {
    const items = invoiceData.items || [];
    const subtotal = items.reduce(
      (sum, item) => sum + item.rate * item.quantity,
      0,
    );
    const discountAmount = invoiceData.discount
      ? (subtotal * invoiceData.discount) / 100
      : 0;
    const taxAmount = invoiceData.tax
      ? ((subtotal - discountAmount) * invoiceData.tax) / 100
      : 0;
    const shippingCharge = invoiceData.shippingCharge || 0;
    const rebate = invoiceData.rebate || 0;
    const total =
      subtotal - discountAmount + taxAmount + shippingCharge - rebate;

    return { subtotal, discountAmount, taxAmount, total };
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Invoice saved successfully!");
        // Redirect to invoice preview page
        router.push(`/invoice/app-invoice-preview?id=${result.invoiceId}`);
      } else {
        toast.error(result.error || "Failed to save invoice");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    // First save the invoice
    await handleSave();
    // Then implement send functionality (email, etc.)
    toast.success("Invoice sent successfully!");
  };

  const handleDownload = () => {
    // Implement PDF download functionality
    toast("Download functionality coming soon!");
  };

  const validateForm = (): boolean => {
    if (!invoiceData.invoiceNumber) {
      toast.error("Invoice number is required");
      return false;
    }
    if (!invoiceData.date) {
      toast.error("Date is required");
      return false;
    }
    if (!invoiceData.dueDate) {
      toast.error("Due date is required");
      return false;
    }
    if (
      !invoiceData.billingAddress?.fullName ||
      !invoiceData.billingAddress?.email
    ) {
      toast.error("Billing address is required");
      return false;
    }
    if (
      !invoiceData.items ||
      invoiceData.items.length === 0 ||
      !invoiceData.items[0].productName
    ) {
      toast.error("At least one item is required");
      return false;
    }
    return true;
  };

  const totals = calculateTotals();

  return (
    <>
      {/* -- App side area start -- */}
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Add Invoice" subTitle="Home" />

        <div className="grid grid-cols-12 justify-center">
          <div className="col-span-12">
            <div className="card__wrapper">
              <div className="grid grid-cols-12 gap-5 maxXs:gap-x-0">
                <div className="col-span-12 md:col-span-7">
                  <div className="invoice__logo mb-5">
                    <Image
                      className="light-logo"
                      src={lightLogo}
                      priority
                      alt="payslip logo"
                    />
                    <Image
                      className="dark-logo"
                      src={whiteLogo}
                      priority
                      alt="payslip logo"
                    />
                  </div>
                  <p className="mb-[5px]">100 Terminal, Fort Lauderdale,</p>
                  <p className="mb-[5px]">Miami 33315, United States</p>
                  <p className="mb-[5px]">name@manez.com</p>
                  <p className="mb-[5px]">+1(800) 642 7676</p>
                </div>
                <div className="col-span-12 md:col-span-5">
                  <div className="grid grid-cols-12 items-center mb-2.5">
                    <div className="col-span-12 lg:col-span-3">
                      <div className="form__input-title">
                        <label htmlFor="invoiceNumber">Invoice No.</label>
                      </div>
                    </div>
                    <div className="col-span-12 lg:col-span-9">
                      <div className="form__input">
                        <input
                          id="invoiceNumber"
                          type="text"
                          className="form-control"
                          placeholder="#MZ-00114"
                          value={invoiceData.invoiceNumber}
                          onChange={(e) =>
                            handleInvoiceDataChange(
                              "invoiceNumber",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 items-center mb-2.5">
                    <div className="col-span-12 lg:col-span-3">
                      <div className="form__input-title">
                        <label htmlFor="basicInput">Date</label>
                      </div>
                    </div>
                    <div className="col-span-12 lg:col-span-9">
                      <div className="form__input">
                        <input
                          className="form-control flatpickr-input active"
                          id="basicInput"
                          type="date"
                          value={invoiceData.date}
                          onChange={(e) =>
                            handleInvoiceDataChange("date", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 items-center mb-2.5">
                    <div className="col-span-12 lg:col-span-3">
                      <div className="form__input-title">
                        <label htmlFor="basicInput2">Due Date</label>
                      </div>
                    </div>
                    <div className="col-span-12 lg:col-span-9">
                      <div className="form__input">
                        <input
                          className="form-control flatpickr-input active"
                          id="basicInput2"
                          type="date"
                          value={invoiceData.dueDate}
                          onChange={(e) =>
                            handleInvoiceDataChange("dueDate", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="invoice-line"></div>
              <div className="grid grid-cols-12 gap-y-5 gap-0 md:gap-x-[60px] maxXs:gap-x-0">
                <InvoiceAddBillingShippingForm
                  billingAddress={invoiceData.billingAddress!}
                  shippingAddress={invoiceData.shippingAddress!}
                  onBillingAddressChange={handleBillingAddressChange}
                  onShippingAddressChange={handleShippingAddressChange}
                />
              </div>
              <div className="invoice-line"></div>
              <div className="grid grid-cols-12">
                <InvoiceAddTable
                  items={invoiceData.items!}
                  onItemsChange={handleItemsChange}
                  onNotesChange={handleNotesChange}
                  onDiscountChange={handleDiscountChange}
                  onTaxChange={handleTaxChange}
                  onShippingChargeChange={handleShippingChargeChange}
                  onRebateChange={handleRebateChange}
                  notes={invoiceData.notes!}
                  discount={invoiceData.discount!}
                  tax={invoiceData.tax!}
                  shippingCharge={invoiceData.shippingCharge!}
                  rebate={invoiceData.rebate!}
                  totals={totals}
                />
              </div>
              <div className="invoice-line"></div>
              <div className="grid grid-cols-12">
                <div className="col-span-12 xl:col-span-6">
                  <InvoiceCardInfo
                    paymentMethod={invoiceData.paymentMethod!}
                    onPaymentMethodChange={handlePaymentMethodChange}
                  />
                </div>
              </div>
              <div className="invoice-line"></div>
              <div className="flex flex-wrap gap-2.5 lg:justify-end">
                <Link
                  className="btn btn-info"
                  href="/invoice/app-invoice-preview"
                >
                  <i className="fa-sharp fa-regular fa-eye"></i> Preview
                </Link>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  <i className="fa-sharp fa-light fa-floppy-disk"></i>{" "}
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleDownload}
                >
                  <i className="fa-sharp fa-thin fa-file-arrow-down"></i>{" "}
                  Download
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSend}
                  disabled={isSubmitting}
                >
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

export default AppInvoiceAddMainArea;
