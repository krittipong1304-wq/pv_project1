import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { existsSync } from 'fs'
import mongoose from 'mongoose'
import { resolve } from 'path'

import { createAuthToken, hashPassword, verifyAuthToken, verifyPassword } from './auth.js'
import { sampleProjects } from './data/sampleProjects.js'
import { Project } from './models/Project.js'
import { Role } from './models/Role.js'
import { Review } from './models/Review.js'
import { User } from './models/User.js'

const envPaths = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'backend/.env'),
]

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
}

const app = express()
const port = process.env.PORT || 5000
const mongoUri = process.env.MONGODB_URI
const defaultAdminUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase()
const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin1234'
const defaultAdminEmail = (process.env.ADMIN_EMAIL || 'admin@floorcraft.local').trim().toLowerCase()
const defaultAdminPhone = String(process.env.ADMIN_PHONE || '0000000000').trim()
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

app.use(cors())
app.use(express.json())

function getRoleName(role) {
  if (!role) {
    return ''
  }

  if (typeof role === 'string') {
    return role
  }

  return role.name || ''
}

function serializeUser(user) {
  return {
    id: user._id,
    email: user.email,
    phone: user.phone,
    username: user.username,
    role: getRoleName(user.role),
  }
}

async function findRoleByName(name) {
  return Role.findOne({ name: String(name || '').trim().toLowerCase() })
}

function extractBearerToken(request) {
  const authHeader = request.headers.authorization || ''

  if (!authHeader.startsWith('Bearer ')) {
    return ''
  }

  return authHeader.slice('Bearer '.length).trim()
}

function getUnauthorizedMessage(role) {
  if (role === 'user') {
    return { message: 'User authorization required' }
  }

  if (role === 'any') {
    return { message: 'Authorization required' }
  }

  return { message: 'Admin authorization required' }
}

function createAuthMiddleware(roleOrRoles) {
  const allowedRoles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]
  const messageRole = allowedRoles.length === 1 ? allowedRoles[0] : 'any'

  return async function authMiddleware(request, response, next) {
    try {
      const token = extractBearerToken(request)
      const payload = verifyAuthToken(token)

      if (!payload || !allowedRoles.includes(payload.role)) {
        response.status(401).json(getUnauthorizedMessage(messageRole))
        return
      }

      const account = await User.findById(payload.sub).populate('role')
      const accountRole = getRoleName(account?.role)

      if (!account || account.username !== payload.username || !allowedRoles.includes(accountRole)) {
        response.status(401).json(getUnauthorizedMessage(messageRole))
        return
      }

      if (accountRole === 'admin') {
        request.adminUser = account
      }

      request.user = account

      next()
    } catch {
      response.status(401).json(getUnauthorizedMessage(messageRole))
    }
  }
}

const requireAdminAuth = createAuthMiddleware('admin')
const requireUserAuth = createAuthMiddleware(['user', 'admin'])
const requireAnyAuth = createAuthMiddleware(['user', 'admin'])

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Backend is running' })
})

app.get('/api/auth/me', requireAnyAuth, (req, res) => {
  res.json({
    user: serializeUser(req.user),
  })
})

app.get('/api/admin/me', requireAdminAuth, (req, res) => {
  res.json({
    user: serializeUser(req.adminUser),
  })
})

