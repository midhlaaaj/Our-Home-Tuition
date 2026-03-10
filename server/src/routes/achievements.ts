import express from 'express';
import Achievement from '../models/Achievement.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/achievements
// @desc    Get all active achievements
// @access  Public
router.get('/', async (req, res) => {
    try {
        const achievements = await Achievement.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
        res.json(achievements);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/achievements/all
// @desc    Get all achievements (Admin)
// @access  Private
router.get('/all', auth, async (req, res) => {
    try {
        const achievements = await Achievement.find().sort({ order: 1, createdAt: 1 });
        res.json(achievements);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/achievements
// @desc    Add new achievement
// @access  Private
router.post('/', auth, async (req, res) => {
    const { title, description, number, icon, order, isActive } = req.body;

    try {
        const newAchievement = new Achievement({
            title,
            description,
            number,
            icon,
            order: order !== undefined ? order : 0,
            isActive: isActive !== undefined ? isActive : true
        });

        const achievement = await newAchievement.save();
        res.json(achievement);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/achievements/:id
// @desc    Update achievement
// @access  Private
router.put('/:id', auth, async (req, res): Promise<void> => {
    const { title, description, number, icon, order, isActive } = req.body;

    const fields: any = {};
    if (title) fields.title = title;
    if (description) fields.description = description;
    if (number) fields.number = number;
    if (icon !== undefined) fields.icon = icon;
    if (order !== undefined) fields.order = order;
    if (isActive !== undefined) fields.isActive = isActive;

    try {
        let achievement = await Achievement.findById(req.params.id);

        if (!achievement) {
            res.status(404).json({ message: 'Achievement not found' });
            return;
        }

        achievement = await Achievement.findByIdAndUpdate(
            req.params.id,
            { $set: fields },
            { new: true }
        );

        res.json(achievement);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/achievements/:id
// @desc    Delete achievement
// @access  Private
router.delete('/:id', auth, async (req, res): Promise<void> => {
    try {
        let achievement = await Achievement.findById(req.params.id);

        if (!achievement) {
            res.status(404).json({ message: 'Achievement not found' });
            return;
        }

        await Achievement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Achievement removed' });
    } catch (err) {
        console.error(err);
        if ((err as any).kind === 'ObjectId') {
            res.status(404).json({ message: 'Achievement not found' });
            return;
        }
        res.status(500).send('Server Error');
    }
});

export default router;
