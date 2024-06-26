/*Global Variables*/
let input = "";
var imgSrc = "Kate.png";
var imgName = "Dr.Kate";
var userCounter = 0;
var gptCounter = 0;
let userProfile = document.getElementById('chatJS').getAttribute("profile");
userProfile = userProfile ? userProfile : "defaultProfilePic.png"
var tempEgg = 0;

$(function () {
    $('#chatForm').on("submit", function (event) {
        event.preventDefault();
        $("#chatButton").prop("disabled", true);

        // Getting time
        let date = new Date;
        let time = date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();

        // Get the input value
        const userInput = $('#chatbotTextBox').val();
        if (userInput === "") {
            return;
        }

        // Display user input
        $('#chatHistoryWrap').append(`
            <div class="max-w-full chat chat-end">
                <div class="flex items-end gap-2">
                    <time class="text-xs opacity-50">${time}</time>
                    <div id="testing${userCounter}" class="chat-bubble py-4 px-5 bg-gray-700 text-sky-100">
                        ${userInput}
                    </div>
                </div>
                <div class="flex flex-col justify-center items-center">
                    <div class="chat-header mb-2">
                        You
                    </div>
                    <div class="chat-image avatar">
                        <div class="w-[50px] rounded-full">
                            <img alt="User profile" src="${userProfile}" class="w-full h-full rounded-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>
        
            <div id="loading" class="chat chat-start items-end justify-items-end">
                <div class="flex flex-col justify-center items-center">
                    <div class="chat-header mb-2">
                        ${imgName}
                    </div>
                    <div class="chat-image avatar">
                        <div class="w-[50px] rounded-full">
                            <img alt="chatbot profile pic" src=${imgSrc} />
                        </div>
                    </div>
                </div>
                <div class="w-full flex items-end gap-2">
                    <div class="chat-bubble py-4 px-5 bg-gray-700 text-sky-100">
                    <div class="animate-bounce"> ... </div>
                    </div>
                    
                </div>
            </div>`);

        // Reset input textbox
        $('#chatbotTextBox').val("");

        // Scroll to bottom of chat
        var box = $(`#testing${userCounter}`);
        box[0].scrollIntoView();
        userCounter++;

        // Send AJAX request to the server
        $.ajax({
            url: '/chatbot',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ userInput }),
            success: function (response) {
                // Update time
                date = new Date;
                time = date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();

                // Format the chatbot's response
                const obj = JSON.parse(response.output);
                let outputString = obj.message;
                let egg = JSON.parse(response.eggNum);

                // Extracts into from hidden inputs
                if (response.sendEmail == "true") {
                    $("#emailDate").val(response.emailDate);
                    $("#emailTime").val(response.emailTime);
                    $("#emailIssue").val(response.emailIssue);
                    outputString += "<br><button class='w-full py-2 mt-3 rounded-xl bg-emerald-600 flex justify-center items-center hover:bg-emerald-500 duration-200' type='submit' form='bookAppointment' id='emailSubmit'>Book Appointment <i class='ml-2 fa-solid fa-angle-right'></i></button>";
                }

                // Removes thinking text box
                $("#loading").remove();

                // Display chatbot's response
                $('#chatHistoryWrap').append(`
                <div class="chat chat-start items-end justify-items-end">
                    <div class="flex flex-col justify-center items-center">
                        <div class="chat-header mb-2">
                            ${imgName}
                        </div>
                        <div class="chat-image avatar">
                            <div class="w-[50px] rounded-full">
                                <img alt="chatbot profile pic" src=${imgSrc} />
                            </div>
                        </div>
                    </div>
                    <div class="w-full flex items-end gap-2">
                        <div id="gptOutput${gptCounter}" class="chat-bubble py-4 px-5 bg-gray-700 text-sky-100">
                        ${outputString}
                        </div>
                        <time class="text-xs opacity-50">${time}</time>
                    </div>
                </div>`);

                // Updates chatbox divs.
                box = $(`#gptOutput${gptCounter}`);
                box[0].scrollIntoView(false);

                // Enables next message
                $("#chatButton").prop("disabled", false);
                gptCounter++;

                // Checks to see if easter egg is activated
                if (egg != tempEgg && egg != 0) {
                    tempEgg = egg;
                }
                if (tempEgg != 0) {
                    //change background here
                    $('#bigwrap').css('background-image', 'url(/egg/office.jpg)');
                    $('#bigwrap').css('background-size', 'cover');

                }

                // Switch case for each type of easter egg doctor
                switch (egg) {
                    case 1:
                        imgSrc = "egg/who.jpg";
                        imgName = "Dr. Who";
                        break;
                    case 2:
                        imgSrc = "egg/phil.png";
                        imgName = "Dr. Phil";
                        break;
                    case 3:
                        imgSrc = "egg/dre.jpeg";
                        imgName = "Dr. Dre";
                        break;
                    case 4:
                        imgSrc = "egg/pepper.webp";
                        imgName = "Dr. Pepper";
                        break;
                    case 5:
                        imgSrc = "egg/strange.webp";
                        imgName = "Dr. Strange";
                        break;
                    case 6:
                        imgSrc = "egg/house.webp";
                        imgName = "Dr. House";
                        break;
                    case 7:
                        imgSrc = "egg/zoid.jpg";
                        imgName = "Dr. Zoid";
                        break;
                    default:
                        break;
                }

            },

            // Updates chat log again.
            error: function (xhr, status, error) {
                $("#loading").remove();
                $('#chatHistoryWrap').append(`
                <div class="chat chat-start items-end justify-items-end">
                    <div class="flex flex-col justify-center items-center">
                        <div class="chat-header mb-2">
                            ${imgName}
                        </div>
                        <div class="chat-image avatar">
                            <div class="w-[50px] rounded-full">
                                <img alt="chatbot profile pic" src=${imgSrc} />
                            </div>
                        </div>
                    </div>
                    <div class="w-full flex items-end gap-2">
                        <div id="gptOutput${gptCounter}" class="chat-bubble py-4 px-5 bg-gray-700 text-sky-100">
                        An error occured
                        </div>
                        <time class="text-xs opacity-50">${time}</time>
                    </div>
                </div>`)
            }
        });
    });
});
