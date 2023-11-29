import multer from "multer";
import ValidationReasons from "../api/middleware/validators/validationReasons.js";
import { MAX_FILE_SIZE_MB } from "../api/middleware/utils.js";

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
export default multer({ storage, limits, fileFilter });
