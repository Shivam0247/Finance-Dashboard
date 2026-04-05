import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  user_id: mongoose.Types.ObjectId;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

const TransactionSchema: Schema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  date: { type: Date, required: true },
  notes: { type: String },
  deleted_at: { type: Date, default: null },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexing for faster queries
TransactionSchema.index({ user_id: 1, date: -1 });
TransactionSchema.index({ type: 1, category: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
