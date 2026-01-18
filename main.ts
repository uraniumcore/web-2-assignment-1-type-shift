// imports
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as dotenv from 'dotenv';
import mongoose, { Schema, Document } from 'mongoose';
import jwt from 'jsonwebtoken';
dotenv.config();

// app init
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// env vars
const PORT = process.env.PORT ?? "3000";
const API_KEY = process.env.API_KEY;
const mongoDBURI = process.env.MONGODB_URI;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'static')));

// models
interface IBlog extends Document {
    title: string;
    body: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
}

const blogSchema = new Schema<IBlog>({
    title: { type: String, required: true },
    body: { type: String, required: true },
    author: { type: String, default: 'Anonymous' },
}, {
    timestamps: true // Автоматически создаст и будет обновлять createdAt и updatedAt
});

const BlogModel = mongoose.model<IBlog>('Blog', blogSchema);

// middlewares
const requestLogger = function (req: Request, res: Response, next: NextFunction) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.url}`);

    next();
};

app.use(requestLogger);

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

        if (!API_KEY) {
            console.error('Missing required env: API_KEY');
            process.exit(1);
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

app.post("/api/login", async (req, res) => {
    try {

    } catch (err) {
        console.error(err);
    }
});

app.post("/api/blogs", async (req, res) => {
    try {
        let { title, body, author } = req.body;

        if (title?.trim() == '' || body?.trim() == '') {
            return res.status(400).json({ error: "Title and Body cannot be empty" });
        }

        if (!author || author.trim() == '') {
            author = "Anonymous";
        }

        const newBlog = new BlogModel({
            title,
            body,
            author
        });

        const savedBlog = await newBlog.save();

        console.log('Blog saved:', savedBlog);
        res.redirect("/blog.html");
    } catch (err: any) {
        console.log(err.message);
        res.status(400).json({ error: err.message });
    }
});

app.get("/api/blogs", async (req, res) => {
    try {
        const blogs = await BlogModel.find().sort({ updatedAt: -1 });
        res.status(200).json(blogs);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/blogs/:id", async (req, res) => {
    try {
        const blog = await BlogModel.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }
        res.status(200).json(blog);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/blogs/:id", async (req, res) => {
    try {
        let { title, body, author } = req.body;

        if (title?.trim() == '' || body?.trim() == '') {
            return res.status(400).json({ error: "Title and Body cannot be empty" });
        }

        if (!author || author.trim() == '') {
            author = "Anonymous";
        }

        const updatedBlog = await BlogModel.findByIdAndUpdate(
            req.params.id,
            { title, body, author },
            { new: true, runValidators: true }
        );

        if (!updatedBlog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        res.json(updatedBlog);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/blogs/:id", async (req, res) => {
    try {
        const deletedBlog = await BlogModel.findByIdAndDelete(req.params.id);
        if (!deletedBlog) {
            return res.status(404).json("Not found");
        }
        res.json("Blod deleted!");
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/blog/:id", async (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'static', 'blog-x.html'));
    } catch (err: any) {
        res.status(500).json({ error: err.messge });
    }
});

const startServer = async () => {
    // На Vercel NODE_ENV всегда 'production'
    if (process.env.NODE_ENV === 'production') {
        // Для Serverless функций подключение лучше делать один раз при инициализации
        // Но не блокировать процесс сборки вызовом startServer() в глобальном пространстве
        mongoose.connect(process.env.MONGODB_URI!)
            .then(() => console.log("Connected to MongoDB Atlas"))
            .catch(err => console.error(err));
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log("Connected to MongoDB Atlas");
        app.listen(3000, () => console.log("Server started locally on http://localhost:3000"));
    } catch (err) {
        console.error(err);
    }
};

// Вызываем только если мы не в режиме сборки Vercel
if (process.env.NODE_ENV !== 'test') {
    console.log("lol");
    startServer();
}

// ОБЯЗАТЕЛЬНО для Vercel
export default app;