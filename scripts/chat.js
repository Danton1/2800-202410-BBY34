let input = "";

$(function () {
    $('#chatButton').on("click", function () {
        // Getting time
        let date = new Date;
        let time = date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
        
        // Get the input value
        const userInput = $('#chatbotTextBox').val();

        // Display user input
        $('#chatHistoryWrap').append(`
            <div class="max-w-full chat chat-end">
            <div class="flex items-end gap-2">
                <time class="text-xs opacity-50">${time}</time>
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
        </div>`);

        // Reset input textbox
        $('#chatbotTextBox').val("");
        
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
                let outputString = response.output.split('\n');
                outputString.splice(0, 1);
                let formattedOutput = outputString.join("\n");
                formattedOutput = formattedOutput.replaceAll("\n", "<br>");

                // Display chatbot's response
                $('#chatHistoryWrap').append(`
                <div class="chat chat-start items-end justify-items-end">
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
                        ${formattedOutput}
                        </div>
                        <time class="text-xs opacity-50">${time}</time>
                    </div>
                </div>`);
            },
            error: function (xhr, status, error) {
                console.error('Error:', error);
            }
        });
    });
});