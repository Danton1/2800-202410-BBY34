// import express from 'express';

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
// // const node_session_secret = process.env.NODE_SESSION_SECRET;

// var { database } = include('databaseConnection');
// const userCollection = database.db(mongodb_database).collection('users');
// const tokenCollection = database.db(mongodb_database).collection('forgotToken');

// var mongoStore = MongoStore.create({
//     mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
//     crypto: {
//         secret: mongodb_session_secret
//     }
// })

// // USES
// router.use(express.urlencoded({ extended: true }));
// router.use(express.static(__dirname + "/public"));

// const { Configuration, OpenAI } = require("openai");
// const openai = new OpenAI({apiKey: process.env.GPT_KEY});

let input = "";

$(function () {
    $('#chatButton').on("click", function () {
        // Get the input value
        const userInput = $('#chatbotTextBox').val();
        // Send AJAX request to the server
        $('#output').append(`
            <div class="chat chat-end">
            <div class=" flex items-end gap-2">
                <time class="text-xs opacity-50">12:46</time>
                <div id="testing" class="chat-bubble py-4 px-5 bg-gray-700 text-sky-100">
                    ${userInput}
                </div>
            </div>
            <div class="flex flex-col justify-center items-center">
                <div class="chat-header mb-2">
                    You
                </div>
                <div class="chat-image avatar">
                    <div class="w-[50px] rounded-full">
                        <img alt="User profile"
                            src="https://play-lh.googleusercontent.com/yvoeLsYXfwqgH3H4mgljOio6wMomgfgwguEl4yegpkgjtDoCWz71qSLVHI6UAyCxfA" />
                    </div>
                </div>
            </div>
        </div>
        
        `);
        $('#chatbotTextBox').val("");
        console.log("userInput: " + JSON.stringify({ userInput }));
        $.ajax({
            url: '/chat/chatbot',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ userInput }),
            success: function (response) {
                console.log("success");
                // input = response;
                // Update the page with the processed data

                $('#output').append(`
                <div class="chat chat-start">
                    <div class="flex flex-col justify-center items-center">
                        <div class="chat-header mb-2">
                            Kate
                        </div>
                        <div class="chat-image avatar">
                            <div class="w-[50px] rounded-full">
                                <img alt="chatbot profile pic" src="Kate.png" />
                            </div>
                        </div>
                    </div>
                    <div class="w-full flex items-end gap-2">
                        <div class="chat-bubble py-4 px-5 bg-gray-700 text-sky-100">
                        ${response.output}
                        </div>
                        <time class="text-xs opacity-50">12:45</time>
                    </div>
                </div>
                `);

                // runPrompt();
            },
            error: function (xhr, status, error) {
                console.error('Error:', error);
            }
        });
    });
});


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


// $(function () {
//     $("#chatInput").on("submit", function (event) {
//        event.preventDefault();
//        let value = $("#chatbotTextBox").val();
//        console.log(value);
//        $.ajax({
//             url: "/chatBot",
//             type:"POST",
//             contentType: "application/json",
//             data: JSON.stringify({value}),
//             success: function(res){
//                 console.log("res.text: " + res.response);
//                 console.log("here");
//                 $("#testing").html(`${res.response}`);
//             }


//        })
//     });
//  });

//  module.exports = router