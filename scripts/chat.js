// require('dotenv').config();
// const express = require("express");
// const router = express.Router();

// const session = require('express-session');
// const MongoStore = require('connect-mongo');
// const bcrypt = require('bcrypt');
// const saltRounds = 12;

// const Joi = require("joi");

// const mongodb_host = process.env.MONGODB_HOST;
// const mongodb_user = process.env.MONGODB_USER;
// const mongodb_password = process.env.MONGODB_PASSWORD;
// const mongodb_database = process.env.MONGODB_DATABASE;
// const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

// const { Configuration, OpenAI } = require("openai");
// const openai = new OpenAI({apiKey: process.env.GPT_KEY});

// let input = "";


// router.post('/submitQuery', (req,res) =>{
//     input="req.body.inputBox"
//     console.log(input);
//     res.json([{
//         text: input
//     }]);
// })

// $(document).ready(function () { 
//     $("#submit").click(function () { 
//        $.post("/request", 
//           { 
//              name: "viSion", 
//              designation: "Professional gamer"
//           }, 
//           function (data, status) { 
//              console.log(data); 
//           }); 
//     }); 
//  });


// const runPrompt = async () => {
//     const prompt = input;
//     try {
//         const response = await openai.completions.create({
//             model: "gpt-3.5-turbo-instruct",
//             prompt: prompt,
//             max_tokens: 2048,
//             temperature: 1
//         });
//         console.log(response.choices[0].text);
//     } catch (error) {
//         console.error("Error making API request:", error);
//     }
// };

// if(typeof exports == "undefined"){
//     exports = this;
// }

// Example = function() {
//     console.log("example");
// };

// Example.prototype = {
//     init: function() {
//          console.log('hello world');
//     }
// };

// exports.Example = new Example();

// module.exports = submitQuery;
// module.exports = router;