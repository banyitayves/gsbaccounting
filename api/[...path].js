import { app, initializeServer } from '../backend/src/server.js'

export default async function handler(request, response) {
  try {
    await initializeServer()
    return app(request, response)
  } catch (error) {
    console.error('Could not initialize the accounting API.', error)
    return response.status(503).json({ error: 'The accounting service is not configured or available.' })
  }
}
