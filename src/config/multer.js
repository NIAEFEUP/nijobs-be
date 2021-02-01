const multer = require("multer");
const path = require("path");
const env = require("./env");

let storage;


storage = multer.diskStorage({
    destination: path.join(__dirname, "../../public/uploads"),
    filename: (req, file, cb) => {
        const extension = file.mimetype.substr(file.mimetype.indexOf("/") + 1);
        const full_name = `logo-${req.user.company}.${extension}`;
        cb(null, full_name);
    },
});

const limits = { fileSize: 5000000 };
const fileFilter = (req, file, cb) => {
    const fileTypes = /png|jpeg|jpg/;
    const mimeType = fileTypes.test(file.mimetype);
    if (mimeType) {
        cb(null, true);
    } else {
        cb("Only allowed types are png, jpeg and jpg");
    }
};
module.exports = multer({ storage, limits, fileFilter });
