const promisify = require("util").promisify;
const nodemailer = require("nodemailer");
const EMAIL_SIGNATURE = require("../services/emails/signature");

class EmailService {

    init({ email: user, clientId, clientSecret, refreshToken, accessToken }) {
        this.email = user;
        this.transporter = nodemailer.createTransport({
            pool: true,
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                type: "OAuth2",
                user,
                clientId,
                clientSecret,
                refreshToken,
                accessToken,
            },
            connectionTimeout: 30000
        });
    }

    verifyConnection() {
        if (!this.transporter) throw new Error("Trying to use Email Service without having a transporter set. Call init() first.");
        return promisify(this.transporter.verify)();
    }

    async sendMail(message, options) {
        if (!this.transporter) {
            console.warn(`Email service transporter not defined. 
        Either you forgot to call init(), or MAIL_ADDRESS is not present in .env. Executing no-op.`);
            return Promise.resolve();
        }

        const { sendFailureNotification = true } = { ...options }; // To allow undefined options object

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
        if (!message.attachments || !(message.attachments instanceof Array)) {
            message.attachments = [];
            message.attachments.push({
                filename: "logo-niaefeup.png",
                path: "https://ni.fe.up.pt/images/logo-niaefeup.png",
                cid: "id_1234698",
            });
        }

        message.html += EMAIL_SIGNATURE;

        const info = await this.transporter.sendMail({ ...data, ...message });
        console.info("Sent email:", info);
        return info;
    }

}

module.exports = new EmailService();
module.exports.EmailService = EmailService;
