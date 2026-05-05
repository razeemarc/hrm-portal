import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

type LeaveNotificationRequest = {
  adminEmail?: string;
  employeeEmail?: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status?: string;
  comments?: string;
  type: "application" | "decision";
};

export async function POST(req: NextRequest) {
  try {
    const {
      adminEmail,
      employeeEmail,
      employeeName,
      leaveType,
      startDate,
      endDate,
      reason,
      status,
      comments,
      type,
    } = (await req.json()) as LeaveNotificationRequest;

    if (!employeeName || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "HRM Portal <onboarding@resend.dev>";

    let emailOptions: any;

    if (type === "application" && adminEmail) {
      emailOptions = {
        from: fromEmail,
        to: [adminEmail],
        subject: `New Leave Request: ${employeeName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8" /></head>
            <body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
              <table width="100%" style="background:#f8fafc;padding:40px 0;">
                <tr>
                  <td align="center">
                    <table width="600" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
                      <tr>
                        <td style="background:linear-gradient(135deg,#1e293b,#7c3aed);padding:40px;text-align:center;">
                          <h1 style="color:#ffffff;font-size:28px;margin:0;">Leave Request</h1>
                          <p style="color:#ddd6fe;font-size:14px;margin:8px 0 0;">HRM Portal Notification</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:40px;">
                          <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">New Application Received</h2>
                          <p style="color:#475569;line-height:1.7;"><strong>${employeeName}</strong> has submitted a new leave request.</p>
                          <div style="background:#f1f5f9;border-radius:8px;padding:24px;margin:24px 0;">
                            <p><strong>Type:</strong> <span style="text-transform:capitalize;">${leaveType}</span></p>
                            <p><strong>Duration:</strong> ${startDate} to ${endDate}</p>
                            <p><strong>Reason:</strong> ${reason}</p>
                          </div>
                          <div style="text-align:center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/leaves" style="background:#7c3aed;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;">Review Request</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      };
    } else if (type === "decision" && employeeEmail) {
      const isApproved = status === "approved";
      emailOptions = {
        from: fromEmail,
        to: [employeeEmail],
        subject: `Leave Request ${isApproved ? 'Approved' : 'Rejected'}: ${leaveType}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8" /></head>
            <body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
              <table width="100%" style="background:#f8fafc;padding:40px 0;">
                <tr>
                  <td align="center">
                    <table width="600" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
                      <tr>
                        <td style="background:${isApproved ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#dc2626,#ef4444)'};padding:40px;text-align:center;">
                          <h1 style="color:#ffffff;font-size:28px;margin:0;">Leave ${isApproved ? 'Approved' : 'Rejected'}</h1>
                          <p style="color:#ecfdf5;font-size:14px;margin:8px 0 0;">HRM Portal Update</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:40px;">
                          <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;">Hello ${employeeName},</h2>
                          <p style="color:#475569;line-height:1.7;">Your leave request for <strong>${leaveType}</strong> has been <strong>${status}</strong>.</p>
                          <div style="background:#f1f5f9;border-radius:8px;padding:24px;margin:24px 0;">
                            <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
                            ${comments ? `<p><strong>Feedback:</strong> ${comments}</p>` : ""}
                          </div>
                          <div style="text-align:center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/leaves" style="background:${isApproved ? '#10b981' : '#ef4444'};color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;">View History</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      };
    }

    if (!emailOptions) {
      return NextResponse.json({ error: "Invalid request configuration" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Leave notification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
