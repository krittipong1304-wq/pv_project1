import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'

import { createAuthToken, hashPassword, verifyAuthToken, verifyPassword } from './auth.js'
import { sampleProjects } from './data/sampleProjects.js'
import { AdminUser } from './models/AdminUser.js'
import { Project } from './models/Project.js'
import { Review } from './models/Review.js'
import { User } from './models/User.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000
const mongoUri = process.env.MONGODB_URI
const defaultAdminUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase()
const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin1234'

app.use(cors())
app.use(express.json())

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

  return { message: 'Admin authorization required' }
}

function createAuthMiddleware(Model, role) {
  return async function authMiddleware(request, response, next) {
    try {
      const token = extractBearerToken(request)
      const payload = verifyAuthToken(token)

      if (!payload || payload.role !== role) {
        response.status(401).json(getUnauthorizedMessage(role))
        return
      }

      const account = await Model.findById(payload.sub)

      if (!account || account.username !== payload.username) {
        response.status(401).json(getUnauthorizedMessage(role))
        return
      }

      if (role === 'admin') {
        request.adminUser = account
      } else {
        request.user = account
      }

      next()
    } catch {
      response.status(401).json(getUnauthorizedMessage(role))
    }
  }
}

const requireAdminAuth = createAuthMiddleware(AdminUser, 'admin')
const requireUserAuth = createAuthMiddleware(User, 'user')

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Backend is running' })
})

app.post('/api/admin/login', async (req, res) => {
  try {
    const username = String(req.body?.username || '')
      .trim()
      .toLowerCase()
    const password = String(req.body?.password || '')

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' })
    }

    const adminUser = await AdminUser.findOne({ username })

    if (!adminUser) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    const passwordMatches = await verifyPassword(password, adminUser.passwordHash)

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    return res.json({
      token: createAuthToken(adminUser, 'admin'),
      user: {
        id: adminUser._id,
        username: adminUser.username,
      },
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Login failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/api/admin/me', requireAdminAuth, (req, res) => {
  res.json({
    user: {
      id: req.adminUser._id,
      username: req.adminUser.username,
    },
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
    })

    return res.status(201).json({
      token: createAuthToken(user, 'user'),
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        username: user.username,
      },
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
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid username/email or password' })
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash)

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid username/email or password' })
    }

    return res.json({
      token: createAuthToken(user, 'user'),
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        username: user.username,
      },
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
    user: {
      id: req.user._id,
      email: req.user.email,
      phone: req.user.phone,
      username: req.user.username,
    },
  })
})

app.get('/api/projects', async (_req, res) => {
  try {
    const projects = await Project.find().sort({ installedAt: -1, createdAt: -1 })
    res.json(projects)
  } catch {
    res.status(500).json({ message: 'Failed to load projects' })
  }
})

app.post('/api/projects', requireAdminAuth, async (req, res) => {
  try {
    const project = await Project.create(req.body)
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
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
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

async function seedCollection(Model, sampleData) {
  const total = await Model.countDocuments()

  if (total === 0) {
    await Model.insertMany(sampleData)
  }
}

async function ensureCollections() {
  await Promise.all([
    Project.createCollection().catch(() => null),
    AdminUser.createCollection().catch(() => null),
    User.createCollection().catch(() => null),
    Review.createCollection().catch(() => null),
  ])

  await Promise.all([
    Project.syncIndexes(),
    AdminUser.syncIndexes(),
    User.syncIndexes(),
    Review.syncIndexes(),
  ])
}

async function ensureDefaultAdminUser() {
  const totalAdmins = await AdminUser.countDocuments()

  if (totalAdmins > 0) {
    return
  }

  const passwordHash = await hashPassword(defaultAdminPassword)

  await AdminUser.create({
    username: defaultAdminUsername,
    passwordHash,
  })
}

async function startServer() {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing. Add it to your .env file.')
  }

  await mongoose.connect(mongoUri)
  await ensureCollections()
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
