require("dotenv-flow").config();

module.exports = Object.freeze({
    // Database
    db_host: process.env.DB_HOST,
    db_port: process.env.DB_PORT,
    db_uri: process.env.DB_URI,
    db_user: process.env.DB_USER,
    db_pass: process.env.DB_PASS,
    db_name: process.env.DB_NAME,

    session_secret: process.env.SESSION_SECRET,

    port: process.env.PORT,

    god_token: process.env.GOD_TOKEN,

    test_log_requests: JSON.parse(process.env.TEST_LOG_REQUESTS),

    admin_email: process.env.ADMIN_EMAIL,
    admin_password: process.env.ADMIN_PASSWORD,
    
    access_control_allow_origin: process.env.ACCESS_CONTROL_ALLOW_ORIGIN || "*",

    email_host: process.env.EMAIL_HOST,
    email_port: process.env.EMAIL_PORT,
    email_user: process.env.EMAIL_USER,
    email_password: process.env.EMAIL_PASSWORD,
});
