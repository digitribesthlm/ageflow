export function withAuth(handler) {
  return async (req, res) => {
    // Check auth token from cookie
    const authToken = req.cookies['auth-token']
    if (!authToken) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // If authenticated, proceed with the request
    return handler(req, res)
  }
} 