// Set up passport middleware for sessions
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import Account from "../models/Account.js";

// Passport configuration
passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password"
},
async (email, password, done) => {
    try {
        const user = await Account.findOne({ email });

        if (!user || !(await user.validatePassword(password))) {
            return done(null, false, { message: "Incorrect email or password." });
        }

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await Account.findById(id);

        done(null, user);
    } catch (err) {
        done(err);
    }
});
