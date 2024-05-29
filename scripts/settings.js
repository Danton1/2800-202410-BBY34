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

// router.get('*', (req,res) => {
//     res.status(404);
// 	res.render("404Page");
// });

module.exports = router;