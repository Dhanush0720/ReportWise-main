"use client";

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

// Note: metadata doesn't work with "use client", move to a separate layout if needed
// export const metadata: Metadata = {
//   title: "ReportWise",
//   description: "Autonomous Multi-Agent Data Workforce",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>ReportWise</title>
        <meta name="description" content="Autonomous Multi-Agent Data Workforce" />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-black" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

