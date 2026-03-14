import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf", fontWeight: "normal" },
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc9.ttf", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: "Helvetica",
    fontSize: 12,
    lineHeight: 1.5,
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 10,
    color: "#666",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  date: {
    textAlign: "right",
    marginBottom: 30,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },
  paragraph: {
    marginBottom: 10,
    textAlign: "justify",
  },
  table: {
    marginVertical: 20,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 5,
  },
  tableHeader: {
    fontWeight: "bold",
    backgroundColor: "#f5f5f5",
  },
  signature: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBlock: {
    width: 150,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 5,
    marginTop: 40,
  },
  signatureLabel: {
    fontSize: 10,
    color: "#666",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 9,
    color: "#999",
  },
});

interface OfferLetterData {
  candidateName: string;
  candidateEmail: string;
  offerType: "intern" | "employee";
  role: string;
  department: string;
  package: number;
  startDate: number;
  companyName: string;
  companyAddress: string;
  hrName: string;
}

export const EmployeeOfferTemplate: React.FC<OfferLetterData> = ({
  candidateName,
  candidateEmail,
  role,
  department,
  package: salary,
  startDate,
  companyName,
  companyAddress,
  hrName,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>{companyName}</Text>
        <Text style={styles.companyAddress}>{companyAddress}</Text>
      </View>

      {/* Date */}
      <View style={styles.date}>
        <Text>Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</Text>
      </View>

      {/* Candidate Address */}
      <View style={{ marginBottom: 20 }}>
        <Text>To,</Text>
        <Text>{candidateName}</Text>
        <Text>{candidateEmail}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>LETTER OF APPOINTMENT</Text>

      {/* Body */}
      <View style={styles.section}>
        <Text style={styles.paragraph}>
          Dear {candidateName},
        </Text>
        <Text style={styles.paragraph}>
          We are pleased to offer you the position of <Text style={{ fontWeight: "bold" }}>{role}</Text> at {companyName}. We believe your skills and experience will be a valuable addition to our {department} team.
        </Text>
      </View>

      {/* Terms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Employment Details</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Description</Text>
            <Text style={styles.tableCell}>Details</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Position</Text>
            <Text style={styles.tableCell}>{role}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Department</Text>
            <Text style={styles.tableCell}>{department}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Employment Type</Text>
            <Text style={styles.tableCell}>Full-time</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Start Date</Text>
            <Text style={styles.tableCell}>
              {new Date(startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Annual CTC</Text>
            <Text style={styles.tableCell}>${salary.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Benefits</Text>
        <Text style={styles.paragraph}>
          As a full-time employee, you will be entitled to:
        </Text>
        <Text style={styles.paragraph}>• Annual performance review</Text>
        <Text style={styles.paragraph}>• Health insurance coverage</Text>
        <Text style={styles.paragraph}>• Paid time off (15 days per year)</Text>
        <Text style={styles.paragraph}>• Professional development opportunities</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Acceptance</Text>
        <Text style={styles.paragraph}>
          This offer is valid for 14 days from the date of this letter. Please sign and return a copy of this letter to indicate your acceptance of the terms and conditions outlined herein.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.paragraph}>
          We look forward to welcoming you to the team!
        </Text>
      </View>

      {/* Signatures */}
      <View style={styles.signature}>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Candidate Signature</Text>
          <Text style={{ fontSize: 10, marginTop: 5 }}>{candidateName}</Text>
        </View>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Authorized Signatory</Text>
          <Text style={{ fontSize: 10, marginTop: 5 }}>{hrName}</Text>
          <Text style={{ fontSize: 10, color: "#666" }}>HR Manager</Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        This document is confidential and intended for the named recipient only.
      </Text>
    </Page>
  </Document>
);

export const InternOfferTemplate: React.FC<OfferLetterData> = ({
  candidateName,
  candidateEmail,
  role,
  department,
  package: stipend,
  startDate,
  companyName,
  companyAddress,
  hrName,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>{companyName}</Text>
        <Text style={styles.companyAddress}>{companyAddress}</Text>
      </View>

      {/* Date */}
      <View style={styles.date}>
        <Text>Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</Text>
      </View>

      {/* Candidate Address */}
      <View style={{ marginBottom: 20 }}>
        <Text>To,</Text>
        <Text>{candidateName}</Text>
        <Text>{candidateEmail}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>INTERNSHIP OFFER LETTER</Text>

      {/* Body */}
      <View style={styles.section}>
        <Text style={styles.paragraph}>
          Dear {candidateName},
        </Text>
        <Text style={styles.paragraph}>
          We are pleased to offer you an internship position as <Text style={{ fontWeight: "bold" }}>{role}</Text> at {companyName}. We believe this internship will provide you with valuable industry experience and help you develop your professional skills.
        </Text>
      </View>

      {/* Terms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Internship Details</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Description</Text>
            <Text style={styles.tableCell}>Details</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Position</Text>
            <Text style={styles.tableCell}>{role}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Department</Text>
            <Text style={styles.tableCell}>{department}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Internship Type</Text>
            <Text style={styles.tableCell}>Full-time</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Start Date</Text>
            <Text style={styles.tableCell}>
              {new Date(startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Monthly Stipend</Text>
            <Text style={styles.tableCell}>${stipend.toLocaleString()}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Duration</Text>
            <Text style={styles.tableCell}>6 Months</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Benefits</Text>
        <Text style={styles.paragraph}>
          As an intern, you will receive:
        </Text>
        <Text style={styles.paragraph}>• Monthly stipend</Text>
        <Text style={styles.paragraph}>• Mentorship from experienced professionals</Text>
        <Text style={styles.paragraph}>• Certificate of completion</Text>
        <Text style={styles.paragraph}>• Opportunity for full-time employment based on performance</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Terms & Conditions</Text>
        <Text style={styles.paragraph}>
          • The internship is for a period of 6 months, extendable based on performance.
          {'\n'}• Either party may terminate this internship with 7 days notice.
          {'\n'}• You are expected to maintain professionalism and adhere to company policies.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Acceptance</Text>
        <Text style={styles.paragraph}>
          Please sign and return a copy of this letter within 7 days to confirm your acceptance of this internship offer.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.paragraph}>
          We look forward to having you as part of our team!
        </Text>
      </View>

      {/* Signatures */}
      <View style={styles.signature}>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Intern Signature</Text>
          <Text style={{ fontSize: 10, marginTop: 5 }}>{candidateName}</Text>
        </View>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Authorized Signatory</Text>
          <Text style={{ fontSize: 10, marginTop: 5 }}>{hrName}</Text>
          <Text style={{ fontSize: 10, color: "#666" }}>HR Manager</Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        This document is confidential and intended for the named recipient only.
      </Text>
    </Page>
  </Document>
);