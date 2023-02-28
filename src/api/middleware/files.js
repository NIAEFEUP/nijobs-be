import { StatusCodes as HTTPStatus } from "http-status-codes";
import fs from "fs";
import path from "path";
import util from "util";
import { MulterError } from "multer";
import { v2 as cloudinary } from "cloudinary";
import multerConfig from "../../config/multer.js";
import { ErrorTypes, APIError } from "./errorHandler.js";
import config from "../../config/env.js";
import ValidationReasons from "./validators/validationReasons.js";
import { MAX_FILE_SIZE_MB } from "./utils.js";

const parseError = (message) => message.toLowerCase().replace(/ /g, "-");

export const parseSingleFile = (field_name, required = true) => (req, res, next) => {
    const upload = multerConfig.single(field_name);
    upload(req, res, (error) => {
        if (error || (!req.file && required)) {
            let message = "required";
            let param = field_name;
            if (error) {
                message = error instanceof MulterError ?
                    parseError(error.message) : error.message;

                if (error.code === "LIMIT_FILE_SIZE")
                    message = ValidationReasons.FILE_TOO_LARGE(MAX_FILE_SIZE_MB);

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

export const localSave = async (req, res, next) => {
    if (!req.file) return next();
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

export const cloudSave = async (req, res, next) => {
    if (!req.file) return next();
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
        console.error(err);
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
export const parseArrayOfFiles = (field_name, max_count) => (req, res, next) => {
    const upload = multerConfig.array(field_name, max_count);
    upload(req, res, (error) => {
        if (error) {
            let message = "required";
            let param = field_name;
            message = error instanceof MulterError ?
                parseError(error.message) : error.message;
            if (error.code === "LIMIT_FILE_COUNT") {
                if (!req.files) {
                    return next();
                }
            }
            param = error.field ? error.field : param;
            if (req.files && req.files.length > max_count) {
                message = ValidationReasons.TOO_LONG(max_count);
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
        } else {
            return next();
        }
    });
};

export const localSaveArray = async (req, res, next) => {
    let sequenceNumber = 0;
    if (!req.files)
        return next();
    else {
        for (const file of req.files) {
            const buffer = file.buffer;
            const extension = file.mimetype.substr(file.mimetype.indexOf("/") + 1);
            const filename = `${req.user.company}-${sequenceNumber}.${extension}`;
            sequenceNumber++;
            const file_path = path.join(config.upload_folder, filename);
            file.filename = filename;
            try {
                await fs.promises.writeFile(file_path, buffer);
            } catch (error) {
                console.error(error);
                return next(new APIError(
                    HTTPStatus.UNPROCESSABLE_ENTITY,
                    ErrorTypes.FILE_ERROR,
                    [{
                        location: "body",
                        param: file.fieldname,
                        msg: ValidationReasons.FAILED_SAVE
                    }]
                ));
            }
        }
        return next();
    }
};

export const cloudSaveArray = async (req, res, next) => {
    if (!req.files)
        return next();
    else {
        for (const file of req.files) {
            const filename = file.filename;
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
                    file.url = resp.secure_url;
                }
            } catch (err) {
                console.error(err);
                await fs.promises.unlink(file_path);
                return next(new APIError(
                    HTTPStatus.UNPROCESSABLE_ENTITY,
                    ErrorTypes.FILE_ERROR,
                    [{
                        location: "body",
                        param: file.fieldname,
                        msg: ValidationReasons.FAILED_SAVE
                    }]));
            }
        }
        return next();
    }
};
