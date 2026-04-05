import mongoose, { Schema, Document } from 'mongoose';
import { Role } from '../utils/types';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'viewer' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model<IUser>('User', UserSchema);
