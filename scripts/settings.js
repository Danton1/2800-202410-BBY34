// basic render and rediction for settings page
const express = require("express");
const router = express.Router();

router.get('/', (req, res) => {
    res.render('settingsPage');
});

router.get('/account', (req,res) => {
    res.redirect('/profile');
});

router.get('/aboutUs', (req,res) => {
    res.render("aboutUsPage");
});

module.exports = router;