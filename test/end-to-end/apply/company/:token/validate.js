import EmailService from "../../../../../src/lib/emailService";
import { StatusCodes } from "http-status-codes";
import CompanyApplication from "../../../../../src/models/CompanyApplication.js";
import Account from "../../../../../src/models/Account.js";
import { NEW_COMPANY_APPLICATION_ADMINS, NEW_COMPANY_APPLICATION_COMPANY }
    from "../../../../../src/email-templates/companyApplicationApproval";
import config from "../../../../../src/config/env";
import * as token from "../../../../../src/lib/token.js";
import Company from "../../../../../src/models/Company";
import { VALIDATION_LINK_EXPIRATION } from "../../../../../src/models/constants/ApplicationStatus.js";
import { SECOND_IN_MS } from "../../../../../src/models/constants/TimeConstants.js";
const generateTokenSpy = jest.spyOn(token, "generateToken");
jest.spyOn(token, "verifyAndDecodeToken");

describe("POST /apply/company/:token/validate", () => {

    describe("Validating application", () => {
        const application = {
            email: "test@test.com",
            password: "password123",
            companyName: "Testing company",
            motivation: "This company has a very valid motivation because otherwise, the tests would not exist.",
        };

        beforeAll(async () => {
            await CompanyApplication.deleteMany({});
            await Account.deleteMany({});
        });

        afterEach(async () => {
            await CompanyApplication.deleteMany({});
            await Account.deleteMany({});
            await Company.deleteMany({});
        });

        test("Should validate application and create its account and company", async () => {
            await request()
                .post("/apply/company")
                .send(application)
                .expect(StatusCodes.OK);

            const generatedToken = generateTokenSpy.mock.results[0].value;

            await request()
                .post(`/apply/company/${generatedToken}/validate`)
                .expect(StatusCodes.OK);

            const applicationUpdated = await CompanyApplication.findOne({ application });
            const account = await Account.findOne({ email: application.email });

            expect(account).not.toBeNull();
            expect(Company.findOne({ _id: account.company })).toBeTruthy();
            expect(applicationUpdated.state).toBe("PENDING");
        });

        test("Should send an email to the company and one to the NIJobs team", async () => {
            const res = await request()
                .post("/apply/company")
                .send(application)
                .expect(StatusCodes.OK);

            const generatedToken = generateTokenSpy.mock.results[0].value;

            await request()
                .post(`/apply/company/${generatedToken}/validate`)
                .expect(StatusCodes.OK);

            const adminEmailOptions = NEW_COMPANY_APPLICATION_ADMINS(
                application.email,
                application.companyName,
                application.motivation
            );

            const companyEmailOptions = NEW_COMPANY_APPLICATION_COMPANY(
                application.companyName,
                res.body._id
            );

            expect(EmailService.sendMail).toHaveBeenNthCalledWith(2, expect.objectContaining({
                subject: adminEmailOptions.subject,
                to: config.mail_from,
                template: adminEmailOptions.template,
                context: { ...adminEmailOptions.context },
            }));

            expect(EmailService.sendMail).toHaveBeenNthCalledWith(3, expect.objectContaining({
                subject: companyEmailOptions.subject,
                to: application.email,
                template: companyEmailOptions.template,
                context: { ...companyEmailOptions.context },
            }));
        });

        test("Should fail if application is already validated", async () => {
            await request()
                .post("/apply/company")
                .send(application)
                .expect(StatusCodes.OK);

            const generatedToken = generateTokenSpy.mock.results[0].value;

            await request()
                .post(`/apply/company/${generatedToken}/validate`)
                .expect(StatusCodes.OK);

            await request()
                .post(`/apply/company/${generatedToken}/validate`)
                .expect(StatusCodes.CONFLICT);
        });

        test("Should fail if token does not exist", async () => {
            await request()
                .post(`/apply/company/${0}/validate`)
                .expect(StatusCodes.NOT_FOUND);

        });

        test("Should fail if link has expired", async () => {
            await request()
                .post("/apply/company")
                .send(application)
                .expect(StatusCodes.OK);

            const generatedToken = generateTokenSpy.mock.results[0].value;
            const RealDateNow = Date.now;
            const mockCurrentDate = new Date(Date.now() + (VALIDATION_LINK_EXPIRATION * SECOND_IN_MS));
            Date.now = () => mockCurrentDate;
            await request()
                .post(`/apply/company/${generatedToken}/validate`)
                .expect(StatusCodes.GONE);

            Date.now = RealDateNow;
        });
    });
});
