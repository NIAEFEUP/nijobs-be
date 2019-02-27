const {
    should,
    request,
    agent,
} = require("./common");

const ERROR_TYPES = require("../src/routes/errors/errorHandler");
const Account = require("../src/models/Account");

describe("Register endpoint test", () => {
    
    afterEach("Clearing accounts", async () => {
        await Account.deleteMany({});
    });

    it("Should return a malformed request (missing username)", () => {
        return request().post("/api/auth/register")
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
        return request().post("/api/auth/register")
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
        return request().post("/api/auth/register")
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
        this.agent = agent();

        this.user = {
            username: "user",
            password: "password"
        };

        await Account.create([this.user]);
    });

    it("Stop registering of users with duplicate usernames", () => {
        return request().post("/api/auth/register")
            .send(this.user)
            .then(async res => {
                res.should.have.status(500);
                res.body.should.be.an("object");
                res.body.should.have.property("reason").that.is.a("string");
                res.body.should.have.property("success").equal(false);
                res.body.should.have.property("error_code").equal(ERROR_TYPES.DB_ERROR);
            });
    });

    it("Should return forbidden when retrieving the information of the logged in user", async () => {
        return request().get("/api/auth/login")
            .send()
            .then(async res => {
                res.should.have.status(401);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(false);
                res.body.should.have.property("reason").that.is.a("string");
            });
    });


    it("Log in with registered account", async () => {
        return this.agent.post("/api/auth/login")
            .send(this.user)
            .then(async res => {
                res.should.have.cookie("connect.sid");
                res.should.have.status(200);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(true);
            });
    });

    it("Get logged in user info", async () => {
        return this.agent.get("/api/auth/login")
            .send()
            .then(async res => {
                res.should.have.status(200);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(true);
                res.body.should.have.nested.property("data.username").equal(this.user.username);
            });
    });

    it("Log out with registered account", async () => {        
        return this.agent.delete("/api/auth/login")
            .send()
            .then(async res => {
                res.should.have.status(200);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(true);
            });
    });

    it("Verify if the log out happen server side", async () => {
        return this.agent.get("/api/auth/login")
            .send()
            .then(async res => {
                res.should.have.status(401);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(false);
                res.body.should.have.property("reason").that.is.a("string");
            });
    });


});