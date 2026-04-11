import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    guild_id:string;
    channel_id: string;
    sender_id: string;
    sender_name: string;
    content: string;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const MessageSchema = new Schema<IMessage>({
    guild_id:{type:String,required:true,index:true},
    channel_id: { type: String, required: true, index: true },
    sender_id: { type: String, required: true },
    sender_name: { type: String, required: true },
    content: { type: String, required: true, trim: true },
    is_deleted: { type: Boolean, default: false },
}, {
    // This tells Mongoose to manage created_at and updated_at for you automatically
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Message = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;