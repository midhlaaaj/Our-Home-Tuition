import mongoose, { Schema, Document } from 'mongoose';

export interface IMentor extends Document {
    name: string;
    subject: string;
    description: string;
    imageUrl: string;
    isActive: boolean;
    createdAt: Date;
}

const MentorSchema: Schema = new Schema({
    name: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IMentor>('Mentor', MentorSchema);
