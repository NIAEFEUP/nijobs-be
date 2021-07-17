const multer = require("multer");
const ValidationReasons = require("../api/middleware/validators/validationReasons");
const { MAX_FILE_SIZE_MB } = require("../api/middleware/utils");

const storage =  multer.memoryStorage();
const limits = { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 };
const fileFilter = (req, file, cb) => {
    const fileTypes = /png|jpeg|jpg/;
    const mimeType = fileTypes.test(file.mimetype);
    if (mimeType) {
        cb(null, true);
    } else {
        cb(new Error(ValidationReasons.IMAGE_FORMAT));
    }
};
module.exports = multer({ storage, limits, fileFilter });
