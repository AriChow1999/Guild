import mongoose, { Schema, Document } from 'mongoose';

// 1. Define the Interface
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    bio?: string;
    created_at: Date;
    is_banned?: boolean; 
    timeout_until?: boolean;
}

// 2. Define the Schema
export const UserSchema: Schema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: ""
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    is_banned: {
        type: Boolean,
        default: false
    },
    timeout_until: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model<IUser>('User', UserSchema);