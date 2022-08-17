import dotenvflow from "dotenv-flow";
import path from "path";

dotenvflow.config();

const generateDBUriFromEnv = () => {
    if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_NAME)
        throw new Error("Missing DB Params to generate URI. Either pass a DB_URI or (DB_HOST, DB_PORT and DB_NAME) in .env");

    return `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
};

export default Object.freeze({
    // Database
    db_host: process.env.DB_HOST,
    db_port: process.env.DB_PORT,
    db_name: process.env.DB_NAME,
    db_uri: process.env.DB_URI || generateDBUriFromEnv(),
    db_user: process.env.DB_USER,
    db_pass: process.env.DB_PASS,

    // App
    session_secret: process.env.SESSION_SECRET,
    jwt_secret: process.env.JWT_SECRET,
    password_recovery_link: process.env.PASSWORD_RECOVERY_LINK,
    port: process.env.PORT,
    god_token: process.env.GOD_TOKEN,
    test_log_requests: JSON.parse(process.env.TEST_LOG_REQUESTS),
    admin_email: process.env.ADMIN_EMAIL,
    admin_password: process.env.ADMIN_PASSWORD,
    access_control_allow_origin: process.env.ACCESS_CONTROL_ALLOW_ORIGIN || "*",
    access_control_allow_origin_regex_list: JSON.parse(process.env.ACCESS_CONTROL_ALLOW_ORIGIN_REGEX_LIST || "[]"),

    // Mail
    mail_from: process.env.MAIL_FROM,
    mail_from_password: process.env.MAIL_FROM_PASSWORD,

    // File upload
    cloudinary_url: process.env.CLOUDINARY_URL,
    upload_folder: new URL(process.env.UPLOAD_FOLDER || "static", path.join(import.meta.url, "../..")).pathname,
    webserver_host: process.env.WEBSERVER_HOST,
});
