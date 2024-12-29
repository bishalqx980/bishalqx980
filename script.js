function load() {
    var getdate = new Date();
    var year = getdate.getFullYear();
    document.getElementById("year").innerHTML = "2023 -" + year;
}
function send() {
    var name = document.getElementById("name").value;
    var message = document.getElementById("message").value;
    var output = document.getElementById("output");

    if (name == "") {
        output.innerHTML = "Please fill your NAME!"
    }else if (message == "") {
        output.innerHTML = "Please type a Message!"
    }else {
        send_confirm();
    }
}
function send_confirm() {
    var bot_api = "";
    var chat_id = "2134776547";
    var parse_mode = "HTML";
    var name = document.getElementById("name").value;
    var message = document.getElementById("message").value;
    var url = `https://api.telegram.org/bot${bot_api}/sendMessage?chat_id=${chat_id}&parse_mode=${parse_mode}&text=<b>Name: ${name}; Message: ${message};</b>`;
    var output = document.getElementById("output");

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function() {
        if (xhr.status == 200) {
            output.innerHTML = "<b>Message Sent Successfully!</b>";
        }else {
            output.innerHTML = "<b>Message NOT Sent!</b>" + xhr.response;
        }
    }
    xhr.send();
}