$("document").ready(function() {
    const API_BASE = '/api/auth';

    // Load components
    $("#navbar").load("./comps/navbar.html", function() {

    });
    $("head").append(`<link rel="icon" href="./imgs/favicon_2.ico" type="image/x-icon">`);
    $("head").append(`    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
    </style>`);

    function toggleProfile() {
        const loginBtn = document.getElementById("nav-bar-link-login");
        const profileBtn = document.getElementById("nav-bar-link-profile");

        loginBtn.style.display = "none";
        profileBtn.style.display = "block";
    }

    async function checkAuth() {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const res = await fetch(`${API_BASE}/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    // console.log("logedin");
                    toggleProfile();
                } else {
                    localStorage.removeItem('token');
                }
            } catch (err) {
                console.error(err);
                localStorage.removeItem('token');
            }
        }
    }
    checkAuth();
});