let input = "";
var imgSrc = "Kate.png";
var imgName = "Dr.Kate";
var userCounter = 0;
var gptCounter = 0;
let userProfile = document.getElementById('chatJS').getAttribute("profile");
userProfile = userProfile ? userProfile : "defaultProfilePic.png"

$(function () {
    $('#chatForm').on("submit", function (event) {
        event.preventDefault();

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
        </div>`);

        // Reset input textbox
        $('#chatbotTextBox').val("");

        var box = $(`#testing${userCounter}`);
        // console.log(box[0].scrollHeight);
        box[0].scrollIntoView();
        userCounter++;
        // window.scrollTo(0, box[0].scrollHeight);

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
                console.log(response);
                // Format the chatbot's response
                const obj = JSON.parse(response.output);
                let outputString = obj.message;
                let egg = JSON.parse(response.eggNum);
                // console.log(obj);

                // let formattedOutput = outputString.join("\n");
                // formattedOutput = formattedOutput.replaceAll("\n", "<br>");



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
                box = $(`#gptOutput${gptCounter}`);
                // console.log(box[0].id);
                box[0].scrollIntoView(false);
                gptCounter++;

                // console.log(egg);

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
            error: function (xhr, status, error) {
                console.error('Error:', error);
            }
        });
    });
});