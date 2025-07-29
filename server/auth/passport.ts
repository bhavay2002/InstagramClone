import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "../storage";
import type { User } from "../types/user"; // Make sure you define this

// Constants
const GOOGLE_CALLBACK_URL = "/api/auth/google/callback";
const LOCAL_FIELDS = { usernameField: "email" };

// Local Strategy - Email + Password
passport.use(
  new LocalStrategy(LOCAL_FIELDS, async (email, password, done) => {
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

// Google OAuth Strategy - If Env Vars are Set
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(null, false, { message: "No email from Google" });

          let user = await storage.getUserByEmail(email);

          if (user) {
            user = await storage.updateUser(user.id, {
              firstName: profile.name?.givenName || user.firstName,
              lastName: profile.name?.familyName || user.lastName,
              profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
              updatedAt: new Date(),
            });
          } else {
            user = await storage.upsertUser({
              id: crypto.randomUUID(),
              email,
              firstName: profile.name?.givenName || "",
              lastName: profile.name?.familyName || "",
              username: email.split("@")[0],
              profileImageUrl: profile.photos?.[0]?.value || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
} else {
  console.warn("[AUTH] Google OAuth not configured - missing GOOGLE_CLIENT_ID/SECRET");
}

// Serialize & Deserialize for Session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    return done(null, user || null);
  } catch (err) {
    done(err);
  }
});

export { passport };
