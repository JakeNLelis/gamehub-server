const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// Determine the correct callback URL based on environment
const callbackURL =
  process.env.GOOGLE_CALLBACK_URL ||
  "http://localhost:5000/api/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // User doesn't exist, create new user
        const userData = {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          // generate a unique username
          username:
            profile.displayName.toLowerCase().replace(/ /g, ".") + Date.now(),
        };

        if (profile.photos && profile.photos.length > 0) {
          userData.avatar = profile.photos[0].value;
        } else {
          userData.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            userData.name
          )}&background=random`;
        }

        user = await User.create(userData);

        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
