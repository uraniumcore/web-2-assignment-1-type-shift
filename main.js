const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '/')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/', 'index.html'));
});

app.post("/send", (req, res) => {
    const { weight, height } = req.body;

    const w = Number(weight);
    const h = Number(height);

    if (!w || !h) {
        return res.json({ error: "Invalid weight or height" });
    }

    const heightInMeters = h / 100;
    const bmi = w / (heightInMeters * heightInMeters);

    res.json({
        success: true,
        weight: w,
        height: h,
        bmi: Number(bmi.toFixed(2))
    });
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});