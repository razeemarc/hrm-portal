// generateOfferLetter.ts

"use client";

import { pdf } from "@react-pdf/renderer";
import { EmployeeOfferTemplate, InternOfferTemplate } from "@/templates/OfferLetterTemplate";

interface OfferData {
  candidateName: string;
  candidateEmail: string;
  offerType: "intern" | "employee";
  role: string;
  department: string;
  package: number;
  packageType: "lpa" | "monthly" | "stipend"; // ✅ was missing — caused wrong amount display in PDF
  startDate: number;
  companyName?: string;
  companyAddress?: string;
  hrName?: string;
  hrSignature?: string;
  companyLogo?: string;
}

const defaultCompanyInfo = {
  companyName: "Ladder Academy",
  companyAddress: "123 Tech Street, San Francisco, CA 94102",
  hrName: "HR Manager",
};

export async function generateOfferLetterPDF(data: OfferData): Promise<Blob> {
  const templateData = {
    ...defaultCompanyInfo,
    ...data,
    // ✅ Ensure package is always a clean number (guards against string input from form fields)
    package: Number(data.package),
  };

  const Template =
    data.offerType === "intern"
      ? InternOfferTemplate
      : EmployeeOfferTemplate;

  const blob = await pdf(<Template {...templateData} />).toBlob();
  return blob;
}

export async function downloadOfferLetter(data: OfferData) {
  const blob = await generateOfferLetterPDF(data);
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = `${data.candidateName}-offer-letter.pdf`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}