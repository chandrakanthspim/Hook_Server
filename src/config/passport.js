const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require('./config');
const { tokenTypes } = require('./tokens');
const { Admin, Builder, Employee } = require('../models');

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type');
    }
    let user;
    if (payload.role == 'admin') {
      user = await Admin.findById(payload.sub);
    } else if (payload.role == 'builder') {
      user = await Builder.findById(payload.sub);
    } else if (payload.role == 'agent') {
      user = await Builder.findById(payload.sub);
    }
    else if (payload.role == 'employee') {
      user = await Employee.findById(payload.sub);
    }
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};
