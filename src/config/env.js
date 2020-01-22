require("dotenv-flow").config();

const config = Object.freeze({
    // Database
    db_host: process.env.DB_HOST,
    db_port: process.env.DB_PORT,
    db_name: process.env.DB_NAME,
    db_uri: process.env.DB_URI,
    db_user: process.env.DB_USER,
    db_pass: process.env.DB_PASS,

    session_secret: process.env.SESSION_SECRET,

    port: process.env.PORT,

    god_token: process.env.GOD_TOKEN,

    test_log_requests: JSON.parse(process.env.TEST_LOG_REQUESTS),

    admin_email: process.env.ADMIN_EMAIL,
    admin_password: process.env.ADMIN_PASSWORD,
    access_control_allow_origin: process.env.ACCESS_CONTROL_ALLOW_ORIGIN || "*",
});

module.exports = Object.freeze({
    ...config,
    db_uri: config.db_uri ||
        (config.db_host
            && config.db_port
            && config.db_name
            && `mongodb://${config.db_host}:${config.db_port}/${config.db_name}`),
});
