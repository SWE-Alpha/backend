import { Request, Response } from "express";
const { prisma } = require("../utils/db");

type AuthedRequest = Request & { user?: { id: string; role: string } };

// GET /api/users → list all users (admin only)
export const getUsers = async (req: AuthedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        number: true,
        userName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return res.json({ success: true, data: users });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch users", message: err.message });
  }
};

// GET /api/users/:id → get single user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        number: true,
        userName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    return res.json({ success: true, data: user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch user", message: err.message });
  }
};

// PUT /api/users/:id → update user (role, isActive, etc.)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userName, phone, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { userName, phone, role, isActive },
      select: {
        id: true,
        number: true,
        userName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.json({ success: true, data: user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to update user", message: err.message });
  }
};

// DELETE /api/users/:id → soft delete (set isActive = false)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return res.json({ success: true, message: "User deactivated", data: { id: user.id } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to delete user", message: err.message });
  }
};
