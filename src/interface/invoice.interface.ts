export interface IInvoiceItem {
  id: string;
  productName: string;
  productDetails: string;
  rate: number;
  quantity: number;
  amount: number;
}

export interface IAddress {
  fullName: string;
  email: string;
  address: string;
  mobileNumber: string;
  phoneNumber: string;
}

export interface IPaymentMethod {
  type: "bank" | "paypal" | "cash";
  cardName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  paypalEmail?: string;
}

export interface ICreateInvoice {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  billingAddress: IAddress;
  shippingAddress: IAddress;
  items: IInvoiceItem[];
  paymentMethod: IPaymentMethod;
  notes: string;
  discount: number; // percentage
  tax: number; // percentage
  shippingCharge: number;
  rebate: number;
}
