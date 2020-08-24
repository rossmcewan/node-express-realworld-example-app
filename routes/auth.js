var jwt = require('express-jwt');
var configSecret = require('../config').secret;
var Axios = require('axios')
var jsonwebtoken = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');

const cacheKeys = undefined;

const getPublicKeys = async (issuer)=>{
  if(!cacheKeys){
    const url = `${issuer}/.well-known/jwks.json`
    const publicKeys = await Axios.default.get(url);
    cacheKeys = publicKeys.data.keys.reduce((agg, current) => {
      const pem = jwkToPem(current);
      agg[current.kid] = {instance: current, pem};
      return agg;
    },{});
    return cacheKeys;
  }else{
    return cacheKeys;
  }
}

const secret = (req, header, payload, callback)=>{
  console.log('req', JSON.stringify(req));
  console.log('header', JSON.stringify(header));
  console.log('payload', JSON.stringify(payload));
  return callback(configSecret)
}

function getTokenFromHeader(req){
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token' ||
      req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
}

var auth = {
  required: jwt({
    secret,
    userProperty: 'payload',
    getToken: getTokenFromHeader
  }),
  optional: jwt({
    secret,
    userProperty: 'payload',
    credentialsRequired: false,
    getToken: getTokenFromHeader
  })
};

module.exports = auth;
