var router = require('express').Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var auth = require('../auth');

const getUserById = async (id) => {
  return User.findById(id);
};

const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

const getUser = async (req)=>{
  if (req.payload.iss) {
    return getUserByEmail(req.payload.username);
  } else {
    return getUserById(req.payload.id);
  }
}

// Preload user profile on routes with ':username'
router.param('username', function(req, res, next, username){
  User.findOne({username: username}).then(function(user){
    if (!user) { return res.sendStatus(404); }

    req.profile = user;

    return next();
  }).catch(next);
});

router.get('/:username', auth.optional, function(req, res, next){
  if(req.payload){
    getUser(req).then(function(user){
      if(!user){ return res.json({profile: req.profile.toProfileJSONFor(false)}); }

      return res.json({profile: req.profile.toProfileJSONFor(user)});
    });
  } else {
    return res.json({profile: req.profile.toProfileJSONFor(false)});
  }
});

router.post('/:username/follow', auth.required, function(req, res, next){
  var profileId = req.profile._id;

  getUser(req).then(function(user){
    if (!user) { return res.sendStatus(401); }

    return user.follow(profileId).then(function(){
      return res.json({profile: req.profile.toProfileJSONFor(user)});
    });
  }).catch(next);
});

router.delete('/:username/follow', auth.required, function(req, res, next){
  var profileId = req.profile._id;

  getUser(req).then(function(user){
    if (!user) { return res.sendStatus(401); }

    return user.unfollow(profileId).then(function(){
      return res.json({profile: req.profile.toProfileJSONFor(user)});
    });
  }).catch(next);
});

module.exports = router;