app.post('/api/admin/change-password', requireAdminAuth, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '')
    const newPassword = String(req.body?.newPassword || '')
    const confirmPassword = String(req.body?.confirmPassword || '')

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password confirmation does not match' })
    }

    const passwordMatches = await verifyPassword(currentPassword, req.adminUser.passwordHash)

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    req.adminUser.passwordHash = await hashPassword(newPassword)
    await req.adminUser.save()

    return res.json({ message: 'Password updated successfully' })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to change password',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.post('/api/users/register', async (req, res) => {
  try {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase()
    const phone = String(req.body?.phone || '').trim()
    const username = String(req.body?.username || '').trim()
    const password = String(req.body?.password || '')

    if (!email || !phone || !username || !password) {
      return res.status(400).json({ message: 'Email, phone, username, and password are required' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }, { username }],
    })

    if (existingUser) {
      return res.status(409).json({ message: 'Email, phone, or username already exists' })
    }

    const user = await User.create({
      email,
      phone,
      username,
      passwordHash: await hashPassword(password),
      role: (await findRoleByName('user'))._id,
    })

    return res.status(201).json({
      token: createAuthToken(user, 'user'),
      user: serializeUser({ ...user.toObject(), role: { name: 'user' } }),
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to register user',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.post('/api/users/login', async (req, res) => {
  try {
    const login = String(req.body?.login || '')
      .trim()
      .toLowerCase()
    const password = String(req.body?.password || '')

    if (!login || !password) {
      return res.status(400).json({ message: 'Username or email and password are required' })
    }

    const user = await User.findOne({
      $or: [{ email: login }, { username: login }],
    }).populate('role')

    if (!user) {
      return res.status(401).json({ message: 'Invalid username/email or password' })
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash)

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid username/email or password' })
    }

    const roleName = getRoleName(user.role)

    return res.json({
      token: createAuthToken(user, roleName),
      user: serializeUser(user),
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to log in user',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/api/users/me', requireUserAuth, (req, res) => {
  res.json({
    user: serializeUser(req.user),
  })
})

app.get('/api/admin/users', requireAdminAuth, async (_req, res) => {
  try {
    const users = await User.find()
      .populate('role')
      .sort({ createdAt: -1, username: 1 })

    return res.json(
      users.map((user) => ({
        ...serializeUser(user),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    )
  } catch {
    return res.status(500).json({ message: 'Failed to load users' })
  }
})

app.patch('/api/admin/users/:id/role', requireAdminAuth, async (req, res) => {
  try {
    const roleName = String(req.body?.role || '')
      .trim()
      .toLowerCase()

    if (!['admin', 'user'].includes(roleName)) {
      return res.status(400).json({ message: 'Role must be admin or user' })
    }

    const [targetUser, role] = await Promise.all([
      User.findById(req.params.id).populate('role'),
      findRoleByName(roleName),
    ])

    if (!targetUser || !role) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (String(targetUser._id) === String(req.adminUser._id) && roleName !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' })
    }

    targetUser.role = role._id
    await targetUser.save()
    await targetUser.populate('role')

    return res.json({
      ...serializeUser(targetUser),
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt,
    })
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to update user role',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/api/projects', async (_req, res) => {
  try {
    const projects = await Project.find().sort({ installedAt: -1, createdAt: -1 })
    res.json(projects)
  } catch {
    res.status(500).json({ message: 'Failed to load projects' })
  }
})

async function ensureFeaturedProjectLimit(isFeatured, excludeId = '') {
  if (!isFeatured) {
    return
  }

  const filter = excludeId
    ? { featured: true, _id: { $ne: excludeId } }
    : { featured: true }

  const featuredCount = await Project.countDocuments(filter)

  if (featuredCount >= 3) {
    throw new Error('You can only mark up to 3 featured projects')
  }
}

app.post('/api/projects', requireAdminAuth, async (req, res) => {
  try {
    await ensureFeaturedProjectLimit(Boolean(req.body?.featured))

    const project = await Project.create({
      ...req.body,
      featured: Boolean(req.body?.featured),
    })
    res.status(201).json(project)
  } catch (error) {
    res.status(400).json({
      message: 'Failed to create project',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.put('/api/projects/:id', requireAdminAuth, async (req, res) => {
  try {
    await ensureFeaturedProjectLimit(Boolean(req.body?.featured), req.params.id)

    const project = await Project.findByIdAndUpdate(req.params.id, {
      ...req.body,
      featured: Boolean(req.body?.featured),
    }, {
      new: true,
      runValidators: true,
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    return res.json(project)
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to update project',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.delete('/api/projects/:id', requireAdminAuth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    return res.json({ ok: true })
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to delete project',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/api/reviews', async (_req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 })
    res.json(reviews)
  } catch {
    res.status(500).json({ message: 'Failed to load reviews' })
  }
})

app.get('/api/admin/reviews', requireAdminAuth, async (_req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 })
    res.json(reviews)
  } catch {
    res.status(500).json({ message: 'Failed to load reviews' })
  }
})

app.post('/api/reviews', requireUserAuth, async (req, res) => {
  try {
    const rating = Number(req.body?.rating)
    const title = String(req.body?.title || '').trim()
    const comment = String(req.body?.comment || '').trim()

    if (!rating || !title || !comment) {
      return res.status(400).json({ message: 'Rating, title, and comment are required' })
    }

    const review = await Review.create({
      userId: req.user._id,
      username: req.user.username,
      rating,
      title,
      comment,
    })

    return res.status(201).json(review)
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to create review',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

async function deleteOwnedReview(req, res) {
  try {
    const review = await Review.findById(req.params.id)

    if (!review) {
      return res.status(404).json({ message: 'Review not found' })
    }

    if (String(review.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own reviews' })
    }

    await review.deleteOne()

    return res.json({ ok: true })
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to delete review',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

app.delete('/api/reviews/:id', requireUserAuth, deleteOwnedReview)
app.post('/api/reviews/:id/delete', requireUserAuth, deleteOwnedReview)

async function seedCollection(Model, sampleData) {
  const total = await Model.countDocuments()

  if (total === 0) {
    await Model.insertMany(sampleData)
  }
}

async function ensureCollections() {
  await Promise.all([
    Project.createCollection().catch(() => null),
    Role.createCollection().catch(() => null),
    User.createCollection().catch(() => null),
    Review.createCollection().catch(() => null),
  ])

  await Promise.all([
    Project.syncIndexes(),
    Role.syncIndexes(),
    User.syncIndexes(),
    Review.syncIndexes(),
  ])
}

async function ensureBaseRoles() {
  const roles = [
    { name: 'admin', label: 'Administrator' },
    { name: 'user', label: 'User' },
  ]

  for (const role of roles) {
    await Role.findOneAndUpdate(
      { name: role.name },
      role,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
  }
}

async function migrateLegacyAdminUsers() {
  const adminRole = await findRoleByName('admin')
  const legacyAdminCollection = mongoose.connection.db.collection('adminusers')
  const hasLegacyAdminCollection = await legacyAdminCollection
    .countDocuments({}, { limit: 1 })
    .then(() => true)
    .catch(() => false)

  if (!hasLegacyAdminCollection) {
    return
  }

  const legacyAdmins = await legacyAdminCollection.find({}).toArray()

  for (const legacyAdmin of legacyAdmins) {
    const existingUser = await User.findOne({ username: legacyAdmin.username }).populate('role')

    if (existingUser) {
      if (getRoleName(existingUser.role) !== 'admin') {
        existingUser.role = adminRole._id
        await existingUser.save()
      }
      continue
    }

    await User.create({
      email: `${legacyAdmin.username}@floorcraft.local`,
      phone: `legacy-${String(legacyAdmin._id).slice(-10)}`,
      username: legacyAdmin.username,
      passwordHash: legacyAdmin.passwordHash,
      role: adminRole._id,
      createdAt: legacyAdmin.createdAt,
      updatedAt: legacyAdmin.updatedAt,
    })
  }
}

async function migrateUsersToRoleCollection() {
  const adminRole = await findRoleByName('admin')
  const userRole = await findRoleByName('user')

  await Promise.all([
    User.collection.updateMany({ role: 'admin' }, { $set: { role: adminRole._id } }),
    User.collection.updateMany({ role: 'user' }, { $set: { role: userRole._id } }),
    User.collection.updateMany(
      { $or: [{ role: { $exists: false } }, { role: null }, { role: '' }] },
      { $set: { role: userRole._id } },
    ),
  ])
}

async function ensureDefaultAdminUser() {
  const adminRole = await findRoleByName('admin')
  const totalAdmins = await User.countDocuments({ role: adminRole._id })

  if (totalAdmins > 0) {
    return
  }

  const passwordHash = await hashPassword(defaultAdminPassword)

  await User.create({
    email: defaultAdminEmail,
    phone: defaultAdminPhone,
    username: defaultAdminUsername,
    passwordHash,
    role: adminRole._id,
  })
}

async function cleanupLegacyCeoData() {
  const ceoRole = await findRoleByName('ceo')
  const adminRole = await findRoleByName('admin')

  await User.collection.updateMany({ role: 'ceo' }, { $set: { role: adminRole._id } })

  if (ceoRole) {
    await User.updateMany({ role: ceoRole._id }, { $set: { role: adminRole._id } })
    await User.deleteMany({ username: 'ceo' })
    await Role.deleteOne({ _id: ceoRole._id })
  }
}

async function startServer() {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing. Add it to your .env file.')
  }

  await mongoose.connect(mongoUri)
  await ensureCollections()
  await ensureBaseRoles()
  await migrateLegacyAdminUsers()
  await migrateUsersToRoleCollection()
  await cleanupLegacyCeoData()
  await ensureDefaultAdminUser()
  await seedCollection(Project, sampleProjects)

  app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`)
    console.log(`MongoDB database: ${mongoose.connection.name}`)
    console.log(`Default admin username: ${defaultAdminUsername}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message)
  process.exit(1)
})

export { app }
