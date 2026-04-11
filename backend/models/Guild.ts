import mongoose, { Schema, Document } from 'mongoose';
import { UserSchema, IUser } from './User';
import { ChannelSchema, IChannel } from './Channel';

export interface IGuild extends Document {
    name: string;
    description: string;
    owner_id: string;
    created_at: Date;
    members: IUser[];
    channels: IChannel[];
}

const GuildSchema = new Schema<IGuild>({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    owner_id: {
        type: String,
        required: true
    },
    members: [UserSchema],
    channels: [ChannelSchema],
    created_at: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model<IGuild>('Guild', GuildSchema);