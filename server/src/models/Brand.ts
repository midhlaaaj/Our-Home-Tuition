import mongoose, { Document, Schema } from 'mongoose';

export interface IBrand extends Document {
    name: string;
    logoUrl: string;
    isActive: boolean;
}

const BrandSchema: Schema = new Schema({
    name: { type: String, required: true },
    logoUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IBrand>('Brand', BrandSchema);
