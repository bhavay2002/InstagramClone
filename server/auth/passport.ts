import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "../storage";
import { getAuthConfig, isGoogleOAuthConfigured } from './config';
import type { PassportUser, GoogleProfile } from './types';

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

// Google OAuth Strategy - only configure if credentials are available
const configureGoogleStrategy = () => {
  if (!isGoogleOAuthConfigured()) {
    console.log("[AUTH] Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not provided");
    return;
  }

  const config = getAuthConfig();
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.googleClientId!,
        clientSecret: config.googleClientSecret!,
        callbackURL: "/api/auth/google/callback"
      },
      async (accessToken: string, refreshToken: string, profile: any, done) => {
        try {
          const googleProfile = profile as GoogleProfile;
          const email = googleProfile.emails?.[0]?.value || "";
          
          if (!email) {
            return done(new Error("No email provided by Google"), false);
          }

          // Check if user already exists with this email
          let user = await storage.getUserByEmail(email);
          
          if (user) {
            // User exists, update their profile with latest Google data
            user = await storage.updateUser(user.id, {
              firstName: googleProfile.name?.givenName || user.firstName,
              lastName: googleProfile.name?.familyName || user.lastName,
              profileImageUrl: googleProfile.photos?.[0]?.value || user.profileImageUrl,
              updatedAt: new Date(),
            });
          } else {
            // Create new user from Google profile
            user = await storage.upsertUser({
              id: crypto.randomUUID(),
              email,
              firstName: googleProfile.name?.givenName || "",
              lastName: googleProfile.name?.familyName || "",
              username: email.split('@')[0] || crypto.randomUUID().substring(0, 8),
              profileImageUrl: googleProfile.photos?.[0]?.value || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          return done(null, user);
        } catch (error) {
          console.error("[AUTH] Google OAuth error:", error);
          return done(error, false);
        }
      }
    )
  );
};

// Initialize Google strategy
configureGoogleStrategy();

// Serialize only the user ID into the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      return done(new Error("User not found"), false);
    }
    done(null, user);
  } catch (error) {
    console.error("[AUTH] Error deserializing user:", error);
    done(error, false);
  }
});

export default passport;

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
