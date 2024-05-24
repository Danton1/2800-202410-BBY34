require("./utils.js");
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 3000;

const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const Joi = require("joi");

const expireTime = 24 * 60 * 60 * 1000; //expires after 24 hr  (hours * minutes * seconds * millis)

/* Open AI */
const { Configuration, OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.GPT_KEY });

/*Imported routes js files*/
const signUpRoute = require('./scripts/signUpPage');
app.use('/signUp', signUpRoute);
const forgotRoute = require('./scripts/forgotPage');
app.use('/forgot', forgotRoute);
const settingsRoute = require('./scripts/settings');
app.use('/settings', settingsRoute);
/*Imported routes js files end*/

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

var { database } = include('databaseConnection');

const userCollection = database.db(mongodb_database).collection('users');
const tokenCollection = database.db(mongodb_database).collection('forgotToken');

app.set('view engine', 'ejs');

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
})

// USES

// app.use(express.urlencoded({extended: false}));
app.use(express.urlencoded({ extended: true })); // testing

app.use(express.static(__dirname + "/public"));

app.get('/chat.js', function (req, res) {
    res.sendFile(__dirname + '/scripts/chat.js');
});

app.use(session({
    secret: node_session_secret,
    store: mongoStore, //default is memory store 
    saveUninitialized: false,
    resave: true
}
));

// FUNCTIONS

function isValidSession(req) {
    if (req.session.authenticated) {
        return true;
    }
    return false;
}

function sessionValidation(req, res, next) {
    if (isValidSession(req)) {
        next();
    }
    else {
        res.redirect('/login');
    }
}

function isAdmin(req) {
    if (req.session.user_type == 'admin') {
        return true;
    }
    return false;
}

function adminAuthorization(req, res, next) {
    console.log(req.session.user_type);
    if (!isAdmin(req)) {
        res.status(403);
        res.render("403");
        return;
    }
    else {
        next();
    }
}

// GETS

app.get('/', (req, res) => {
    if (isValidSession(req)) {
        res.render('index', { username: req.session.firstName, openWeatherAPIKey: process.env.OPEN_WEATHER_API_KEY });
        return;
    }
    res.redirect('/login');
});

// Get for login
app.get('/login', (req, res) => {
    res.render("loginPage");
});

// Get for profile
app.get('/profile', (req, res) => {
    if (isValidSession(req)) {
        res.render('profilePage', { user: req.session });
        return;
    }
    res.redirect('/login');
});
app.get('/profile/personalInfo', (req, res) => {
    if (isValidSession(req)) {
        res.render('personalInfoPage', { user: req.session });
        return;
    }
    res.redirect('/login');
});
app.get('/profile/contactInfo', (req, res) => {
    if (isValidSession(req)) {
        res.render('contactInfoPage', { user: req.session });
        return;
    }
    res.redirect('/login');
});
app.get('/profile/medHistory', (req, res) => {
    if (isValidSession(req)) {
        res.render('medicalHistoryPage', { user: req.session });
        return;
    }
    res.redirect('/login');
});

// Get for Settings
app.get('/settings', (req, res) => {
    res.render('settingsPage');
});
app.get('/settings/signOut', (req, res) => {
    req.session.destroy();
    console.log("You are now logged out.");
    res.redirect("/login");
});


// Get for chatbot
let myAssistant;
let myThread;
app.get('/chatbot', async (req, res) => {
    myAssistant = await openai.beta.assistants.create({
        model: "gpt-3.5-turbo-16k",
        instructions: "You are a helpful and friendly assistant named Dr. Kate and you're here to help the user diagnose any medical concerns they have or to provide general advice about personal health. If the user tries to go off topic, steer the conversation back to personal health advice. If you are unsure about something, ask the user for clarification. Try to keep your responses to around 100 words or less and use clear and simple language.",
        name: "Dr. Kate",
    });
    myThread = await openai.beta.threads.create();
    res.render("chatbotPage");
});

// Get for 404
app.get("*", (req, res) => {
    res.status(404);
    res.render("404Page");
})

// POSTS

app.post('/chatbot', async (req, res) => {
    const input = req.body.userInput;
    // console.log("in the post function");
    const processedData = `${input}`;
    const output = await runPrompt(input);
    var data = { processedData: processedData, output: output };
    console.log(data);
    // Send the processed data back to the client
    res.send(data);
});

const runPrompt = async (input) => {
    const prompt = input;
    const myThreadMessage = await openai.beta.threads.messages.create(
        myThread.id,
        {
            role: "user",
            content: prompt,
        }
    );

    const myRun = await openai.beta.threads.runs.create(
        myThread.id,
        { assistant_id: myAssistant.id }
    );

    const retrieveRun = async () => {
        let keepRetrievingRun;

        while (myRun.status === "queued" || myRun.status === "in_progress") {
            keepRetrievingRun = await openai.beta.threads.runs.retrieve(
                myThread.id,
                (run_id = myRun.id)
            );
            
            if (keepRetrievingRun.status === "completed") {

                const allMessages = await openai.beta.threads.messages.list(
                    myThread.id
                );

                // console.log("User: ", myThreadMessage.content[0].text.value);
                // console.log("User: ", myThreadMessage);
                console.log("Assistant: ", allMessages.data[0].content[0].text.value);
                
                return allMessages.data[0].content[0].text.value;;
            } else if (
                keepRetrievingRun.status === "queued" ||
                keepRetrievingRun.status === "in_progress"
            ) {
                // pass
            } else {
                console.log(`Run status: ${keepRetrievingRun.status}`);
                break;
            }
        }
    };
    return await retrieveRun();


    // try {
    //     const response = await openai.completions.create({
    //         model: "gpt-3.5-turbo-instruct",
    //         prompt: prompt,
    //         max_tokens: 2048,
    //         temperature: 1
    //     });
    //     return(response.choices[0].text);
    // } catch (error) {
    //     console.error("Error making API request:", error);
    // }
};

app.post('/editPass', async (req, res) => {
    res.redirect('/getPassEdit');
});

app.post('/submitLogin', async (req, res) => {
    var email = req.body.loginPageEmailInput;
    var password = req.body.loginPagePasswordInput;

    const schema = Joi.object({
        email: Joi.string().max(20).required(),
        password: Joi.string().max(20).required()
    });

    const validationResult = schema.validate({ email, password });
    if (validationResult.error != null) {
        res.render("errorPage", { error: validationResult.error });
        return;
    }

    const result = await userCollection.find({ email: email }).project({ email: 1, password: 1, _id: 1 }).toArray();

    // Getting the userName info from the email
    let getUser = userCollection.findOne({ email: email }).then((user) => {
        if (!user) {
            //if user does not exist, the authentication failed
            res.render("errorPage", { prompt: "Invalid email account" });
            return;
        }
        //assign the user to getUser variable
        getUser = user;
    })

    if (result.length == 0) {
        res.render("errorPage", { error: "No user with that email found" });
        return;
    } else if (result.length != 1) {
        res.render("errorPage", { error: "More than one user found." });
        return;
    } else {
        if (await bcrypt.compare(password, result[0].password)) {
            req.session.authenticated = true;
            req.session.cookie.maxAge = expireTime;
            req.session.email = result[0].email;
            req.session.firstName = getUser.firstName;
            req.session.lastName = getUser.lastName;
            req.session.birthDate = getUser.birthDate;
            req.session.country = getUser.country;
            req.session.city = getUser.city;

            res.redirect('/');
            return;
        }
        else {
            res.render("errorPage", { error: "Invalid password." });
            return;
        }
    }
});

// LISTENS

app.listen(port, () => {
    console.log("Node application listening on port " + port);
}); 