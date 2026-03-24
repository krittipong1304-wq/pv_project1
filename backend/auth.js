import crypto from 'crypto'

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12
const SCRYPT_KEY_LENGTH = 64

function getAuthSecret() {
  return process.env.AUTH_SECRET || 'change-this-auth-secret'
}

function encodeTokenPayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodeTokenPayload(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
}

function signValue(value) {
  return crypto.createHmac('sha256', getAuthSecret()).update(value).digest('base64url')
}

export function createAuthToken(account, role = account.role || 'user') {
  const payload = {
    sub: account._id.toString(),
    username: account.username,
    role,
    exp: Date.now() + TOKEN_TTL_MS,
  }

  const encoded = encodeTokenPayload(payload)
  const signature = signValue(encoded)

  return `${encoded}.${signature}`
}

export function verifyAuthToken(token) {
  if (!token || !token.includes('.')) {
    return null
  }

  const [encoded, signature] = token.split('.')
  const expectedSignature = signValue(encoded)

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null
  }

  try {
    const payload = decodeTokenPayload(encoded)

    if (!payload?.sub || !payload?.username || !payload?.role || !payload?.exp) {
      return null
    }

    if (payload.exp < Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, key) => {
      if (error) {
        reject(error)
        return
      }

      resolve(key)
    })
  })

  return `${salt}:${Buffer.from(derivedKey).toString('hex')}`
}

export async function verifyPassword(password, passwordHash) {
  const [salt, storedKey] = passwordHash.split(':')

  if (!salt || !storedKey) {
    return false
  }

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, key) => {
      if (error) {
        reject(error)
        return
      }

      resolve(key)
    })
  })

  return crypto.timingSafeEqual(Buffer.from(storedKey, 'hex'), Buffer.from(derivedKey))
}
