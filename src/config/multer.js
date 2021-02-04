const multer = require("multer");

const storage =  multer.memoryStorage();
const limits = { fileSize: 5000000 };
const fileFilter = (req, file, cb) => {
    const fileTypes = /png|jpeg|jpg/;
    const mimeType = fileTypes.test(file.mimetype);
    if (mimeType) {
        cb(null, true);
    } else {
        cb(new Error("formats-supported-png-jpeg-jpg"));
    }
};
module.exports = multer({ storage, limits, fileFilter });
