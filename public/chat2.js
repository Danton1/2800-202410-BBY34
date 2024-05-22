
require("./utils.js");
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

$(function () { 
    $("#chatInput").on("submit", function (event) { 
       event.preventDefault();
       let value = $("#chatButton").val();
       console.log(value);
       $.ajax({
            url: "/chatBot",
            method:"POST",
            contentType: "application/json",
            data:JSON.stringify({quote: value}),
            success: function(res){
                console.log(res.text);
                $("#testing").html(`Text: ${res.text}`);
            }


       })
    }); 
 }); 