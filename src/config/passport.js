// Set up passport middleware for sessions
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const Account = require("../models/Account");

// Passport configuration
passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password",
},
(email, password, done) => {
    Account.findOne({ email: email }, (err, user) => {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, { message: "Incorrect email." });
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
