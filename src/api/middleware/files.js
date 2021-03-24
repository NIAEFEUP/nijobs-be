const HTTPStatus = require("http-status-codes");
const fs = require("fs");
const path = require("path");
const util = require("util");
const { MulterError } = require("multer");
const multerConfig = require("../../config/multer");
const { ErrorTypes, APIError } = require("./errorHandler");
const cloudinary = require("cloudinary").v2;
const config = require("../../config/env");
const ValidationReasons = require("./validators/validationReasons");

const parseError = (message) => message.toLowerCase().replace(" ", "-");

const parseSingleFile = (field_name) => (req, res, next) => {
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
            return next(new APIError(
                HTTPStatus.UNPROCESSABLE_ENTITY,
                ErrorTypes.VALIDATION_ERROR,
                [{
                    location: "body",
                    param,
                    msg: message
                }]

            ));
        } else {
            return next();
        }
    });
};

const localSave = async (req, res, next) => {
    const buffer = req.file.buffer;
    const extension = req.file.mimetype.substr(req.file.mimetype.indexOf("/") + 1);
    const filename = `${req.user.company}.${extension}`;
    const file_path = path.join(config.upload_folder, filename);
    req.file.filename = filename;

    try {
        await fs.promises.writeFile(file_path, buffer);
    } catch (error) {
        console.error(error);
        return next(new APIError(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            ErrorTypes.FILE_ERROR,
            [{
                location: "body",
                param: req.file.fieldname,
                msg: ValidationReasons.FAILED_SAVE
            }]));
    }
    return next();
};

const upload = util.promisify(cloudinary.uploader.upload);

const cloudSave = async (req, res, next) => {
    const filename = req.file.filename;
    const file_path = path.join(config.upload_folder, filename);

    try {
        if (config.cloudinary_url) {
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
        await fs.promises.unlink(file_path);
        return next(new APIError(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            ErrorTypes.FILE_ERROR,
            [{
                location: "body",
                param: req.file.fieldname,
                msg: ValidationReasons.FAILED_SAVE
            }]));
    }

    return next();

};


module.exports = { parseSingleFile, localSave, cloudSave };
