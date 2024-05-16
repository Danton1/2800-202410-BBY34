const express = require("express");
const router = express.Router();

router.get('/', (req, res) => {
    res.render("forgotPage");
});

router.post('/submitForgot', async (req,res) => {
    var forgotEmail = req.body.forgotEmail;
    
    const schema = Joi.object(
		{
			email: Joi.string().max(20).required(),
		});

	const validationResult = schema.validate({email});
	if (validationResult.error != null) {
        res.render("errorPage", {error: validationResult.error});
        return;
	}

    const result = await userCollection.find({email: email}).project({email: 1, _id: 1}).toArray();

    if (result.length == 0) {
        res.render("errorPage", {error: "No user with that email found"});
        return;
	} else {
        //create and store token
    }
});

module.exports = router;