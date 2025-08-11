import { Request, Response } from 'express';
const { prisma } = require('../utils/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

type AuthedRequest = Request & { user?: { id: string } };

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, userName, phone } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'email already in use' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hash, userName, phone },
      select: { id: true, email: true, userName: true, phone: true, createdAt: true }
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ success: true, data: { user, token } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to register', message: err.message });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ success: false, error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, error: 'invalid credentials' });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      success: true,
      data: { user: { id: user.id, email: user.email, userName: user.userName }, token }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to login', message: err.message });
  }
};

// GET /api/auth/me
export const me = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, userName: true, phone: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ success: false, error: 'user not found' });

    return res.json({ success: true, data: user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to load profile', message: err.message });
  }
};