import { StatusCodes as HTTPStatus } from "http-status-codes";
import { Router } from "express";
import passport from "passport";

import { authRequired, isGod, validToken } from "../middleware/auth.js";
import * as validators from "../middleware/validators/auth.js";
import AccountService from "../../services/account.js";
import Company from "../../models/Company.js";
import { AccountTypes } from "../../models/Account.js";

const router = Router();

export default (app) => {
    app.use("/auth", router);

    // Get logged in user info
    router.get("/me", authRequired, async (req, res) => {
        const { email, type } = req.user;

        const sessionData = {
            email,
            type,
        };

        try {
            if (req.user.type === AccountTypes.COMPANY) {
                sessionData.company = await Company.findOne({ account: req.user._id }).select("-account");
            }
        } catch (e) {
            console.error(e);
        }

        return res.status(HTTPStatus.OK).json({
            data: sessionData
        });
    });

    // Login endpoint
    router.post("/login", validators.login, passport.authenticate("local"), (req, res) => res.status(HTTPStatus.OK).json({}));

    // Logout endpoint
    router.delete("/login", (req, res, next) => {
        if (req.isAuthenticated()) req.logout((err) => {
            if (err) {
                console.error(err);
                next(err);
            }
        });

        return res.status(HTTPStatus.OK).json({});
    });

    // Register endpoint
    router.post("/register", isGod, validators.register, async (req, res, next) => {
        const { email, password } = req.body;

        // Inserting user into db and replying with success or not
        try {
            const sessionData = await (new AccountService()).registerAdmin(email, password);

            return res.status(HTTPStatus.OK).json({
                sessionData,
            });
        } catch (err) {
            console.error(err);
            return next(err);
        }
    });

    router.post("/recover/request", validators.recover, async (req, res, next) => {
        try {
            const accountService = new AccountService();

            const account = await accountService.findByEmail(req.body.email);

            if (account === null) {
                return res.status(HTTPStatus.OK).json({});
            }

            const link = accountService.buildPasswordRecoveryLink(account);
            accountService.sendPasswordRecoveryNotification(account, link);

            return res.status(HTTPStatus.OK).json({});
        } catch (err) {
            console.error(err);
            return next(err);
        }
    });

    router.get("/recover/:token/confirm", validators.confirmRecover, validToken, (req, res) => res.status(HTTPStatus.OK).json({}));

    router.post("/recover/:token/confirm", validators.finishRecover, validToken, async (req, res, next) => {
        const { email } = req.locals.token;

        try {
            await new AccountService().updatePassword(email, req.body.password);
            return res.status(HTTPStatus.OK).json({});
        } catch (err) {
            console.error(err);
            return next(err);
        }
    });

};
