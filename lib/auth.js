import jwt from 'jsonwebtoken'
import { getCollection } from './mongodb'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
    throw new Error('Please define the JWT_SECRET environment variable inside .env.local')
}

export async function verifyToken(token) {
    if (!token) {
        return null
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        const collection = await getCollection('users')
        const user = await collection.findOne({ 
            email: decoded.email,
            active: true 
        })
        
        return user
    } catch (error) {
        console.error('Token verification failed:', error)
        return null
    }
}

export function generateToken(user) {
    return jwt.sign(
        { 
            email: user.email,
            id: user._id 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    )
} 