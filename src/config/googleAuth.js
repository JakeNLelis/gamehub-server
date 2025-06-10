const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// Determine the correct callback URL based on environment
const getCallbackURL = () => {
  if (process.env.VERCEL_URL) {
    // Running on Vercel
    return `https://${process.env.VERCEL_URL}/api/auth/google/callback`;
  } else if (process.env.GOOGLE_CALLBACK_URL) {
    // Use explicit callback URL from environment
    return process.env.GOOGLE_CALLBACK_URL;
  } else {
    // Fallback to localhost for development
    return "http://localhost:5000/api/auth/google/callback";
  }
};

const callbackURL = getCallbackURL();

console.log("🔧 Initializing Google OAuth Strategy");
console.log(
  "GOOGLE_CLIENT_ID:",
  process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing"
);
console.log(
  "GOOGLE_CLIENT_SECRET:",
  process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing"
);
console.log(
  "GOOGLE_CALLBACK_URL:",
  process.env.GOOGLE_CALLBACK_URL || "❌ Missing/Undefined"
);
console.log("VERCEL_URL:", process.env.VERCEL_URL || "❌ Not on Vercel");
console.log("Computed Callback URL:", callbackURL);

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
          // User exists, update their information
          user.name = profile.displayName;
          user.email = profile.emails[0].value;
          await user.save();
          return done(null, user);
        }

        // User doesn't exist, create new user
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        });

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
