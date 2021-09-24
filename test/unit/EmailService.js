import nodemailer from "nodemailer"; // Mocked at __mocks__/nodemailer.js
const { EmailService } = jest.requireActual("../../src/lib/emailService"); // Bypass auto jest mocks

describe("EmailService", () => {

    test("Should be a singleton", () => {
        expect(EmailService).toBe(EmailService);
    });

    test("Should init a transporter", async () => {
        const emailService = new EmailService();

        expect(emailService.transporter).toBeUndefined();
        await emailService.init({
            user: "user",
            clientId: "clientId",
            clientSecret: "clientSecret",
            accessToken: "accessToken",
            refreshToken: "refreshToken"
        });

        expect(emailService.transporter).toBeDefined();
    });

    test("Should execute no-op when sending email if init() was not called", () => {
        const emailService = new EmailService();

        emailService.sendMail({ mockMessage: true });

        expect(nodemailer.createTransport).toHaveBeenCalledTimes(0);
    });

    test("Should send email with delivery state notification", async () => {
        const emailService = new EmailService();
        await emailService.init({
            user: "user",
            clientId: "clientId",
            clientSecret: "clientSecret",
            accessToken: "accessToken",
            refreshToken: "refreshToken"
        });

        const MathRandom = Math.random;
        Math.random = () => 123456789987654321;

        emailService.sendMail({ mockMessage: true });
        expect(nodemailer.transporter.sendMail.mock.calls[0][0]).toHaveProperty("dsn", {
            id: Math.random().toString(36).substring(7),
            return: "headers",
            notify: ["failure", "delay"],
            recipient: emailService.email
        });

        emailService.sendMail({ mockMessage: true }, { sendFailureNotification: true });
        expect(nodemailer.transporter.sendMail.mock.calls[1][0]).toHaveProperty("dsn", {
            id: Math.random().toString(36).substring(7),
            return: "headers",
            notify: ["failure", "delay"],
            recipient: emailService.email

        });

        emailService.sendMail({ mockMessage: true }, {});
        expect(nodemailer.transporter.sendMail.mock.calls[2][0]).toHaveProperty("dsn", {
            id: Math.random().toString(36).substring(7),
            return: "headers",
            notify: ["failure", "delay"],
            recipient: emailService.email

        });
        Math.random = MathRandom;
    });

    test("Should not send email with delivery state notification", async () => {
        const emailService = new EmailService();
        await emailService.init({
            user: "user",
            clientId: "clientId",
            clientSecret: "clientSecret",
            accessToken: "accessToken",
            refreshToken: "refreshToken"
        });

        const MathRandom = Math.random;
        Math.random = () => 123456789987654321;

        emailService.sendMail({ mockMessage: true }, { sendFailureNotification: false });
        expect(nodemailer.transporter.sendMail.mock.calls[0][0]).not.toHaveProperty("dsn");
        Math.random = MathRandom;
    });
});
