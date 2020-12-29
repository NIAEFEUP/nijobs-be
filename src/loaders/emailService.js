
const EmailService = require("../lib/emailService");
const config = require("../config/env");

const initEmailService = async () => {
    if (
        config.mail_from && !(config.mail_from_password)
    ) {
        console.error(`If MAIL_FROM is specified in .env file, MAIL_FROM_PASSWORD must also be specified in the env file! 
        See README.md for details.`);
        process.exit(125);
    }

    const options = {
        email: config.mail_from,
        password: config.mail_from_password
    };

    try {
        if (!options.email)  {
            console.warn("No MAIL_FROM found in .env. Will not be able to send emails.");
            return;
        }

        await EmailService.init(options);
        await EmailService.verifyConnection().then(() => console.info("Email Server is ready to send messages"));

    } catch (err) {
        console.error("Nodemailer: failure in initializing the email service (aborting, will not retry)", err);
        process.exit(44);
    }

};

module.exports = initEmailService;
