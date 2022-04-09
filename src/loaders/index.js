import mongooseLoader from "./mongoose.js";
import expressLoader from "./express.js";
import emailServiceLoader from "./emailService.js";
import staticFilesLoader from "./static.js";

export default async ({ expressApp }) => {
    await mongooseLoader();
    console.info("Mongoose DB connection initialized");
    await expressLoader(expressApp);
    console.info("Express initialized");
    await emailServiceLoader();
    console.info("Nodemailer initialized");
    await import("../config/passport.js");
    console.info("Passport configurations loaded");
    staticFilesLoader(expressApp);
    console.info("Static files being served at /static");
};
