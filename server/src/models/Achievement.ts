import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
    title: string;
    description: string;
    number: string;
    icon?: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AchievementSchema: Schema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    number: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
    },
    order: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

export default mongoose.model<IAchievement>('Achievement', AchievementSchema);
