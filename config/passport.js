const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const pool = require('./database');

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const name = profile.displayName;
      
      // 1. Check if user exists
      let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length > 0) {
        return done(null, result.rows[0]);
      }
      
      // 2. If not, create new user
      // Check if this is the admin email
      const isAdmin = email === process.env.ADMIN_EMAIL;
      const role = isAdmin ? 'admin' : 'guide';

      const newUser = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, 'social_login_no_password', role]
      );
      
      return done(null, newUser.rows[0]);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`;
      const name = profile.displayName;
      
      let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length > 0) {
        return done(null, result.rows[0]);
      }
      
      const newUser = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, 'social_login_no_password', 'guide']
      );
      
      return done(null, newUser.rows[0]);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
