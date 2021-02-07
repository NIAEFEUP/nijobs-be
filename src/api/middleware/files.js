const HTTPStatus = require("http-status-codes");
const fs = require("fs");
const path = require("path");
const util = require("util");
const { MulterError } = require("multer");
const multerConfig = require("../../config/multer");
const { ErrorTypes } = require("./errorHandler");
const cloudinary = require("cloudinary").v2;
const env = require("../../config/env");
const ValidationReasons = require("./validators/validationReasons");


const save_folder = path.join(__dirname, "../../../public/uploads/");
if (!fs.existsSync(save_folder)) fs.mkdirSync(save_folder);

const parseError = (message) => message.toLowerCase().replace(" ", "-");

const single = (field_name) => (req, res, next) => {
    const upload = multerConfig.single(field_name);
    upload(req, res, (error) => {
        if (error || !req.file) {
            let message = "required";
            let param = field_name;
            if (error) {
                message = error instanceof MulterError ?
                    parseError(error.message) : error.message;
                param = error.field ? error.field : param;
            }
            return res
                .status(HTTPStatus.UNPROCESSABLE_ENTITY)
                .json({
                    error_code: ErrorTypes.VALIDATION_ERROR,
                    errors: [
                        {
                            location: "body",
                            param,
                            msg: message
                        }]
                });
        } else {
            return next();
        }
    });
};

const save = async (req, res, next) => {
    const buffer = req.file.buffer;
    const extension = req.file.mimetype.substr(req.file.mimetype.indexOf("/") + 1);
    const filename = `${req.user.company}.${extension}`;
    const file_path = path.join(save_folder, filename);
    req.file.filename = filename;

    try {
        await fs.promises.writeFile(file_path, buffer);
    } catch (error) {
        console.error(error);
        return res
            .status(HTTPStatus.UNPROCESSABLE_ENTITY)
            .json({
                error_code: ErrorTypes.FILE_ERROR,
                errors: [
                    {
                        location: "body",
                        param: req.file.fieldname,
                        msg: ValidationReasons.FAILED_SAVE
                    }
                ]
            });
    }
    return next();
};

const upload = util.promisify(cloudinary.uploader.upload);

const cloudSave = async (req, res, next) => {
    const filename = req.file.filename;
    const file_path = path.join(save_folder, filename);

    try {
        if (env.cloudinary_url) {
            const resp = await upload(file_path,
                {
                    resource_type: "image",
                    public_id: filename,
                    overwrite: true
                });
            await fs.promises.unlink(file_path);
            req.file.url = resp.secure_url;
        }
    } catch (err) {
        return res
            .status(HTTPStatus.UNPROCESSABLE_ENTITY)
            .json({
                error_code: ErrorTypes.FILE_ERROR,
                errors: [
                    {
                        location: "body",
                        param: req.file.fieldname,
                        msg: ValidationReasons.FAILED_SAVE
                    }
                ]
            });
    }

    return next();

};


module.exports = { single, save, cloudSave };
