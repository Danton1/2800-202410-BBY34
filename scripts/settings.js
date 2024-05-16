const express = require("express");
const router = express.Router();

router.get('/account', (req,res) => {
    res.redirect('/getProfilePage');
});

router.get('/language', (req,res) => {
    res.render("language");
});

router.get('/about', (req,res) => {
    res.render("about");
});

router.get('/terms', (req,res) => {
    res.render("terms");
});

router.get('/contact', (req,res) => {
    res.render("contact");
});

router.get('/faq', (req,res) => {
    res.render("faq");
});

router.get('/signOut', (req,res) => {
    //req.session.destroy();
    res.redirect('/login');
});

module.exports = router;