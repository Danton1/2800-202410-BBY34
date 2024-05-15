const express = require('express');
const router = express.Router();

router.get('/', (req,res) => {
    res.render('profilePage');
});

router.get('/getPersonalInfo', (req,res) => {
    res.render('personalInfoPage');
});

router.get('/getContactInfo', (req,res) => {
    res.render('contactInfoPage');
});

router.get('/getMedHistory', (req,res) => {
    res.render('medicalHistoryPage');
});

module.exports = router;