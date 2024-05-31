<p align="center"> 
  <img src="public/MediKate.gif" alt="Animated MediKate Logo" width="140px" height="140px">
</p>
<h1 align="center"> MediKate By BBY34 </h1>
<h3 align="center"> Composed of Danton, Soomin, Simon, Steven, Tyson and Jas </h3>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
![Tailwind](https://img.shields.io/badge/Tailwind-v3.4.3-blue.svg)
![NodeJS](https://img.shields.io/badge/Node.js-v20.14.0-red.svg)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-yellow.svg)
![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-pink.svg)
[![GitHub Issues](https://img.shields.io/github/issues/Danton1/2800-202410-BBY34.svg)](https://github.com/Danton1/2800-202410-BBY34/issues)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)


<!-- TABLE OF CONTENTS -->
<h2 id="table-of-contents"> :book: Table of Contents</h2>

<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#project-description"> ➤ Project Description </a></li>
    <li><a href="#Technologies"> ➤ Technologies </a></li>
    <li><a href="#Files"> ➤ Files </a></li>
    <li><a href="#Installation"> ➤ Installation </a></li>
    <li><a href="#Features"> ➤ Features</a></li>
    <li><a href="#Credits"> ➤ Credits</a></li>
    <li><a href="#AI_use"> ➤ AI Use</a></li>
    <li><a href="#Team-Contact-Information"> ➤ Team Contact Information</a></li>
  </ol>
</details>

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/aqua.png)
<!-- Project Description -->
<h2 id="project-description"> <img src="public/Kate.png" alt="Dr.Kate Logo" width="45px" height="45px"> Project Description</h2>
We have developed a medical application with climate change related health information and a chatbot for minor ailments and booking doctors appointments to help patients and medical professionals solve rising climate change concerns and overcrowding in our medical system by providing localized information on climate change and reducing the number of patients needing to see a doctor

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/aqua.png)
<!-- TECHNOLOGIES -->
<h2 id="Technologies"> 💻 Technologies</h2>

 **Front-end**
- Plain HTML and CSS
- Tailwind v3.4.3
- DaisyUI 4.11.1 (Tailwind plugin)
- JQuery v3.7.1
- EJS

**Back-end**
- JavaScript
- Node.js v20.14.0
- AJAX

**APIs**
- OpenAI: the custom assistant API was used for our chatbot
- Nodemailer: for sending out emails
- OpenWeather: for the user’s location/air quality/temperature data

**Database**
- MongoDB: for the basic database to store all user information
- Cloudinary: for the user’s profile pictures

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/aqua.png)
<!-- Files -->
<h2 id="Files"> 📁 Files</h2> 

```bash
├── README.md
├── databaseConnection.js
├── index.js
├── package.json
├── postcss.config.js
├── public
│   ├── Kate.png
│   ├── cute_robot_doctor.png
│   ├── mediKate.gif
│   ├── egg
│   │   ├── dre.jpeg
│   │   ├── house.webp
│   │   ├── pepper.webp
│   │   ├── phil.png
│   │   ├── strange.webp
│   │   ├── who.jpg
│   │   └── zoid.jpg
│   ├── js
│   │   ├── indexPage.js
│   │   ├── modal.js
│   │   └── notifications.js
│   ├── stylesheets
│   │   ├── main.css
│   │   ├── style.css
│   │   └── tailwind.css
│   ├── favicon.ico
│   └── favicon.png
├── scripts
│   ├── chat.js
│   ├── emailer.js
│   ├── forgotPage.js
│   ├── settings.js
│   └── signUpPage.js
├── tailwind.config.js
├── utils.js
└── views
    ├── 404Page.ejs
    ├── chatbotPage.ejs
    ├── contactInfoPage.ejs
    ├── errorPage.ejs
    ├── forgotPage.ejs
    ├── index.ejs
    ├── loginPage.ejs
    ├── medicalHistoryPage.ejs
    ├── personalInfoPage.ejs
    ├── profilePage.ejs
    ├── resetPage.ejs
    ├── settings
    ├── settingsPage.ejs
    ├── signUpPage.ejs
    ├── templatePage.ejs
    ├── widgetsPage.ejs
    └── templates
        ├── footerTemplate.ejs
        ├── headerTemplate.ejs
        ├── index_cards.ejs
        ├── widgetSettingsInputTemplate.ejs
        └── widgetSettingsSelectTemplate.ejs
```

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/aqua.png)
<!-- INSTALLATION -->
<h2 id="Installation"> 🗒️ Installation</h2>

### Prerequisites

Before you begin, ensure you have the following installed on your computer:

1. **Programming Language:**
   - Node.js (v14.x or higher)

2. **IDEs:**
   - Visual Studio Code (VS Code) or any IDE of your choice

3. **Database:**
   - MongoDB (Using MongoDB Atlas for cloud database)

4. **Other Software:**
   - Git (for version control)

## Installation Steps

### 1. Install Node.js
Download and install Node.js.

### 2. Install MongoDB
Create a free account and set up a cluster 

### 3. Install Git
Download and install Git.

### 4. Clone the Repository
Clone the project repository using Git:

