import "./globals.css";
import "../style/index.scss";
import AppProvider from "@/lib/contextApi/AppProvider";
import ReduxProvider from "@/redux/provider";
import { DirectionProvider } from "@/hooks/useDirection";
import Setting from "@/common/setting/Setting";
import { Toaster } from "sonner";
import { AuthUserProvider } from '@/context/UserAuthContext';
import SessionMonitor from '@/components/SessionMonitor'; // Add this import

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <html lang="en">
        <head>
          <meta httpEquiv="x-ua-compatible" content="ie=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
          <meta name="robots" content="index, follow" />
          
          {/* Primary Meta Tags for AfriHRM */}
          <title>AfriHRM | Human Resource Management Solution</title>
          <meta name="description" content="AfriHRM is a modern, comprehensive human resource management solution designed to streamline your HR processes, from employee onboarding to payroll management." />
          <meta name="keywords" content="HRM, Human Resources, HR Software, HR Solution, Payroll, Employee Management, Talent Management" />
          <meta name="author" content="AfriHRM" />
          
          {/* Open Graph / Social Media Tags */}
          <meta property="og:title" content="AfriHRM | Human Resource Management Solution" />
          <meta property="og:description" content="AfriHRM is a modern, comprehensive human resource management solution designed to streamline your HR processes, from employee onboarding to payroll management." />
          <meta property="og:url" content="https://afrihrm.com" />
          <meta property="og:image" content="https://afrihrm.com/assets/images/social-share.jpg" />
          <meta property="og:type" content="website" />
          
          {/* Twitter Card Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="AfriHRM | Human Resource Management Solution" />
          <meta name="twitter:description" content="AfriHRM is a modern, comprehensive human resource management solution designed to streamline your HR processes, from employee onboarding to payroll management." />
          <meta name="twitter:image" content="https://afrihrm.com/assets/images/twitter-card.jpg" />
          
          {/* Favicon Configuration */}
          <link rel="icon" type="image/x-icon" href="/assets/images/favicon.ico" />
          <link rel="shortcut icon" type="image/x-icon" href="/assets/images/favicon.ico" />
          <link rel="apple-touch-icon" href="/assets/images/favicon.ico" />
          <meta name="msapplication-TileImage" content="/assets/images/favicon.ico" />
          
          {/* Additional Fonts & Styles */}
          <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
        </head>
        <body suppressHydrationWarning={true} className="body-area">
          <ReduxProvider>
            <AppProvider>
              <DirectionProvider>
                <AuthUserProvider>
                  
                  {children}
                </AuthUserProvider>
                <Setting />
              </DirectionProvider>
            </AppProvider>
            <Toaster position="top-center" richColors />
          </ReduxProvider>
        </body>
      </html>
    </>
  );
}