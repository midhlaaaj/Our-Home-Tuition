import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
    email: string;
    password?: string;
    role: string;
}

const AdminSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' }
}, { timestamps: true });

export default mongoose.model<IAdmin>('Admin', AdminSchema);
