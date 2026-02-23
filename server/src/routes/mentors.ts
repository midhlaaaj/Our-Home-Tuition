import express from 'express';
import Mentor from '../models/Mentor.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/mentors
// @desc    Get all active mentors (Public)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const mentors = await Mentor.find({ isActive: true });
        res.json(mentors);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/mentors/all
// @desc    Get all mentors (Admin)
// @access  Private
router.get('/all', auth, async (req, res) => {
    try {
        const mentors = await Mentor.find().sort({ createdAt: -1 });
        res.json(mentors);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/mentors
// @desc    Add new mentor
// @access  Private
router.post('/', auth, async (req, res) => {
    const { name, subject, description, imageUrl } = req.body;

    try {
        const newMentor = new Mentor({
            name,
            subject,
            description,
            imageUrl
        });

        const mentor = await newMentor.save();
        res.json(mentor);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/mentors/:id
// @desc    Update mentor
// @access  Private
router.put('/:id', auth, async (req, res): Promise<void> => {
    const { name, subject, description, imageUrl, isActive } = req.body;

    const mentorFields: any = {};
    if (name) mentorFields.name = name;
    if (subject) mentorFields.subject = subject;
    if (description) mentorFields.description = description;
    if (imageUrl) mentorFields.imageUrl = imageUrl;
    if (isActive !== undefined) mentorFields.isActive = isActive;

    try {
        let mentor = await Mentor.findById(req.params.id);

        if (!mentor) {
            res.status(404).json({ message: 'Mentor not found' });
            return;
        }

        mentor = await Mentor.findByIdAndUpdate(
            req.params.id,
            { $set: mentorFields },
            { new: true }
        );

        res.json(mentor);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/mentors/:id
// @desc    Delete mentor
// @access  Private
router.delete('/:id', auth, async (req, res): Promise<void> => {
    try {
        let mentor = await Mentor.findById(req.params.id);

        if (!mentor) {
            res.status(404).json({ message: 'Mentor not found' });
            return;
        }

        await Mentor.findByIdAndDelete(req.params.id);
        res.json({ message: 'Mentor removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

export default router;
