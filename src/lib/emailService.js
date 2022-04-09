import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";

export class EmailService {

    async init({ email: user, password: pass }) {
        this.email = user;
        const transporter = await nodemailer.createTransport({
            pool: true,
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user,
                pass
            },
            connectionTimeout: 30000
        });

        transporter.use("compile", hbs({
            viewEngine: {
                layoutsDir: `${path.resolve()}/src/email-templates/layouts`,
                partialsDir: `${path.resolve()}/src/email-templates/partials/`,
                extName: ".handlebars",
                defaultLayout: "main"
            },
            extName: ".handlebars",
            viewPath: `${path.resolve()}/src/email-templates/`,
        }));

        this.transporter = transporter;
    }

    verifyConnection() {
        if (!this.transporter) throw new Error("Trying to use Email Service without having a transporter set. Call init() first.");
        return this.transporter.verify();
    }

    async sendMail(message, options) {
        if (!this.transporter) {
            console.warn(`Email service transporter not defined. 
        Either you forgot to call init(), or MAIL_FROM is not present in .env. Executing no-op.`);
            return Promise.resolve();
        }

        // Sets default properties (only if they are not present). The spread operator allows undefined `options` param
        const { sendFailureNotification = true } = { ...options };

        const data = {};
        if (sendFailureNotification) {
            data.dsn = {
                id: Math.random().toString(36).substring(7),
                return: "headers",
                notify: ["failure", "delay"],
                recipient: this.email
            };
        }
        if (!message.from) {
            data.from = this.email;
        }

        const info = await this.transporter.sendMail({ ...data, ...message });
        const { response, envelope, messageId } = info;
        console.info("Sent email:", { response, envelope, messageId });
        return info;
    }

}

export default new EmailService();
