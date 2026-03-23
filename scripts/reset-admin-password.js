import dotenv from 'dotenv'
import mongoose from 'mongoose'

import { hashPassword } from '../backend/auth.js'
import { AdminUser } from '../backend/models/AdminUser.js'

dotenv.config()

const mongoUri = process.env.MONGODB_URI
const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD || 'admin1234'

async function resetAdminPassword() {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing in .env')
  }

  await mongoose.connect(mongoUri)

  const passwordHash = await hashPassword(password)

  const adminUser = await AdminUser.findOneAndUpdate(
    { username },
    { username, passwordHash },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )

  console.log(`Admin username: ${adminUser.username}`)
  console.log(`Admin password reset to value from .env`)

  await mongoose.disconnect()
}

resetAdminPassword().catch((error) => {
  console.error('Failed to reset admin password:', error.message)
  process.exit(1)
})
