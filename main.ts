// imports
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as dotenv from 'dotenv';
import mongoose, { Schema, Document } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import session from 'express-session';
dotenv.config();

// app init
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// env vars
const PORT = process.env.PORT ?? "3000";
const API_KEY = process.env.API_KEY;
const mongoDBURI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET ?? "arsen";

// middlewares
const requestLogger = function (req: Request, res: Response, next: NextFunction) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.url}`);

    next();
};

const authMiddleware = function (req: any, res: Response, next: NextFunction) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'No valid session' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
            return;
        } catch (err: any) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }

    req.user = {
        id: req.session.userId,
        username: req.session.username,
        email: req.session.email
    };
    next();
};

app.use(requestLogger);
app.use(express.static(path.join(__dirname, 'static')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// express-session
app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
}));

// Connect to MongoDB
if (!mongoDBURI) {
    console.error('Missing required env: MONGODB_URI');
    process.exit(1);
}

mongoose.connect(mongoDBURI)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
    })
    .catch((err: any) => {
        console.error('Error connecting to MongoDB:', err.message);
    });

// models
// blog model
interface IBlog {
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

// user model
interface IUser {
    name: string;
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
    name: { type: String, required: true },
    username: {
        type: String,
        required: true,
        unique: true, // username is unique
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false,
        minlength: 6
    },
}, {
    timestamps: true
});

userSchema.pre('save', async function (this: IUser & Document) {
    try {
        if (!this.isModified('password')) return;

        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error: any) {
        // Если выбросить ошибку, Mongoose отменит сохранение
        throw error; 
    }
});

const UserModel = mongoose.model<IUser>('User', userSchema);

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

app.post("/api/blogs", authMiddleware, async (req, res) => {
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

app.put("/api/blogs/:id", authMiddleware, async (req, res) => {
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

app.delete("/api/blogs/:id", authMiddleware, async (req, res) => {
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
        res.status(500).json({ error: err.message });
    }
});

// Assignment 5 APIs

app.post("/api/auth/register", async (req, res) => {
    try {
        let { name, username, email, password } = req.body;

        const newUser = new UserModel({
            name,
            username,
            email,
            password
        });

        const savedUser = await newUser.save();

        console.log('User saved:', savedUser);
        res.status(201).json({ msg: 'Success!' });
    } catch (err: any) {
        res.status(400).json({ error: 'Bad request!' });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = await UserModel.findOne({ username }).select('+password');

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create session
        const session: any = req.session;
        session.userId = user._id;
        session.username = user.username;
        session.email = user.email;

        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token, msg: 'Login successful!' });
    } catch (err: any) {
        console.error(err.message);
        res.status(400).json({ error: 'Bad request!' });
    }
});

app.post("/api/auth/logout", async (req, res) => {
    try {
        req.session.destroy((err: any) => {
            if (err) {
                return res.status(400).json({ error: 'Failed to logout' });
            }
            res.clearCookie('connect.sid'); // Clear session cookie
            res.status(200).json({ msg: 'Logout successful!' });
        });
    } catch (err: any) {
        res.status(400).json({ error: 'Bad request!' });
    }
});

app.get("/api/auth/profile", authMiddleware, async (req: any, res: Response) => {
    try {
        const user = await UserModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
        });
    } catch (err: any) {
        res.status(400).json({ error: 'Bad request!' });
    }
});

// RUN
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});