import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
    name: string;
    role: 'Parent' | 'Student';
    rating: number;
    message: string;
    avatarUrl?: string;
    isActive: boolean;
}

const ReviewSchema: Schema = new Schema({
    name: { type: String, required: true },
    role: { type: String, enum: ['Parent', 'Student'], required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true },
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
