import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Resend } from "resend";

export const sendInviteEmail = action({
  args: {
    email: v.string(),
    role: v.optional(v.string()),
    department: v.optional(v.string()),
    baseUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; token: string }> => {
    const resendApiKey = process.env.RESEND_API_KEY;

    // Step 1: Create/get invitation token (this works even without Resend)
    const inviteResult = await ctx.runMutation(api.functions.invitations.sendInvite, {
      email: args.email,
      role: args.role,
      department: args.department,
    });

    const token = inviteResult.token;
    const inviteLink = `${args.baseUrl}/invite/${token}`;

    // Step 2: Try to send email via Resend (optional - fail gracefully)
    if (!resendApiKey) {
      console.warn(
        "RESEND_API_KEY is not set in Convex environment variables. " +
        "Please set it with: npx convex env set RESEND_API_KEY re_xxxxxxxxxxxx\n" +
        "Invite link generated but email NOT sent: " + inviteLink
      );
      // Still return success with the token so the UI can show the link
      return { success: true, token };
    }

    const resend = new Resend(resendApiKey);

    const { error } = await resend.emails.send({
      from: "HRM Portal <onboarding@resend.dev>",
      to: [args.email],
      subject: "You're Invited to Join HRM Portal",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1e293b; font-size: 24px; margin: 0;">HRM Portal Invitation</h1>
          </div>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            Hello,
          </p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            You have been invited to join the HRM Portal${args.role ? ` for the position of <strong style="color: #1e293b;">${args.role}</strong>` : ""}${args.department ? ` in the <strong style="color: #1e293b;">${args.department}</strong> department` : ""}.
          </p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            Please click the button below to complete your profile and upload your required documents.
          </p>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${inviteLink}" 
               style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
              Accept Invitation →
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
            Or copy this link into your browser:
          </p>
          <p style="background: #f1f5f9; border-radius: 6px; padding: 12px; font-size: 13px; word-break: break-all; margin-bottom: 32px;">
            <a href="${inviteLink}" style="color: #2563eb;">${inviteLink}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            This invitation link will expire in 7 days. If you did not expect this email, you can safely ignore it.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", JSON.stringify(error));
      throw new Error(
        `Email sending failed: ${error.message}. ` +
        `Invite link is: ${inviteLink}`
      );
    }

    console.log(`Invitation email sent successfully to ${args.email}`);
    return { success: true, token };
  },
});
