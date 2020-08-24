var jwt = require("express-jwt");
var configSecret = require("../config").secret;
var Axios = require("axios");
var jsonwebtoken = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");

let cacheKeys = undefined;

const getPublicKeys = async (issuer) => {
  if (!cacheKeys) {
    const url = `${issuer}/.well-known/jwks.json`;
    const publicKeys = await Axios.default.get(url);
    cacheKeys = publicKeys.data.keys.reduce((agg, current) => {
      const pem = jwkToPem(current);
      agg[current.kid] = { instance: current, pem };
      return agg;
    }, {});
    return cacheKeys;
  } else {
    return cacheKeys;
  }
};

const secret = (req, header, payload, callback) => {
  if (payload && payload.iss) {
    getPublicKeys(payload.iss).then((publicKeys) => {
      const key = publicKeys[header.kid];
      if (!key) {
        throw new Error("claim made for unknown kid");
      }
      return callback(null, key.pem);
    });
  } else {
    console.log("no payload.iss");
    return callback(null, configSecret);
  }
};

function getTokenFromHeader(req) {
  if (
    (req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Token") ||
    (req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  return null;
}

var auth = {
  required: jwt({
    secret,
    userProperty: "payload",
    getToken: getTokenFromHeader,
  }),
  optional: jwt({
    secret,
    userProperty: "payload",
    credentialsRequired: false,
    getToken: getTokenFromHeader,
  }),
};

module.exports = auth;
