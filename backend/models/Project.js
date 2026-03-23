import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['SPC', 'LAMINATE'],
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: Number,
      required: true,
      min: 1,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280,
    },
    installedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export const Project = mongoose.model('Project', projectSchema)
