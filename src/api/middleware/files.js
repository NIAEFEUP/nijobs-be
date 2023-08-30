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

export const parseFiles = (field_name_file, field_name_array) => (req, res, next) => {
    const upload = multerConfig.fields([
        { name: field_name_file, maxCount: 1 },
        { name: field_name_array, maxCount: 5 }
    ]);
    upload(req, res, (error) => {
        if (error) {
            let param = error.field ? error.field : param;

            if (error.code === "LIMIT_FILE_COUNT") {
                error.message = ValidationReasons.ARRAY_SIZE(0, 5);
                param = field_name_array;
            } else if (error.code === "LIMIT_FILE_SIZE") {
                error.message = ValidationReasons.FILE_TOO_LARGE(MAX_FILE_SIZE_MB);
                param = field_name_file;
            }
            return next(new APIError(
                HTTPStatus.UNPROCESSABLE_ENTITY,
                ErrorTypes.VALIDATION_ERROR,
                [{
                    location: "body",
                    param,
                    msg: error.message
                }]
            ));
        } else {
            return next();
        }


    });
};


/*
export const parsingSingleOrArray = (field_name, required = true, isArray = false) => (req, res, next) => {
    const upload = multerConfig.fields([{ name: field_name, maxCount: isArray ? 5 : 1 }]);
    upload(req, res, (error) => {
        if (error || (!req.files && required)) {
            let message = "required";
            let param = field_name;
            if (error) {
                message = error instanceof MulterError ?
                    parseError(error.message) : error.message;

                if (error.code === "LIMIT_FILE_COUNT")
                    message = ValidationReasons.ARRAY_SIZE(0, 5);

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

export const parseSingleFile = (field_name, required = true) => (req, res, next) => {
    const upload = multerConfig.fields([{ name: field_name, maxCount: 1 }]);
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
*/
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

export const parseArrayOfFiles = (field_name, max_count, required = true) => (req, res, next) => {
    const upload = multerConfig.fields([{ name: field_name, maxCount: max_count }]);
    console.log("array of files");
    console.log("request:", req.body);
    console.log("files:", req.files);
    upload(req, res, (error) => {
        if (error || (!req.files && required)) {
            let message = "required";
            let param = field_name;
            if (error) {
                message = error instanceof MulterError ?
                    parseError(error.message) : error.message;

                if (error.code === "LIMIT_FILE_COUNT")
                    message = ValidationReasons.ARRAY_SIZE(0, max_count);

                param = error.field ? error.field : param;
                console.log("there was an error");
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
            console.log("no error");
            return next();
        }
    });
};

export const localSaveArray = async (req, res, next) => {
    let sequenceNumber = 0;
    console.log("local save array");
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
};

export const cloudSaveArray = async (req, res, next) => {
    console.log("cloud save array");
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
};