```bash
git clone https://github.com/Danton1/2800-202410-BBY34.git
cd 2800-202410-BBY34
```
### 6. Install Project Dependencies
```bash
npm i
```

### Third-Party APIs and Frameworks

The project uses third-party APIs and frameworks. Ensure you have the following:

- **Express.js** (Web framework)
- **dotenv** (Environment variables management)
- **Cloudinary** (Image management)
- **OpenWeatherMap** (Weather data API)

### API Keys

Make sure you have the following API keys:

- **Cloudinary API Key**
- **OpenAI: the custom assistant API was used for the chatbot**
- **Nodemailer: for sending out emails**
- **OpenWeather: for the user’s location/air quality/temperature data**

You can get these keys by making an account on each platform.

## Configuration Instructions

### MongoDB Atlas

1. Set up a cluster on MongoDB Atlas.
2. Use the provided MongoDB connection string in your `.env` file.

### Express.js

1. Configure Express.js in your `index.js` file

### Cloudinary

1. Configure Cloudinary with your cloud name, API key, and API secret.

### VAPID Keys

1. Set up VAPID keys for push notifications.

## Running the Application

After setting up the environment variables and installing dependencies, run the application using:

```bash
node index.js
  ```
## Testing Plan

You can find the testing plan [here](https://docs.google.com/spreadsheets/d/1oQkwhU6SE1T3g4SqKNeCbMXQyNRwj8C552NXX3TV2gE/edit?usp=sharing). This includes our testing history and how you can contribute to fixing minor bugs.

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/aqua.png)
<!-- FEATURES -->
<h2 id="Features"> 🥇 Features </h2>

### Chatbot Integration
- **Health Concerns Assistance:** Users can navigate to the chatbot to discuss their health concerns.
- **Appointment Booking:** The chatbot can draft an email to a user's doctor's office to book an appointment using their account details.

### Climate Change Information
- **Localized Climate Data:** Users set their location to receive climate change information relevant to their area.
- **Landing Page Information:** Widgets display relevant climate information such as air quality and temperatures near the user's location.

### Health Information 
- **Save Personal Information:** Users can save personal information such as the users’ medical/prescription info for easy access by their doctor.


![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/aqua.png)
<!-- CREDITS -->
<h2 id="Credits"> 📜 Credits</h2>

- **https://github.com/andreasbm/readme**
- **https://github.com/ma-shamshiri/Pacman-Game/edit/master/README.md**
- **https://github.com/ai/size-limit/edit/main/README.md**


![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/aqua.png)
<!-- AI USE -->
<h2 id="AI_use"> 🤖 AI Use</h2>

#### 1. Did you use AI to help create your app?  
Yes, we used AI to assist in the development of our app. We used AI to generate suggestions and logic to solving specific coding problems. Although AI could not always resolve the issues directly, it provided valuable insights that we incorporated into our functions. We studied the AI's logic and adapted it to fit our requirements, making sure to understood and implemented the solutions ourselves.

#### 2. Did you use AI to create data sets or clean data sets?
No, we did not use AI to create or clean data sets. Our use of AI was mainly for problem-solving and providing suggestions during the app development process.

#### 3. Does your app use AI? 
No, our app does not use AI directly. The AI was used solely as a tool during the development phase to help solve coding challenges and provide suggestions.

#### 4. Did you encounter any limitations? What were they, and how did you overcome them?
Yes, we encountered several limitations while using AI. The AI often could not resolve the issues directly, even when provided with all the necessary EJS and JavaScript files. To overcome this, we used AI to generate suggestions for very specific problems. We then took these suggestions, studied the logic behind them, and incorporated the AI's logic into our own functions rather than copying it directly. This approach allowed us to ensure that we could explain and understand every aspect of our code!

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/aqua.png)
<!-- TEAM CONTACT INFORMATION -->
<h2 id="Team-Contact-Information"> 📫 Team Contact Information</h2>

## Team Email
- **Email:** [medikatecontact@gmail.com](mailto:medikatecontact@gmail.com)

## Team Members

### Danton Soares
- **GitHub:** [github.com/Danton1](https://github.com/Danton1)
- **Email:** [dantonvsoares@gmail.com](mailto:dantonvsoares@gmail.com)

### Tyson Chan
- **GitHub:** [github.com/tysonchan1](https://github.com/tysonchan1)
- **Email:** [tyson95577@gmail.com](mailto:tyson95577@gmail.com)

### Jaskirat Jhatu
- **GitHub:** [github.com/jjhatu](https://github.com/jjhatu)
- **Email:** [jjhatu1@gmail.com](mailto:jjhatu1@gmail.com)

### Simon Lotzkar
- **GitHub:** [github.com/SimonLotzkar](https://github.com/SimonLotzkar)
- **Email:** [simonlotzkar@gmail.com](mailto:simonlotzkar@gmail.com)

### Soomin Jeong
- **GitHub:** [github.com/SoominJ06](https://github.com/SoominJ06)
- **Email:** [sjeong0643@gmail.com](mailto:sjeong0643@gmail.com)

### Steven Xie
- **GitHub:** [github.com/sxht](https://github.com/sxht)
- **Email:** [steven.xht@gmail.com](mailto:steven.xht@gmail.com)
