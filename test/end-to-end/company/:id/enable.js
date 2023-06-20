import { StatusCodes } from "http-status-codes";
import Company from "../../../../src/models/Company";
import Offer from "../../../../src/models/Offer";
import OfferConstants from "../../../../src/models/constants/Offer";
import Account from "../../../../src/models/Account";
import hash from "../../../../src/lib/passwordHashing";
import ValidationReasons from "../../../../src/api/middleware/validators/validationReasons";
import { ErrorTypes } from "../../../../src/api/middleware/errorHandler";
import withGodToken from "../../../utils/GodToken";
import { COMPANY_ENABLED_NOTIFICATION } from "../../../../src/email-templates/companyManagement";
import { DAY_TO_MS } from "../../../utils/TimeConstants";
import EmailService, { EmailService as EmailServiceClass } from "../../../../src/lib/emailService";

jest.mock("../../../../src/lib/emailService");
jest.spyOn(EmailServiceClass.prototype, "verifyConnection").mockImplementation(() => Promise.resolve());

describe("PUT /company/enable", () => {

    let disabled_test_company_1, disabled_test_company_2, disabled_test_company_3, disabled_test_company_4, disabled_test_company_mail;
    const test_user_admin = {
        email: "admin@email.com",
        password: "password123",
    };
    const test_user_company_1 = {
        email: "company1@email.com",
        password: "password123",
    };
    const test_user_company_2 = {
        email: "company2@email.com",
        password: "password123",
    };
    const test_user_company_3 = {
        email: "company3@email.com",
        password: "password123",
    };
    const test_user_company_4 = {
        email: "company4@email.com",
        password: "password123",
    };
    const test_user_mail = {
        email: "company_mail@email.com",
        password: "password123",
    };

    const test_agent = agent();

    beforeAll(async () => {
        await test_agent
            .delete("/auth/login")
            .expect(StatusCodes.OK);

        await Company.deleteMany({});

        [
            disabled_test_company_1,
            disabled_test_company_2,
            disabled_test_company_3,
            disabled_test_company_4,
            disabled_test_company_mail
        ] = await Company.create([
            {
                name: "disabled-test-company-1",
                isDisabled: true,
                hasFinishedRegistration: true
            }, {
                name: "disabled-test-company-2",
                isDisabled: true,
                hasFinishedRegistration: true
            }, {
                name: "disabled-test-company-3",
                isDisabled: true,
                hasFinishedRegistration: true
            }, {
                name: "disabled-test-company-4",
                logo: "http://awebsite.com/alogo.jpg",
                isDisabled: true,
                hasFinishedRegistration: true
            }, {
                name: "disabled-test-company-mail",
                isDisabled: true,
                hasFinishedRegistration: true
            }
        ]);

        await Account.deleteMany({});
        await Account.create({
            email: test_user_admin.email,
            password: await hash(test_user_admin.password),
            isAdmin: true
        });
        await Account.create({
            email: test_user_company_1.email,
            password: await hash(test_user_company_1.password),
            company: disabled_test_company_1._id
        });
        await Account.create({
            email: test_user_company_2.email,
            password: await hash(test_user_company_2.password),
            company: disabled_test_company_2._id
        });
        await Account.create({
            email: test_user_company_3.email,
            password: await hash(test_user_company_3.password),
            company: disabled_test_company_3._id
        });
        await Account.create({
            email: test_user_company_4.email,
            password: await hash(test_user_company_4.password),
            company: disabled_test_company_4._id
        });
        await Account.create({
            email: test_user_mail.email,
            password: await hash(test_user_mail.password),
            company: disabled_test_company_mail._id
        });

        const offer = {
            title: "Test Offer",
            publishDate: new Date(Date.now()),
            publishEndDate: new Date(Date.now() + (DAY_TO_MS)),
            description: "For Testing Purposes",
            contacts: ["geral@niaefeup.pt", "229417766"],
            jobType: "SUMMER INTERNSHIP",
            jobMinDuration: 1,
            jobMaxDuration: 6,
            fields: ["DEVOPS", "BACKEND", "OTHER"],
            technologies: ["React", "CSS"],
            location: "Testing Street, Test City, 123",
            requirements: ["The candidate must be tested", "Fluent in testJS"],
            owner: disabled_test_company_4._id,
            ownerName: disabled_test_company_4.name,
            ownerLogo: disabled_test_company_4.logo,
            isHidden: true,
            hiddenReason: OfferConstants.HiddenOfferReasons.COMPANY_DISABLED,
        };

        await Offer.create([offer, offer]);

    });

    afterEach(async () => {
        await test_agent
            .delete("/auth/login")
            .expect(StatusCodes.OK);
    });

    afterAll(async () => {
        await Account.deleteMany({});
        await Company.deleteMany({});
    });

    describe("Id validation", () => {
        test("Should fail if using invalid id", async () => {
            const res = await test_agent
                .put("/company/123/enable")
                .send(withGodToken())
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    param: "companyId",
                    msg: ValidationReasons.OBJECT_ID
                })
            ]));
        });

        test("Should fail if company does not exist", async () => {
            const id = "111111111111111111111111";
            const res = await test_agent
                .put(`/company/${id}/enable`)
                .send(withGodToken())
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    param: "companyId",
                    msg: ValidationReasons.COMPANY_NOT_FOUND(id)
                })
            ]));
        });
    });

    describe("Without auth", () => {

        let disabled_company;
        const disabled_company_data = {
            name: "disabled-company",
            isDisabled: true,
            hasFinishedRegistration: true
        };

        beforeAll(async () => {
            disabled_company = await Company.create(disabled_company_data);
        });

        afterAll(async () => {
            await Company.deleteMany({ name: disabled_company_data.name });
        });

        test("should fail to enable if not logged", async () => {

            const res = await test_agent
                .put(`/company/${disabled_company._id}/enable`)
                .expect(StatusCodes.UNAUTHORIZED);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    msg: ValidationReasons.INSUFFICIENT_PERMISSIONS
                })
            ]));
        });

    });

    describe("With auth", () => { });

    test("should fail to enable if logged as different company", async () => {

        await test_agent
            .post("/auth/login")
            .send(test_user_company_2)
            .expect(StatusCodes.OK);

        const res = await test_agent
            .put(`/company/${disabled_test_company_1._id}/enable`);

        expect(res.status).toBe(StatusCodes.FORBIDDEN);
        expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
        expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS_COMPANY_SETTINGS });

    });

    test("Should enable company if god token is sent", async () => {

        const res = await test_agent
            .put(`/company/${disabled_test_company_3._id}/enable`)
            .send(withGodToken());

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.isDisabled).toBe(false);
    });

    test("Should enable company if logged as admin", async () => {

        await test_agent
            .post("/auth/login")
            .send(test_user_admin)
            .expect(StatusCodes.OK);

        const res = await test_agent
            .put(`/company/${disabled_test_company_2._id}/enable`);

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.isDisabled).toBe(false);
    });

    test("Should enable company if logged as same company", async () => {

        await test_agent
            .post("/auth/login")
            .send(test_user_company_1)
            .expect(StatusCodes.OK);

        const res = await test_agent
            .put(`/company/${disabled_test_company_1._id}/enable`);

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.isDisabled).toBe(false);
    });

    test("should change offers' 'isHidden' on company enable", async () => {

        const offersBefore = await Offer.find({ owner: disabled_test_company_4._id });

        expect(offersBefore.every(({ isHidden }) => isHidden === true)).toBe(true);
        expect(offersBefore.every(
            ({ hiddenReason }) => hiddenReason === OfferConstants.HiddenOfferReasons.COMPANY_DISABLED)
        ).toBe(true);

        const res = await test_agent
            .put(`/company/${disabled_test_company_4._id}/enable`)
            .send(withGodToken());

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body.isDisabled).toBe(false);

        const offersAfter = await Offer.find({ owner: disabled_test_company_4._id });

        expect(offersAfter.every(({ isHidden }) => isHidden === false)).toBe(true);
        expect(offersAfter.every(({ hiddenReason }) => hiddenReason === undefined)).toBe(true);
    });

    test("should send an email to the company user when it is enabled", async () => {
        await test_agent
            .put(`/company/${disabled_test_company_mail._id}/enable`)
            .send(withGodToken())
            .expect(StatusCodes.OK);

        const emailOptions = COMPANY_ENABLED_NOTIFICATION(
            disabled_test_company_mail.name
        );

        expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
            subject: emailOptions.subject,
            to: test_user_mail.email,
            template: emailOptions.template,
            context: emailOptions.context,
        }));
    });
});
