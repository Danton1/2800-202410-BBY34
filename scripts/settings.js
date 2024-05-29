const express = require("express");
const router = express.Router();

router.get('/account', (req,res) => {
    res.redirect('/profile');
});

router.get('/aboutUs', (req,res) => {
    res.render("aboutUsPage");
});

module.exports = router;