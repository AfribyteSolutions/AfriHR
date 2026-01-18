import React from "react";
import { IInvoiceItem } from "@/interface/invoice.interface";

interface InvoiceAddTableProps {
  items: IInvoiceItem[];
  onItemsChange: (items: IInvoiceItem[]) => void;
  onNotesChange: (notes: string) => void;
  onDiscountChange: (discount: number) => void;
  onTaxChange: (tax: number) => void;
  onShippingChargeChange: (shippingCharge: number) => void;
  onRebateChange: (rebate: number) => void;
  notes: string;
  discount: number;
  tax: number;
  shippingCharge: number;
  rebate: number;
  totals: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
  };
}

const InvoiceAddTable: React.FC<InvoiceAddTableProps> = ({
  items,
  onItemsChange,
  onNotesChange,
  onDiscountChange,
  onTaxChange,
  onShippingChargeChange,
  onRebateChange,
  notes,
  discount,
  tax,
  shippingCharge,
  rebate,
  totals,
}) => {
  const handleItemChange = (
    index: number,
    field: keyof IInvoiceItem,
    value: string | number,
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Calculate amount if rate or quantity changed
    if (field === "rate" || field === "quantity") {
      updatedItems[index].amount =
        updatedItems[index].rate * updatedItems[index].quantity;
    }

    onItemsChange(updatedItems);
  };

  const addItem = () => {
    const newItem: IInvoiceItem = {
      id: Date.now().toString(),
      productName: "",
      productDetails: "",
      rate: 0,
      quantity: 1,
      amount: 0,
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      onItemsChange(updatedItems);
    }
  };
  return (
    <>
      <div className="col-span-12 table-responsive">
        <table
          className="table table-bordered table-nowrap w-full maxMd:min-w-[900px] maxMd:overflow-x-auto mb-0"
          id="productTableRepeater"
        >
          <thead className="align-middle">
            <tr className="table__title bg-title">
              <th scope="col" className="" style={{ width: "30px" }}>
                #
              </th>
              <th scope="col">Product Details</th>
              <th scope="col" style={{ width: "120px" }}>
                Rate
              </th>
              <th scope="col" style={{ width: "120px" }}>
                Quantity
              </th>
              <th scope="col" className="text-end" style={{ width: "150px" }}>
                Amount
              </th>
              <th
                scope="col"
                className="text-end"
                style={{ width: "30px" }}
              ></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="product">
                <td>{index + 1}</td>
                <td className="text-start">
                  <div className="mb-2.5">
                    <input
                      type="text"
                      className="form-control"
                      id={`productName-${index}`}
                      placeholder="Product Name"
                      value={item.productName}
                      onChange={(e) =>
                        handleItemChange(index, "productName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <textarea
                    className="form-control"
                    id={`productDetails-${index}`}
                    rows={2}
                    placeholder="Product Details"
                    value={item.productDetails}
                    onChange={(e) =>
                      handleItemChange(index, "productDetails", e.target.value)
                    }
                  ></textarea>
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control product-rate"
                    id={`productRate-${index}`}
                    step="0.01"
                    placeholder="0.00"
                    value={item.rate}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "rate",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control product-quantity"
                    id={`productQnty-${index}`}
                    placeholder="1"
                    min="1"
                    max="1000"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "quantity",
                        parseInt(e.target.value) || 1,
                      )
                    }
                  />
                </td>
                <td className="text-end">
                  <div>
                    <input
                      type="text"
                      className="form-control total-price"
                      id={`productTotalPrice-${index}`}
                      placeholder="$0.00"
                      value={`$${item.amount.toFixed(2)}`}
                      readOnly
                    />
                  </div>
                </td>
                <td>
                  <button
                    id={`productRemoval-${index}`}
                    className="product__removal-btn"
                    onClick={() => removeItem(index)}
                    type="button"
                  >
                    <span>
                      <i className="fa-solid fa-xmark"></i>
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tbody>
            <tr>
              <td colSpan={5}>
                <button
                  id="addItemBtn"
                  className="btn btn-primary"
                  onClick={addItem}
                  type="button"
                >
                  Add Item
                </button>
              </td>
            </tr>
            <tr className="invoice-line">
              <td colSpan={2} className="align-middle">
                <div className="form__input-title">
                  <label htmlFor="extraNote">Notes:</label>
                </div>
                <textarea
                  className="form-control"
                  id="extraNote"
                  placeholder="Extra Notes..."
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                ></textarea>
              </td>
              <td colSpan={0}></td>
              <td colSpan={3} className="p-0">
                <table className="table table-borderless last-row-no-border mb-0 mt-15">
                  <tbody>
                    <tr>
                      <td>Sub Total :</td>
                      <td className="text-end">
                        ${totals.subtotal.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Discount:{" "}
                        <span className="text-black dark:text-white font-bold">
                          ({discount}%)
                        </span>
                      </td>
                      <td className="text-end">
                        -${totals.discountAmount.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Vat :
                        <span className="text-black dark:text-white font-bold">
                          ({tax}%)
                        </span>
                      </td>
                      <td className="text-end">
                        +${totals.taxAmount.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td>Shipping Charge :</td>
                      <td className="text-end">
                        <input
                          type="number"
                          className="form-control d-inline-block w-auto"
                          value={shippingCharge}
                          onChange={(e) =>
                            onShippingChargeChange(
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          step="0.01"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                    <tr className="border-top">
                      <th scope="row">Total :</th>
                      <th className="text-end">
                        $
                        {(
                          totals.subtotal -
                          totals.discountAmount +
                          totals.taxAmount +
                          shippingCharge
                        ).toFixed(2)}
                      </th>
                    </tr>
                    <tr className="border-top">
                      <td>Rebate :</td>
                      <td className="text-end">
                        <input
                          type="number"
                          className="form-control d-inline-block w-auto"
                          value={rebate}
                          onChange={(e) =>
                            onRebateChange(parseFloat(e.target.value) || 0)
                          }
                          step="0.01"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                    <tr className="border-top">
                      <th scope="row">Payable Amount :</th>
                      <th className="text-end">${totals.total.toFixed(2)}</th>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default InvoiceAddTable;
