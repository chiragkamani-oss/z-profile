import { EmailService } from "@/server/services/email.service";
import nodemailer from "nodemailer";

jest.mock("nodemailer");

describe("EmailService Transactional Notifications", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it("should handle mock delivery gracefully when SMTP credentials are not set", async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;

    const res = await EmailService.sendEmail({
      to: "engineer@zymr.com",
      subject: "Test Notification",
      html: "<p>Hello</p>",
    });

    expect(res.success).toBe(true);
    expect(res.mock).toBe(true);
  });

  it("should send email via nodemailer when credentials are set", async () => {
    process.env.SMTP_HOST = "smtp.mail.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@mail.com";
    process.env.SMTP_PASSWORD = "secret";

    const mockSendMail = jest.fn().mockResolvedValue({ messageId: "msg-12345" });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    const res = await EmailService.sendEmail({
      to: "client@example.com",
      subject: "Real Mail",
      html: "<b>Real</b>",
    });

    expect(res.success).toBe(true);
    expect(res.messageId).toBe("msg-12345");
  });

  it("should handle nodemailer sendMail failure gracefully", async () => {
    process.env.SMTP_HOST = "smtp.mail.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@mail.com";
    process.env.SMTP_PASSWORD = "secret";

    const mockSendMail = jest.fn().mockRejectedValue(new Error("Connection refused"));
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    const res = await EmailService.sendEmail({
      to: "client@example.com",
      subject: "Fail Mail",
      html: "<b>Fail</b>",
    });

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("should format submitted profile notification without throwing", async () => {
    const res = await EmailService.sendProfileSubmittedNotification({
      engineerName: "Chirag Kamani",
      engineerEmail: "chirag.kamani@zymr.com",
      profileTitle: "Principal Cloud Architect",
      profileId: 101,
    });

    expect(res.success).toBe(true);
  });

  it("should format changes requested notification with feedback", async () => {
    const res = await EmailService.sendChangesRequestedNotification({
      engineerName: "Chirag Kamani",
      engineerEmail: "chirag.kamani@zymr.com",
      profileTitle: "Principal Cloud Architect",
      profileId: 101,
      feedback: "Please add recent Kubernetes production experience.",
    });

    expect(res.success).toBe(true);
  });

  it("should format profile approved notification", async () => {
    const res = await EmailService.sendProfileApprovedNotification({
      engineerName: "Chirag Kamani",
      engineerEmail: "chirag.kamani@zymr.com",
      profileTitle: "Principal Cloud Architect",
      profileId: 101,
    });

    expect(res.success).toBe(true);
  });

  it("should format missing config request notification", async () => {
    const res = await EmailService.sendMissingConfigNotification({
      employeeName: "Jane Engineer",
      employeeEmail: "jane@zymr.com",
      section: "Skill",
      requestedData: "Rust WebAssembly",
    });

    expect(res.success).toBe(true);
  });
});
