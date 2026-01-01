const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const API_KEY = '8916f1b7ba4b5aeea610cb31225e72cc';

app.use(express.json());

app.use(express.static(path.join(__dirname, 'static')));

app.post("/api/calc", (req, res) => {
    const { weight, height } = req.query;

    const w = Number(weight);
    const h = Number(height);

    if (!w || !h) {
        return res.json({ error: "Invalid weight or height" });
    }

    const heightInMeters = h / 100;
    const bmi = w / (heightInMeters * heightInMeters);

    let cat;
    if (bmi < 18.5) {
        cat = "Underweight";
    } else if (bmi < 25) {
        cat = "Normal weight";
    } else if (bmi < 30) {
        cat = "Overweight";
    } else {
        cat = "Obese";
    }

    res.json({
        success: true,
        weight: w,
        height: h,
        bmi: Number(bmi.toFixed(2)),
        category: cat
    });
});

app.get("/api/weather", async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ error: "lat and lon required" });
        }

        const url = `https://api.openweathermap.org/data/2.5/weather` +
            `?lat=${lat}&lon=${lon}` +
            `&units=metric` +
            `&lang=ru` +
            `&appid=${API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Weather API error" });
    }
});

app.get("/api/news", async (req, res) => {
    try {
        const file = path.join(__dirname, 'static/sample_data', 'news-georgia.json');
        const raw = await fs.promises.readFile(file, 'utf8');
        const data = JSON.parse(raw);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "News API error" });
    }
});

app.get("/api/currency", async (req, res) => {
    try {
        const file = path.join(__dirname, 'static/sample_data', 'currency-sample.json');
        const raw = await fs.promises.readFile(file, 'utf8');
        const data = JSON.parse(raw);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Currency API error" });
    }
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});