import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "../storage";

// Local Strategy: email + password
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) return done(null, false, { message: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password ?? "");
      if (!isMatch) return done(null, false, { message: "Invalid password" });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await storage.getUserByEmail(profile.emails?.[0]?.value || "");
        
        if (user) {
          // User exists, update their profile
          user = await storage.updateUser(user.id, {
            firstName: profile.name?.givenName || user.firstName,
            lastName: profile.name?.familyName || user.lastName,
            profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
          });
        } else {
          // Create new user
          user = await storage.upsertUser({
            id: crypto.randomUUID(),
            email: profile.emails?.[0]?.value || "",
            firstName: profile.name?.givenName || "",
            lastName: profile.name?.familyName || "",
            username: profile.emails?.[0]?.value?.split('@')[0] || crypto.randomUUID().substring(0, 8),
            profileImageUrl: profile.photos?.[0]?.value || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize only the user ID into the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user ID from session, fetch full user
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user || null);
  } catch (err) {
    done(err);
  }
});

export { passport };
