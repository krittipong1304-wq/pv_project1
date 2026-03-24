import dotenv from 'dotenv'
import mongoose from 'mongoose'

import { hashPassword } from '../auth.js'
import { User } from '../models/User.js'

dotenv.config()

const mongoUri = process.env.MONGODB_URI
const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD || 'admin1234'
const email = (process.env.ADMIN_EMAIL || 'admin@floorcraft.local').trim().toLowerCase()
const phone = String(process.env.ADMIN_PHONE || '0000000000').trim()

async function resetAdminPassword() {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing in .env')
  }

  await mongoose.connect(mongoUri)

  const passwordHash = await hashPassword(password)

  const adminUser = await User.findOneAndUpdate(
    { username },
    { username, email, phone, passwordHash, role: 'admin' },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )

  console.log(`Admin username: ${adminUser.username}`)
  console.log(`Admin role: ${adminUser.role}`)
  console.log('Admin password reset to value from .env')

  await mongoose.disconnect()
}

resetAdminPassword().catch((error) => {
  console.error('Failed to reset admin password:', error.message)
  process.exit(1)
})
