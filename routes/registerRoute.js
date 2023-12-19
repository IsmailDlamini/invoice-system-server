import express from 'express'
import { register } from '../controllers/registerController.js'

const registerRoute = express.Router();

// registerRoute.post('/register', register)

export default registerRoute