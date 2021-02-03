const HTTPStatus = require("http-status-codes");
const { MulterError } = require("multer");
const multerConfig = require("../../config/multer");
const { ErrorTypes } = require("./errorHandler");

const parseError = (message) => message.toLowerCase().replace(" ", "-");

const single = (field_name) => {
    const upload = multerConfig.single(field_name);
    return (req, res, next) => {
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
};
module.exports = { single };
