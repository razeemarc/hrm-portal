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
  startDate: number;
  companyName?: string;
  companyAddress?: string;
  hrName?: string;
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

  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.candidateName}-offer-letter.pdf`;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}