import { Request, Response } from 'express';
import prisma from '../database/client';
import { generateSIVNumber, paginate } from '../utils';
import { AuthenticatedRequest } from '../middleware/auth';

export const getSIVs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      status = '',
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (search) {
      where['OR'] = [
        { sivNumber: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [sivs, total] = await Promise.all([
      prisma.sIV.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true } },
          items: {
            include: {
              material: { select: { id: true, name: true, materialCode: true, unit: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        ...paginate(pageNum, limitNum),
      }),
      prisma.sIV.count({ where }),
    ]);

    res.json({
      success: true,
      data: sivs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get SIVs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getSIV = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const siv = await prisma.sIV.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            material: { select: { id: true, name: true, materialCode: true, unit: true } },
          },
        },
      },
    });

    if (!siv) {
      res.status(404).json({ success: false, error: 'SIV not found' });
      return;
    }

    res.json({ success: true, data: siv });
  } catch (error) {
    console.error('Get SIV error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createSIV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { department, issueDate, notes, items } = req.body;

    if (!department || !issueDate || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Department, issue date, and at least one item are required',
      });
      return;
    }

    // Validate stock availability
    for (const item of items) {
      const inventory = await prisma.inventory.findUnique({
        where: { materialId: item.materialId },
      });

      if (!inventory || inventory.currentStock < parseFloat(item.quantity)) {
        const material = await prisma.material.findUnique({
          where: { id: item.materialId },
          select: { name: true },
        });
        res.status(400).json({
          success: false,
          error: `Insufficient stock for material: ${material?.name || item.materialId}`,
        });
        return;
      }
    }

    const sivNumber = generateSIVNumber();

    const siv = await prisma.sIV.create({
      data: {
        sivNumber,
        department,
        issueDate: new Date(issueDate),
        notes,
        createdById: req.user!.userId,
        items: {
          create: items.map((item: { materialId: string; quantity: number }) => ({
            materialId: item.materialId,
            quantity: parseFloat(String(item.quantity)),
          })),
        },
      },
      include: {
        items: {
          include: {
            material: { select: { id: true, name: true, materialCode: true, unit: true } },
          },
        },
      },
    });

    res.status(201).json({ success: true, data: siv });
  } catch (error) {
    console.error('Create SIV error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const approveSIV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const siv = await prisma.sIV.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!siv) {
      res.status(404).json({ success: false, error: 'SIV not found' });
      return;
    }

    if (siv.status !== 'PENDING') {
      res.status(400).json({ success: false, error: 'SIV is not in pending status' });
      return;
    }

    // If approving, check and deduct stock
    if (action === 'approve') {
      for (const item of siv.items) {
        const inventory = await prisma.inventory.findUnique({
          where: { materialId: item.materialId },
        });

        if (!inventory || inventory.currentStock < item.quantity) {
          res.status(400).json({
            success: false,
            error: `Insufficient stock for item ${item.materialId}`,
          });
          return;
        }
      }

      for (const item of siv.items) {
        await prisma.inventory.update({
          where: { materialId: item.materialId },
          data: {
            currentStock: { decrement: item.quantity },
            lastUpdated: new Date(),
          },
        });
      }
    }

    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const updatedSIV = await prisma.sIV.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            material: { select: { id: true, name: true, materialCode: true, unit: true } },
          },
        },
      },
    });

    res.json({ success: true, data: updatedSIV });
  } catch (error) {
    console.error('Approve SIV error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
