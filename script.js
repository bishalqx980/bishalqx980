function load() {
    let getdate = new Date();
    let year = getdate.getFullYear();
    document.getElementById("year").innerHTML = "2023 - " + year;

    let stylesheet = document.getElementById("stylesheet");
    let theme_changer_btn = document.getElementById("theme_changer_btn");
    let localstorage_stylesheet = localStorage.getItem("stylesheet");

    if (localstorage_stylesheet) {
        stylesheet.setAttribute("href", localstorage_stylesheet);
        if (localstorage_stylesheet == "dark_style.css") {
            theme_changer_btn.innerHTML = "Light Theme";
        } else {
            theme_changer_btn.innerHTML = "Dark Theme";
        }
    }
}

function change_theme() {
    let stylesheet = document.getElementById("stylesheet");
    let theme_changer_btn = document.getElementById("theme_changer_btn");

    if (stylesheet.getAttribute("href") == "dark_style.css") {
        stylesheet.setAttribute("href", "light_style.css");
        localStorage.setItem("stylesheet", "light_style.css");
        theme_changer_btn.innerHTML = "Dark Theme";
    } else {
        stylesheet.setAttribute("href", "dark_style.css");
        localStorage.setItem("stylesheet", "dark_style.css");
        theme_changer_btn.innerHTML = "Light Theme";
    }
}
