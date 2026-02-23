import mongoose, { Document, Schema } from 'mongoose';

export interface ISlider extends Document {
    title: string;
    subtitle?: string;
    type: 'image' | 'video' | 'text';
    mediaUrl?: string;
    isActive: boolean;
    order: number;
}

const SliderSchema: Schema = new Schema({
    title: { type: String, required: true },
    subtitle: { type: String },
    type: { type: String, enum: ['image', 'video', 'text'], required: true },
    mediaUrl: { type: String },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<ISlider>('Slider', SliderSchema);
