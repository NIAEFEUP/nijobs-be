const {
    should,
    request,
} = require("./common");

const ERROR_TYPES = require("../src/routes/errors/errorHandler");
const Account = require("../src/models/Account");

describe("Register endpoint test", () => {
    
    afterEach("Clearing accounts", async () => {
        await Account.deleteMany({});
    });

    it("Should return a malformed request (missing username)", () => {
        return request().post("/api/register")
            .send({})
            .then(res => {
                res.should.have.status(400);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(false);
                res.body.should.have.property("reason").that.is.a("string");
                res.body.should.have.property("error_code").equal(ERROR_TYPES.MISSING_FIELD);
            });
    });

    it("Should return a malformed request (missing password)", () => {
        return request().post("/api/register")
            .send({
                username: "user"
            })
            .then(res => {
                res.should.have.status(400);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(false);
                res.body.should.have.property("reason").that.is.a("string");
                res.body.should.have.property("error_code").equal(ERROR_TYPES.MISSING_FIELD);
            });
    });
        
    it("Sould make a successful registration", async () => {
        const user = {
            username: "user",
            password: "password"
        };
        return request().post("/api/register")
            .send(user)
            .then(async res => {
                res.should.have.status(200);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(true);

                const registerd_user = await Account.findOne({username: user.username});
                should.exist(registerd_user);
                registerd_user.should.have.property("username").equal(user.username);
            });
    });    
});

describe("Using already resgistered user", () => {
    before("Adding user", async () => {
        this.user = {
            username: "user",
            password: "password"
        };

        await Account.create([this.user]);
    });

    it("Stop registering of users with duplicate usernames", () => {
        return request().post("/api/register")
            .send(this.user)
            .then(async res => {
                res.should.have.status(500);
                res.body.should.be.an("object");
                res.body.should.have.property("reason").that.is.a("string");
                res.body.should.have.property("success").equal(false);
                res.body.should.have.property("error_code").equal(ERROR_TYPES.DB_ERROR);
            });
    });


    it("Log in with registered account", async () => {
        return request().post("/api/login")
            .send(this.user)
            .then(async res => {
                res.should.have.status(200);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(true);
            });
    });
    
    // Cookie is to set so the logout can not be performed
    // it("Log out with registered account", async () => {        
    //     return request().delete("/api/login")
    //         .send()
    //         .then(async res => {
    //             res.should.have.status(200);
    //             res.body.should.be.an("object");
    //             res.body.should.have.property("success").equal(true);
    //         });
    // });


});