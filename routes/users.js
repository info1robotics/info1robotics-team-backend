const router = require('express').Router();
const passport = require('passport');
const passportConfig = require('../passport');
const JWT = require('jsonwebtoken');
const multer = require('multer');

const User = require("../models/user.model").User;
let Upload = require("../models/upload.model");


const signToken = userID => {
    return JWT.sign({
        iss: "info1robotics",
        sub: userID
    }, process.env.SECRET_KEY, {expiresIn: "14d"});
};

router.route('/register').post((req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;
    const role = req.body.role;
    const secret = req.body.secret;

    if(secret !== process.env.REGISTER_SECRET) res.status(500).json({success: false, message: "Registration secret is incorrect!"});

    else User.findOne({username}, (err, user) => {
        if(err) res.status(500).json({success: false, message: err.message});
        else if(user) res.status(500).json({success: false, message: "User already exists!"});
        else {
            const newUser = new User({username, password, role, email});
            newUser.save(err => {
                if(err) res.status(500).json({success: false, message: err.message});
                else res.status(201).json({success: true, message: "User registration complete!"});
            })
        }
    });
});

router.route('/login').post(passport.authenticate('local', 
    {session: false}), 
    (req, res) => {
    

    if(req.isAuthenticated()) {
        const {_id, username, role, tags, email} = req.user;

        const token = signToken(_id);
        res.cookie('access_token', token, {httpOnly: true, sameSite: true});
        res.status(200).json({isAuthenticated: true, user: {_id, username, role, tags, email}});
    }
});

router.get('/logout', passport.authenticate('jwt', 
    {session: false}), 
    (req, res) => {
    

    res.clearCookie('access_token');
    res.json({user: {username: "", role: ""}, success: true});
});

router.get('/authenticated', passport.authenticate('jwt', { session: false }), (req, res) => {
    
    const {_id, username, role, tags, email} = req.user;

    res.status(201).json({isAuthenticated: true, user: {_id, username, role, tags, email}});
});

router.get('/uploads', passport.authenticate('jwt', {session: false}), (req, res) => {
    Upload.find({author: req.user._id})
          .populate('author', 'username role tags')
          .exec((err, uploads) => {
            if(err) res.status(500).json({success: false, message: err.message, uploads: []});
            else if(!uploads) res.status(201).json({uploads: []});
            else res.status(201).json({uploads});
         });
});



module.exports = router;