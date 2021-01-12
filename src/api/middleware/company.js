const { ErrorTypes } = require("./errorHandler");
const HTTPStatus = require("http-status-codes");
const CompanyService = require("../../services/company");
const CompanyConstants = require("../../models/constants/Company");
const ValidationReasons = require("./validators/validationReasons");

const isCompanyRep = (req, res, next) => {
    if (!req.user.company) {
        return res.status(HTTPStatus.UNAUTHORIZED).json({
            reason: "The user is not a company representative",
            error_code: ErrorTypes.FORBIDDEN,
        });
    }

    return next();
};

const canCreateOffer = async (req, res, next) => {
    const currentOffers = await (new CompanyService()).getCurrentOffers(req.body.owner);

    if (currentOffers.length >= CompanyConstants.offers.max_number) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
            reason: ValidationReasons.MAX_OFFERS_EXCEEDED(CompanyConstants.offers.max_number),
            error_code: ErrorTypes.VALIDATION_ERROR
        });
    }
    return next();
};


module.exports = {
    isCompanyRep,
    canCreateOffer
};
