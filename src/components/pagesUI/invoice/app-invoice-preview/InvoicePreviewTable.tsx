import React from "react";

interface InvoiceItem {
  id: string;
  productName: string;
  productDetails: string;
  rate: number;
  quantity: number;
  amount: number;
}

interface InvoicePreviewTableProps {
  items: InvoiceItem[];
  discount: number;
  tax: number;
  shippingCharge: number;
  rebate: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

const InvoicePreviewTable: React.FC<InvoicePreviewTableProps> = ({
  items,
  discount,
  tax,
  shippingCharge,
  rebate,
  subtotal,
  discountAmount,
  taxAmount,
  total,
}) => {
  return (
    <>
      <div className="table-responsive">
        <table className="table table-bordered w-full text-center table-nowrap align-middle mb-0">
          <thead>
            <tr className="table__title bg-title">
              <th scope="col" style={{ width: "50px" }}>
                #
              </th>
              <th scope="col">Product Details</th>
              <th scope="col" style={{ width: "50px" }}>
                Rate
              </th>
              <th scope="col" style={{ width: "50px" }}>
                Quantity
              </th>
              <th scope="col" className="text-start">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <th scope="row">{index + 1}</th>
                <td className="text-start">
                  <span className="font-semibold">{item.productName}</span>
                  {item.productDetails && (
                    <p className="text-muted mb-0">{item.productDetails}</p>
                  )}
                </td>
                <td>${item.rate.toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td className="text-start">${item.amount.toFixed(2)}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">04</th>
              <td className="text-start">
                <span className="font-semibold">
                  12 Cup Programmable Drip Coffee Maker
                </span>
                <p className="text-muted mb-0">
                  Color:Black, Programmable, Removable Tank, Auto Clean
                  Function, Water Filter.
                </p>
              </td>
              <td>$119.50</td>
              <td>01</td>
              <td className="text-start">$119.50</td>
            </tr>
            <tr className="invoice-line">
              <td colSpan={4} className="text-start">
                <div className="form__input-title">
                  <label className="font-semibold">Notes:</label>
                </div>
                <span className="text-muted">
                  It was delightful collaborating with you. We look forward to
                  being considered for the next order. Thank you!
                </span>
              </td>
              <td colSpan={2} className="p-0 text-end">
                <div className="table-responsive">
                  <table className="table table-borderless last-row-no-border mb-0 mt-[15px]">
                    <tbody>
                      <tr>
                        <td>Sub Total :</td>
                        <td className="text-start">${subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>
                          Discount:{" "}
                          <span className="text-black dark:text-white font-bold">
                            {" "}
                            ({discount}%)
                          </span>
                        </td>
                        <td className="text-start">
                          -${discountAmount.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          Vat :
                          <span className="text-black dark:text-white font-bold">
                            {" "}
                            ({tax}%)
                          </span>
                        </td>
                        <td className="text-start">+${taxAmount.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>Shipping Charge :</td>
                        <td className="text-start">
                          ${shippingCharge.toFixed(2)}
                        </td>
                      </tr>
                      <tr className="border-top">
                        <th scope="row">Total :</th>
                        <th className="text-start">
                          $
                          {(
                            subtotal -
                            discountAmount +
                            taxAmount +
                            shippingCharge
                          ).toFixed(2)}
                        </th>
                      </tr>
                      <tr className="border-top">
                        <td>Rebate :</td>
                        <td className="text-start">-${rebate.toFixed(2)}</td>
                      </tr>
                      <tr className="border-top">
                        <th scope="row">Payable Amount :</th>
                        <th className="text-start">${total.toFixed(2)}</th>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default InvoicePreviewTable;
