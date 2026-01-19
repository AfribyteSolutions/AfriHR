import { Checkbox, FormControlLabel } from "@mui/material";
import React, { useState } from "react";
import { IAddress } from "@/interface/invoice.interface";

interface InvoiceAddBillingShippingFormProps {
  billingAddress: IAddress;
  shippingAddress: IAddress;
  onBillingAddressChange: (address: IAddress) => void;
  onShippingAddressChange: (address: IAddress) => void;
}

const InvoiceAddBillingShippingForm: React.FC<
  InvoiceAddBillingShippingFormProps
> = ({
  billingAddress,
  shippingAddress,
  onBillingAddressChange,
  onShippingAddressChange,
}) => {
  const [sameAddress, setSameAddress] = useState(false);

  const handleBillingChange = (field: keyof IAddress, value: string) => {
    const updatedAddress = { ...billingAddress, [field]: value };
    onBillingAddressChange(updatedAddress);

    if (sameAddress) {
      onShippingAddressChange(updatedAddress);
    }
  };

  const handleShippingChange = (field: keyof IAddress, value: string) => {
    const updatedAddress = { ...shippingAddress, [field]: value };
    onShippingAddressChange(updatedAddress);
  };

  const handleSameAddressChange = (checked: boolean) => {
    setSameAddress(checked);
    if (checked) {
      onShippingAddressChange(billingAddress);
    }
  };
  return (
    <>
      <div className="col-span-12 xl:col-span-6">
        <div className="mb-[15px]">
          <h5 className="card__heading-title">Billing Address</h5>
        </div>
        <div className="grid grid-cols-12 items-center mb-2.5">
          <div className="col-span-12 lg:col-span-4">
            <div className="form__input-title">
              <label htmlFor="billingName">Full Name</label>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <input
              type="text"
              className="form-control"
              id="billingName"
              placeholder="Full Name"
              value={billingAddress.fullName}
              onChange={(e) => handleBillingChange("fullName", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-12 items-center mb-2.5">
          <div className="col-span-12 lg:col-span-4">
            <div className="form__input-title">
              <label htmlFor="billingEmail">Email</label>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <input
              type="email"
              className="form-control"
              id="billingEmail"
              placeholder="Email address"
              value={billingAddress.email}
              onChange={(e) => handleBillingChange("email", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-12 items-center mb-2.5">
          <div className="col-span-12 lg:col-span-4">
            <div className="form__input-title">
              <label htmlFor="billingAddress">Address</label>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <textarea
              className="form-control"
              id="billingAddress"
              rows={3}
              placeholder="Address"
              value={billingAddress.address}
              onChange={(e) => handleBillingChange("address", e.target.value)}
            ></textarea>
          </div>
        </div>
        <div className="grid grid-cols-12 items-center mb-2.5">
          <div className="col-span-12 lg:col-span-4">
            <div className="form__input-title">
              <label htmlFor="billingNumber">Mobile Number</label>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <input
              type="text"
              className="form-control"
              id="billingNumber"
              placeholder="+1(800) 642 7676"
              value={billingAddress.mobileNumber}
              onChange={(e) =>
                handleBillingChange("mobileNumber", e.target.value)
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-12 items-center mb-2.5">
          <div className="col-span-12 lg:col-span-4">
            <div className="form__input-title">
              <label htmlFor="billingPhone">Phone Number</label>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <input
              type="text"
              className="form-control"
              id="billingPhone"
              placeholder="+1(800) 642 7676"
              value={billingAddress.phoneNumber}
              onChange={(e) =>
                handleBillingChange("phoneNumber", e.target.value)
              }
            />
          </div>
        </div>
        <div className="form-check flex items-center">
          <FormControlLabel
            control={
              <Checkbox
                className="custom-checkbox"
                checked={sameAddress}
                onChange={(e) => handleSameAddressChange(e.target.checked)}
              />
            }
            label="Are your billing and shipping addresses the same?"
          />
        </div>
      </div>
      <div className="col-span-12 xl:col-span-6">
        <div className="mb-[15px]">
          <h5 className="card__heading-title">Shipping Address</h5>
        </div>
        <div className="grid grid-cols-12 items-center mb-2.5">
          <div className="col-span-12 lg:col-span-4">
            <div className="form__input-title">
              <label htmlFor="shippinggName">Full Name</label>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <input
              type="text"
              className="form-control"
              id="shippinggName"
              placeholder="Full Name"
              value={shippingAddress.fullName}
              onChange={(e) => handleShippingChange("fullName", e.target.value)}
              disabled={sameAddress}
            />
          </div>
        </div>
        <div className="grid grid-cols-12 items-center mb-2.5">
          <div className="col-span-12 lg:col-span-4">
            <div className="form__input-title">
              <label htmlFor="shippinggEmail">Email</label>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <input
              type="email"
              className="form-control"
              id="shippinggEmail"
              placeholder="Email address"
              value={shippingAddress.email}
              onChange={(e) => handleShippingChange("email", e.target.value)}
              disabled={sameAddress}
            />
          </div>
        </div>
        <div className="grid grid-cols-12 items-center mb-2.5">
          <div className="col-span-12 lg:col-span-4">
            <div className="form__input-title">
              <label htmlFor="shippinggAddress">Address</label>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <textarea
              className="form-control"
              id="shippinggAddress"
              rows={3}
              placeholder="Address"
              value={shippingAddress.address}
              onChange={(e) => handleShippingChange("address", e.target.value)}
              disabled={sameAddress}
            ></textarea>
          </div>
        </div>
        <div className="grid grid-cols-12 items-center mb-2.5">
          <div className="col-span-12 lg:col-span-4">
            <div className="form__input-title">
              <label htmlFor="shippinggNumber">Mobile Number</label>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <input
              type="text"
              className="form-control"
              id="shippinggNumber"
              placeholder="+1(800) 642 7676"
              value={shippingAddress.mobileNumber}
              onChange={(e) =>
                handleShippingChange("mobileNumber", e.target.value)
              }
              disabled={sameAddress}
            />
          </div>
        </div>
        <div className="grid grid-cols-12 items-center mb-2.5">
          <div className="col-span-12 lg:col-span-4">
            <div className="form__input-title">
              <label htmlFor="shippinggPhone">Phone Number</label>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <input
              type="text"
              className="form-control"
              id="shippinggPhone"
              placeholder="+1(800) 642 7676"
              value={shippingAddress.phoneNumber}
              onChange={(e) =>
                handleShippingChange("phoneNumber", e.target.value)
              }
              disabled={sameAddress}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceAddBillingShippingForm;
