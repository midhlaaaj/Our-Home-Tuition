import express from 'express';
import Review from '../models/Review.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/reviews
// @desc    Get all active reviews
// @access  Public
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find({ isActive: true }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/reviews/all
// @desc    Get all reviews (Admin)
// @access  Private
router.get('/all', auth, async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/reviews
// @desc    Add new review
// @access  Private
router.post('/', auth, async (req, res) => {
    const { name, role, rating, message, avatarUrl } = req.body;

    try {
        const newReview = new Review({
            name,
            role,
            rating,
            message,
            avatarUrl
        });

        const review = await newReview.save();
        res.json(review);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/reviews/:id
// @desc    Update review
// @access  Private
router.put('/:id', auth, async (req, res): Promise<void> => {
    const { name, role, rating, message, avatarUrl, isActive } = req.body;

    const reviewFields: any = {};
    if (name) reviewFields.name = name;
    if (role) reviewFields.role = role;
    if (rating) reviewFields.rating = rating;
    if (message) reviewFields.message = message;
    if (avatarUrl) reviewFields.avatarUrl = avatarUrl;
    if (isActive !== undefined) reviewFields.isActive = isActive;

    try {
        let review = await Review.findById(req.params.id);

        if (!review) {
            res.status(404).json({ message: 'Review not found' });
            return;
        }

        review = await Review.findByIdAndUpdate(
            req.params.id,
            { $set: reviewFields },
            { new: true }
        );

        res.json(review);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/reviews/:id
// @desc    Delete review
// @access  Private
router.delete('/:id', auth, async (req, res): Promise<void> => {
    try {
        let review = await Review.findById(req.params.id);

        if (!review) {
            res.status(404).json({ message: 'Review not found' });
            return;
        }

        await Review.findByIdAndDelete(req.params.id);
        res.json({ message: 'Review removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

export default router;
