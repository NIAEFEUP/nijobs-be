
const EmailService = require("../lib/nodemailer");
const config = require("../config/env");

const initNodemailer = async () => {
    if (
        config.mail_address &&
        !(config.mail_client_id && config.mail_client_secret && config.mail_refresh_token && config.mail_access_token)
    ) {
        console.error(`If MAIL_ADDRESS is specified in .env file, 
        MAIL_CLIENT_ID, MAIL_CLIENT_SECRET, MAIL_REFRESH_TOKEN and MAIL_ACCESS_TOKEN must also be specified in the env file! 
        See README.md for details.`);
        process.exit(125);
    }

    const options = {
        email: config.mail_address,
        clientId: config.mail_client_id,
        clientSecret: config.mail_client_secret,
        refreshToken: config.mail_refresh_token,
        accessToken: config.mail_access_token
    };

    try {
        if (!options.email)  {
            console.warn("No MAIL_ADDRESS found in .env. Will not be able to send emails.");
            return;
        }

        await EmailService.init(options);
        await EmailService.verifyConnection().then(() => console.info("Email Server is ready to send messages"));

    } catch (err) {
        console.error("Nodemailer: failure in initializing the email service (aborting, will not retry)", err);
        process.exit(44);
    }

};

module.exports = initNodemailer;
