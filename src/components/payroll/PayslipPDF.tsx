// src/components/payroll/PayslipPDF.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 30, 
    fontSize: 12, 
    fontFamily: 'Helvetica' 
  },
  section: { 
    marginBottom: 10 
  },
  title: { 
    fontSize: 18, 
    marginBottom: 20, 
    textAlign: 'center', 
    fontWeight: 'bold' 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 5 
  },
  label: { 
    color: '#666' 
  },
  value: { 
    fontWeight: 'bold' 
  },
  line: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE', 
    marginVertical: 10 
  }
});

interface PayrollData {
  employeeName?: string;
  employeeUid?: string;
  month?: string;
  year?: string | number;
  basicSalary?: string | number;
  netPay?: string | number;
  email?: string;
  employeeDisplay?: {
    email?: string;
    name?: string;
  };
}

interface CompanyData {
  name?: string;
  address?: string;
  branding?: {
    logoUrl?: string;
  };
}

interface PayslipPDFProps {
  payroll: PayrollData;
  company: CompanyData;
}

// Default export - must return a Document component
const PayslipPDF: React.FC<PayslipPDFProps> = ({ payroll, company }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.section}>
          <Text style={styles.title}>PAYSLIP</Text>
          <Text>{company?.name || 'Company Name'}</Text>
          {company?.address && <Text>{company.address}</Text>}
        </View>
        
        <View style={styles.line} />
        
        {/* Employee Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Employee Name:</Text>
            <Text style={styles.value}>{payroll?.employeeName || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Period:</Text>
            <Text style={styles.value}>
              {payroll?.month || ''} {payroll?.year || ''}
            </Text>
          </View>
          {(payroll?.employeeDisplay?.email || payroll?.email) && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>
                {payroll?.employeeDisplay?.email || payroll?.email}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.line} />
        
        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
            Payment Details
          </Text>
          <View style={styles.row}>
            <Text>Basic Salary</Text>
            <Text>${payroll?.basicSalary || '0.00'}</Text>
          </View>
          <View style={styles.line} />
          <View style={styles.row}>
            <Text style={{ fontWeight: 'bold', fontSize: 14 }}>Net Payable</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 14 }}>
              ${payroll?.netPay || '0.00'}
            </Text>
          </View>
        </View>
        
        {/* Footer */}
        <View style={{ marginTop: 40, fontSize: 10, color: '#666' }}>
          <Text>This is a computer-generated document.</Text>
          <Text style={{ marginTop: 5 }}>
            Generated on: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default PayslipPDF;