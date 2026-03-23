import mongoose from 'mongoose'

const adminUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export const AdminUser = mongoose.model('AdminUser', adminUserSchema)
