import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { email, role, department, inviteLink } = await req.json();

    if (!email || !inviteLink) {
      return NextResponse.json(
        { error: "Missing required fields: email and inviteLink" },
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

    const { data, error } = await resend.emails.send({
      from: "HRM Portal <onboarding@resend.dev>",
      to: [email],
      subject: "You've Been Invited to HRM Portal",
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
                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:40px 40px 32px;text-align:center;">
                        <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0;letter-spacing:-0.5px;">HRM Portal</h1>
                        <p style="color:#bfdbfe;font-size:14px;margin:8px 0 0;">Human Resource Management System</p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px;">
                        <h2 style="color:#1e293b;font-size:22px;font-weight:600;margin:0 0 16px;">You're Invited! 🎉</h2>
                        <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 16px;">
                          Hello,
                        </p>
                        <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 24px;">
                          You have been invited to join our HRM Portal${
                            role
                              ? ` for the position of <strong style="color:#1e293b;">${role}</strong>`
                              : ""
                          }${
                            department
                              ? ` in the <strong style="color:#1e293b;">${department}</strong> department`
                              : ""
                          }. Please complete your profile and upload the required documents.
                        </p>

                        <!-- CTA Button -->
                        <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                          <tr>
                            <td style="border-radius:8px;background:linear-gradient(135deg,#2563eb,#4f46e5);">
                              <a href="${inviteLink}"
                                 style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.2px;">
                                Accept Invitation →
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- Divider -->
                        <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;" />

                        <p style="color:#94a3b8;font-size:13px;margin:0 0 8px;">
                          Or copy and paste this link into your browser:
                        </p>
                        <div style="background:#f1f5f9;border-radius:6px;padding:14px 16px;word-break:break-all;">
                          <a href="${inviteLink}" style="color:#2563eb;font-size:13px;text-decoration:none;">${inviteLink}</a>
                        </div>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
                        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;line-height:1.6;">
                          This invitation link will expire in <strong>7 days</strong>.<br/>
                          If you did not expect this email, you can safely ignore it.
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
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("send-invite route error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
