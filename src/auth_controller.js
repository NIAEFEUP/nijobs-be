// Set up passport middleware for sessions
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const Account = require("./models/Account");
const ERROR_TYPES = require("./routes/errors/errorHandler");

// Middleware to require login in an endpoint
const authRequired = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({
        "success": false,
        "reason": "Must be logged in",
        "code": ERROR_TYPES.FORBIDDEN,
    });
};

// Passport configuration
passport.use(new LocalStrategy(
    (username, password, done) => {
        Account.findOne({ username: username }, (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, { message: "Incorrect username." });
            }
            if (!user.validatePassword(password)) {
                return done(null, false, { message: "Incorrect password." });
            }
            return done(null, user);
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    Account.findById(id, function(err, user) {
        done(err, user);
    });
});


module.exports = authRequired;
