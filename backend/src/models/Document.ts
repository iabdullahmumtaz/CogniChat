import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChunk {
  text: string;
  embedding: number[];
  index: number;
}

export interface IDocument extends Document {
  _id: Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType?: string;
  chunks: IChunk[];
  createdAt: Date;
}

const chunkSchema = new Schema<IChunk>({
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  index: { type: Number, required: true },
});

const documentSchema = new Schema<IDocument>({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: String,
  chunks: [chunkSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IDocument>('Document', documentSchema);
