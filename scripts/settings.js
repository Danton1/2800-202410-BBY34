const express = require("express");
const router = express.Router();


router.get('/', (req, res) => {
    res.render('settingsPage');
});

router.get('/account', (req,res) => {
    res.redirect('/profile');
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

router.get('*', (req,res) => {
    res.status(404);
	res.render("404Page");
});

module.exports = router;