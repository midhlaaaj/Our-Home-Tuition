import express from 'express';
import Brand from '../models/Brand.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET api/brands
// @desc    Get all active brands
// @access  Public
router.get('/', async (req, res) => {
    try {
        const brands = await Brand.find({ isActive: true });
        res.json(brands);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/brands/all
// @desc    Get all brands (Admin)
// @access  Private
router.get('/all', auth, async (req, res) => {
    try {
        const brands = await Brand.find();
        res.json(brands);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/brands
// @desc    Add new brand
// @access  Private
router.post('/', auth, async (req, res) => {
    const { name, logoUrl } = req.body;

    try {
        const newBrand = new Brand({
            name,
            logoUrl
        });

        const brand = await newBrand.save();
        res.json(brand);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/brands/:id
// @desc    Update brand
// @access  Private
router.put('/:id', auth, async (req, res): Promise<void> => {
    const { name, logoUrl, isActive } = req.body;

    const brandFields: any = {};
    if (name) brandFields.name = name;
    if (logoUrl) brandFields.logoUrl = logoUrl;
    if (isActive !== undefined) brandFields.isActive = isActive;

    try {
        let brand = await Brand.findById(req.params.id);

        if (!brand) {
            res.status(404).json({ message: 'Brand not found' });
            return;
        }

        brand = await Brand.findByIdAndUpdate(
            req.params.id,
            { $set: brandFields },
            { new: true }
        );

        res.json(brand);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/brands/:id
// @desc    Delete brand
// @access  Private
router.delete('/:id', auth, async (req, res): Promise<void> => {
    try {
        let brand = await Brand.findById(req.params.id);

        if (!brand) {
            res.status(404).json({ message: 'Brand not found' });
            return;
        }

        await Brand.findByIdAndDelete(req.params.id);
        res.json({ message: 'Brand removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

export default router;
