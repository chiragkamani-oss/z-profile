import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number.parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  static async sendEmail({ to, subject, html }: EmailOptions) {
    const from = process.env.SMTP_FROM || "Zprofile Talent Platform <no-reply@zymr.com>";
    const transporter = this.getTransporter();

    if (!transporter) {
      console.info(
        `[EmailService:MockDelivery] To: ${to} | Subject: "${subject}" (SMTP credentials not configured in environment)`
      );
      return { success: true, mock: true };
    }

    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      console.info(`[EmailService] Email sent successfully: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("[EmailService] Failed to send email:", error);
      return { success: false, error };
    }
  }

  /**
   * Dispatched when an engineer submits their profile for review (Parity with update-profile-status.php)
   */
  static async sendProfileSubmittedNotification(params: {
    engineerName: string;
    engineerEmail: string;
    profileTitle: string;
    profileId: string | number;
    managerEmail?: string;
  }) {
    const recipient = params.managerEmail || "delivery-managers@zymr.com";
    const subject = `[Zprofile] Profile Submitted for Review: ${params.engineerName} - ${params.profileTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #1e3a8a; padding: 16px; border-radius: 6px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px;">Zprofile Talent Platform</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #93c5fd;">Talent Portfolio Review Notice</p>
        </div>
        <div style="padding: 20px 0;">
          <p>Hello Management Team,</p>
          <p>Engineer <strong>${params.engineerName}</strong> (${params.engineerEmail}) has submitted their portfolio for verification and approval:</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold; color: #1e293b;">${params.profileTitle}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Profile ID: #${params.profileId}</p>
          </div>
          <p>Please log in to your dashboard to review technical competencies and deliverables.</p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} Zymr, Inc. Confidential Enterprise Engineering Services.
        </div>
      </div>
    `;

    return this.sendEmail({ to: recipient, subject, html });
  }

  /**
   * Dispatched when an admin/manager approves a profile (is_ready)
   */
  static async sendProfileApprovedNotification(params: {
    engineerName: string;
    engineerEmail: string;
    profileTitle: string;
    profileId: string | number;
  }) {
    const subject = `[Zprofile] Congratulations! Your Profile Has Been Approved: ${params.profileTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #065f46; padding: 16px; border-radius: 6px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px;">Zprofile Talent Platform</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #a7f3d0;">Profile Verified & Client-Ready</p>
        </div>
        <div style="padding: 20px 0;">
          <p>Hello <strong>${params.engineerName}</strong>,</p>
          <p>Great news! Your engineering talent portfolio has been formally verified and approved by management:</p>
          <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 12px 16px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold; color: #065f46;">${params.profileTitle}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #047857;">Status: Ready for Enterprise Clients</p>
          </div>
          <p>Your verified profile is now accessible to delivery and client presentation teams.</p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} Zymr, Inc. Confidential Enterprise Engineering Services.
        </div>
      </div>
    `;

    return this.sendEmail({ to: params.engineerEmail, subject, html });
  }

  /**
   * Dispatched when an admin/manager requests revisions (Parity with review-to-draft.php)
   */
  static async sendChangesRequestedNotification(params: {
    engineerName: string;
    engineerEmail: string;
    profileTitle: string;
    profileId: string | number;
    feedback: string;
  }) {
    const subject = `[Zprofile] Profile Change Request: ${params.profileTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #991b1b; padding: 16px; border-radius: 6px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px;">Zprofile Talent Platform</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #fecaca;">Profile Revision Required</p>
        </div>
        <div style="padding: 20px 0;">
          <p>Hello <strong>${params.engineerName}</strong>,</p>
          <p>Your reviewer has returned your portfolio for revisions before client submission:</p>
          <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 12px 16px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold; color: #9f1239;">Reviewer Feedback:</p>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #881337; white-space: pre-line;">${params.feedback}</p>
          </div>
          <p>Please update your profile deliverables and re-submit for review.</p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} Zymr, Inc. Confidential Enterprise Engineering Services.
        </div>
      </div>
    `;

    return this.sendEmail({ to: params.engineerEmail, subject, html });
  }

  /**
   * Dispatched when an engineer requests a new metadata option (Parity with missing-config-notification.php)
   */
  static async sendMissingConfigNotification(params: {
    employeeName: string;
    employeeEmail: string;
    section: string;
    requestedData: string;
  }) {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@zymr.com";
    const subject = `Zprofile: New missing config request from ${params.employeeName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #2A4B65; padding: 16px; border-radius: 6px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px;">Zprofile Configuration System</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #bae6fd;">Missing Metadata Tag Request</p>
        </div>
        <div style="padding: 20px 0;">
          <p>Dear Admin,</p>
          <p>This is to let you know that a Zymrian has requested new metadata to be added in the Z-profile master taxonomies.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #dedede;">
            <tr style="background-color: #f4f7fc;">
              <th style="padding: 12px; text-align: left; border: 1px solid #dedede; font-size: 13px;">Employee:</th>
              <td style="padding: 12px; border: 1px solid #dedede; font-size: 13px;">${params.employeeName} (${params.employeeEmail})</td>
            </tr>
            <tr>
              <th style="padding: 12px; text-align: left; border: 1px solid #dedede; font-size: 13px; background-color: #f4f7fc;">Section Name:</th>
              <td style="padding: 12px; border: 1px solid #dedede; font-size: 13px; font-weight: bold;">${params.section}</td>
            </tr>
            <tr>
              <th style="padding: 12px; text-align: left; border: 1px solid #dedede; font-size: 13px; background-color: #f4f7fc;">Data Requested:</th>
              <td style="padding: 12px; border: 1px solid #dedede; font-size: 13px; color: #1e3a8a;">${params.requestedData}</td>
            </tr>
          </table>
          <p>You can add this to the master taxonomy catalog via the Settings panel.</p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} Zymr, Inc. Confidential Enterprise Engineering Services.
        </div>
      </div>
    `;

    return this.sendEmail({ to: adminEmail, subject, html });
  }
}
