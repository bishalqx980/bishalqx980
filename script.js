function load() {
    var clock = document.getElementById("clock");

    var date = new Date;
    var hour = date.getHours();
    var minute = date.getMinutes();
    var format = "AM";
    if (hour > 12) {
        var hour = hour - 12;
        var format = "PM";
    }

    if (hour < 10) {
        var hour = "0" + hour;
    }

    if (minute < 10) {
        var minute = "0" + minute;
    }
    
    clock.innerHTML = hour + ":" + minute + " " + format;

    var width = screen.availWidth
    var height = screen.availHeight
    if (width < 700 || height < 700) {
        location.href = "./old/"
    }
}