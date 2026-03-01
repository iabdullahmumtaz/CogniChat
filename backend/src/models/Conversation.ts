import mongoose, { Document, Schema, Types } from 'mongoose';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface IMessage {
  role: MessageRole;
  content: string;
  createdAt?: Date;
}

export interface IConversation extends Document {
  _id: Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const conversationSchema = new Schema<IConversation>({
  title: { type: String, default: 'New Chat' },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

conversationSchema.pre('save', function () {
  this.updatedAt = new Date();
});

export default mongoose.model<IConversation>('Conversation', conversationSchema);
