// Set up passport middleware for sessions
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const Company = require("./models/Company");


passport.use(new LocalStrategy(
    (username, password, done) => {
        Company.findOne({ username: username }, (err, company) => {
            if (err) {
                return done(err); 
            }
            if (!company) {
                return done(null, false, { message: "Incorrect username." });
            }
            if (!company.validatePassword(password)) {
                return done(null, false, { message: "Incorrect password." });
            }
            return done(null, company);
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    Company.findById(id, function(err, company) {
        done(err, company);
    });
});

module.exports = passport;