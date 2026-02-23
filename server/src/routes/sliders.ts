import express from 'express';
import Slider from '../models/Slider.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/sliders
// @desc    Get all active sliders
// @access  Public
router.get('/', async (req, res) => {
    try {
        const sliders = await Slider.find({ isActive: true }).sort({ order: 1 });
        res.json(sliders);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/sliders/all
// @desc    Get all sliders (Admin)
// @access  Private
router.get('/all', auth, async (req, res) => {
    try {
        const sliders = await Slider.find().sort({ order: 1 });
        res.json(sliders);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/sliders
// @desc    Add new slider
// @access  Private
router.post('/', auth, async (req, res) => {
    const { title, subtitle, type, mediaUrl, order } = req.body;

    try {
        const newSlider = new Slider({
            title,
            subtitle,
            type,
            mediaUrl,
            order
        });

        const slider = await newSlider.save();
        res.json(slider);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/sliders/:id
// @desc    Update slider
// @access  Private
router.put('/:id', auth, async (req, res): Promise<void> => {
    const { title, subtitle, type, mediaUrl, order, isActive } = req.body;

    const sliderFields: any = {};
    if (title) sliderFields.title = title;
    if (subtitle) sliderFields.subtitle = subtitle;
    if (type) sliderFields.type = type;
    if (mediaUrl) sliderFields.mediaUrl = mediaUrl;
    if (order !== undefined) sliderFields.order = order;
    if (isActive !== undefined) sliderFields.isActive = isActive;

    try {
        let slider = await Slider.findById(req.params.id);

        if (!slider) {
            res.status(404).json({ message: 'Slider not found' });
            return;
        }

        slider = await Slider.findByIdAndUpdate(
            req.params.id,
            { $set: sliderFields },
            { new: true }
        );

        res.json(slider);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/sliders/:id
// @desc    Delete slider
// @access  Private
router.delete('/:id', auth, async (req, res): Promise<void> => {
    try {
        let slider = await Slider.findById(req.params.id);

        if (!slider) {
            res.status(404).json({ message: 'Slider not found' });
            return;
        }

        await Slider.findByIdAndDelete(req.params.id);
        res.json({ message: 'Slider removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

export default router;
