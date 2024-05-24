require('dotenv').config();
const express = require("express");
const router = express.Router();

const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const Joi = require("joi");

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const { Configuration, OpenAI } = require("openai");
const openai = new OpenAI({apiKey: process.env.GPT_KEY});

let input = "";


router.post('/chatbot', async (req, res) => {
    const input = req.body.userInput;
    // Process userInput as needed
    console.log("in the post function");
    // const processedData = `You entered: ${input}`;
    const processedData = `${input}`;

    const output = await runPrompt(input);
    // Send the processed data back to the client
    // console.log(processedData);
    // res.send(processedData);
    // console.log(output);
    var data = { processedData: processedData, output: output };
    console.log(data);

    res.send(data);

});


const runPrompt = async () => {
    const prompt = input;
    try {
        const response = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt: prompt,
            max_tokens: 2048,
            temperature: 1
        });
        console.log(response.choices[0].text);
    } catch (error) {
        console.error("Error making API request:", error);
    }
};

module.exports = router;