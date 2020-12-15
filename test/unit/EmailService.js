const EmailService = jest.requireActual("../../src/lib/nodemailer"); // Bypass auto jest mocks
const EmailServiceClass = EmailService.EmailService;
const nodemailer = require("nodemailer"); // Mocked at __mocks__/nodemailer.js
const signature = require("../../src/services/emails/signature");

describe("EmailService", () => {

    test("Should be a singleton", () => {
        expect(EmailService).toBe(EmailService);
    });

    test("Should init a transporter", () => {
        const emailService = new EmailServiceClass();

        expect(emailService.transporter).toBeUndefined();
        emailService.init({
            user: "user",
            clientId: "clientId",
            clientSecret: "clientSecret",
            accessToken: "accessToken",
            refreshToken: "refreshToken"
        });

        expect(emailService.transporter).toBeDefined();
    });

    test("Should execute no-op when sending email if init() was not called", () => {
        const emailService = new EmailServiceClass();

        emailService.sendMail({ mockMessage: true });

        expect(nodemailer.createTransport).toHaveBeenCalledTimes(0);
    });

    test("Should send email with delivery state notification", () => {
        const emailService = new EmailServiceClass();
        emailService.init({
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
            recipient: this.email

        });

        emailService.sendMail({ mockMessage: true }, { sendFailureNotification: true });
        expect(nodemailer.transporter.sendMail.mock.calls[1][0]).toHaveProperty("dsn", {
            id: Math.random().toString(36).substring(7),
            return: "headers",
            notify: ["failure", "delay"],
            recipient: this.email

        });
        Math.random = MathRandom;
    });

    test("Should not send email with delivery state notification", () => {
        const emailService = new EmailServiceClass();
        emailService.init({
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

    test("Should include email signature", () => {
        const emailService = new EmailServiceClass();
        emailService.init({
            user: "user",
            clientId: "clientId",
            clientSecret: "clientSecret",
            accessToken: "accessToken",
            refreshToken: "refreshToken"
        });

        emailService.sendMail({ html: "htmltest", text: "texttest" }, { sendFailureNotification: false });
        expect(nodemailer.transporter.sendMail.mock.calls[0][0]).toHaveProperty("html", `htmltest${signature}`);
        expect(nodemailer.transporter.sendMail.mock.calls[0][0]).toHaveProperty("text", "texttest");
        expect(nodemailer.transporter.sendMail.mock.calls[0][0]).toHaveProperty("attachments",
            [{ filename: "logo-niaefeup.png",
                path: "https://ni.fe.up.pt/images/logo-niaefeup.png",
                cid: "id_1234698" }
            ]
        );
    });
});
