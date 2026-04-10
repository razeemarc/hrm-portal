import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

type SendOfferRequest = {
  email?: string;
  candidateName?: string;
  companyName?: string;
  role?: string;
  offerUrl?: string;
  documentUrl?: string;
  pdfBase64?: string;
  pdfFilename?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export async function POST(req: NextRequest) {
  try {
    const {
      email,
      candidateName = "Candidate",
      companyName = "Ladder Academy",
      role,
      offerUrl,
      documentUrl,
      pdfBase64,
      pdfFilename = "offer-letter.pdf",
    } = (await req.json()) as SendOfferRequest;

    if (!email) {
      return NextResponse.json(
        { error: "Missing required field: email" },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "HRM Portal <onboarding@resend.dev>";
    const safeCandidateName = escapeHtml(candidateName);
    const safeCompanyName = escapeHtml(companyName);
    const safeRole = role ? escapeHtml(role) : "";
    const safeOfferUrl = offerUrl ? escapeHtml(offerUrl) : "";
    const safeDocumentUrl = documentUrl ? escapeHtml(documentUrl) : "";
    const safePdfFilename = escapeHtml(pdfFilename);
    const attachments = pdfBase64
      ? [
          {
            filename: pdfFilename,
            content: Buffer.from(pdfBase64, "base64"),
            content_type: "application/pdf",
          },
        ]
      : undefined;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `Offer Letter from ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width" />
          </head>
          <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
                    <tr>
                      <td style="background:linear-gradient(135deg,#1e293b,#7c3aed);padding:40px;text-align:center;">
                        <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0;">${safeCompanyName}</h1>
                        <p style="color:#ddd6fe;font-size:14px;margin:8px 0 0;">Offer Letter</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;">
                        <h2 style="color:#1e293b;font-size:22px;font-weight:600;margin:0 0 16px;">Congratulations, ${safeCandidateName}!</h2>
                        <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 16px;">
                          We are pleased to share your offer letter${safeRole ? ` for the <strong style="color:#1e293b;">${safeRole}</strong> role` : ""}.
                        </p>
                        <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 24px;">
                          Your offer letter is attached to this email as a PDF${offerUrl ? ", and you can also review it online using the secure link below." : "."}
                        </p>
                        ${offerUrl ? `
                          <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                            <tr>
                              <td style="border-radius:8px;background:linear-gradient(135deg,#1e293b,#7c3aed);">
                                <a href="${safeOfferUrl}"
                                   style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;">
                                  View Offer Letter
                                </a>
                              </td>
                            </tr>
                          </table>
                        ` : ""}
                        ${pdfBase64 ? `
                          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px;">
                            Attached file: <strong>${safePdfFilename}</strong>
                          </p>
                        ` : ""}
                        ${safeDocumentUrl ? `
                          <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 16px;">
                            You can also download the generated PDF here:
                            <a href="${safeDocumentUrl}" style="color:#7c3aed;text-decoration:none;">Download PDF</a>
                          </p>
                        ` : ""}
                        ${offerUrl ? `
                          <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;" />
                          <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">
                            Or copy and paste this link into your browser:
                          </p>
                          <div style="background:#f1f5f9;border-radius:6px;padding:14px 16px;word-break:break-all;">
                            <a href="${safeOfferUrl}" style="color:#7c3aed;font-size:13px;text-decoration:none;">${safeOfferUrl}</a>
                          </div>
                        ` : ""}
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
                        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;line-height:1.6;">
                          If you were not expecting this offer letter, please ignore this email.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      attachments,
    });

    if (error) {
      console.error("Resend offer error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("send-offer route error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
