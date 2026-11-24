import { EmailService } from "@/server/services/email.service";

describe("EmailService Transactional Notifications", () => {
  it("should handle mock delivery gracefully when SMTP credentials are not set", async () => {
    const res = await EmailService.sendEmail({
      to: "engineer@zymr.com",
      subject: "Test Notification",
      html: "<p>Hello</p>",
    });

    expect(res.success).toBe(true);
    expect(res.mock).toBe(true);
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
});
