import mongoose, { Schema, Document } from 'mongoose';

export interface IChannel extends Document {
    name: string;
    topic: string;
    created_by: string;
    created_at: Date;
}

export const ChannelSchema = new Schema<IChannel>({
    name: { type: String, required: true },
    topic: { type: String, default: "" },
    created_by: { type: String, required: true }
}, {
    timestamps: { createdAt: 'created_at' }
});

export default mongoose.model<IChannel>('Channel', ChannelSchema);