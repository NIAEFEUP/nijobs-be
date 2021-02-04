const HTTPStatus = require("http-status-codes");
const fs = require("fs");
const path = require("path");
const { MulterError } = require("multer");
const multerConfig = require("../../config/multer");
const { ErrorTypes } = require("./errorHandler");
const { v4: uuidv4 } = require("uuid");


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
    const filename = `${uuidv4()}.${extension}`;
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
                        param: req.fieldname,
                        msg: "failed-save"
                    }
                ]
            });
    }
    return next();
};


module.exports = { single, save };
