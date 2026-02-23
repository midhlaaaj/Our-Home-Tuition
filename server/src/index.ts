import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import sliderRoutes from './routes/sliders.js';
import reviewRoutes from './routes/reviews.js';
import brandRoutes from './routes/brands.js';
import mentorRoutes from './routes/mentors.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sliders', sliderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/mentors', mentorRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Our Home Tuition API is running');
});

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/our_home_tuition';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
