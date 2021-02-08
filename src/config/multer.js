const multer = require("multer");
const ValidationReasons = require("../api/middleware/validators/validationReasons");

const storage =  multer.memoryStorage();
const limits = { fileSize: 5000000 };
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
