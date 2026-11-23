import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Expensio — Personal Expense Tracker",
  description: "Track spending, budgets, and monthly expenses.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
