const nodemailer = require("nodemailer");
const config = require("../config/env");

class EmailClient {
    constructor(host, port, user, pass) {
        this.host = host;
        this.port = port;
        this.initTransport(user, pass);
    }

    initTransport(user, pass) {
        this.transporter = nodemailer.createTransport({
            host: this.host,
            port: this.port,
            secure: false, // true for 465, false for other ports
            auth: {
                user,
                pass,
            },
        });
    }

    sendMail(to, subject, template, info) {
        return this.transporter.sendMail({
            from: `"NiJobs Team" ${this.email}`,
            to,
            subject,
            html: this.generateEmail(template, info),
        });
    }

    generateEmail(template, info) {
        return "Hello world";
    }
}

const emailClient = new EmailClient(config.email_host, config.email_port, config.email_user, config.email_password);

module.exports = emailClient;
