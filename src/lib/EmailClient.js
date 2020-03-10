const nodemailer = require("nodemailer");
const config = require("../config/env");

class EmailClient {
    constructor(host, port, user, pass) {
        this.host = host;
        this.port = port;
        this.email = user;
        this.initTransport(user, pass);
    }

    initTransport(user, pass) {
        this.transporter = nodemailer.createTransport({
            host: this.host,
            port: this.port,
            secure: false,
            auth: {
                user,
                pass,
            },
        });
    }

    sendMail(to, subject, html) {
        return this.transporter.sendMail({
            from: `"NiJobs Team" <${this.email}>`,
            to,
            subject,
            html,
        });
    }


    sendAcceptance({ email, companyName }) {
        const message = `<h2>Welcome to NiJobs, ${companyName}</h2>
        <p>You can start posting <a href="#">here</a>.</p>`;
        return this.sendMail(email, "Welcome to NiJobs!", message);
    }
}

const emailClient = new EmailClient(config.email_host, config.email_port, config.email_user, config.email_password);

module.exports = emailClient;
