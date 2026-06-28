import { Request, Response } from 'express';
import prisma from '../database/client';
import { generateSRVNumber, paginate } from '../utils';
import { AuthenticatedRequest } from '../middleware/auth';

export const getSRVs = async (req: Request, res: Response): Promise<void> => {
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
        { srvNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [srvs, total] = await Promise.all([
      prisma.sRV.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, email: true } },
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
      prisma.sRV.count({ where }),
    ]);

    res.json({
      success: true,
      data: srvs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get SRVs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getSRV = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const srv = await prisma.sRV.findUnique({
      where: { id },
      include: {
        supplier: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            material: { select: { id: true, name: true, materialCode: true, unit: true } },
          },
        },
      },
    });

    if (!srv) {
      res.status(404).json({ success: false, error: 'SRV not found' });
      return;
    }

    res.json({ success: true, data: srv });
  } catch (error) {
    console.error('Get SRV error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createSRV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { supplierId, receiptDate, notes, items } = req.body;

    if (!supplierId || !receiptDate || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Supplier, receipt date, and at least one item are required',
      });
      return;
    }

    const srvNumber = generateSRVNumber();

    const srv = await prisma.sRV.create({
      data: {
        srvNumber,
        supplierId,
        receiptDate: new Date(receiptDate),
        notes,
        createdById: req.user!.userId,
        items: {
          create: items.map((item: { materialId: string; quantity: number; unitPrice: number }) => ({
            materialId: item.materialId,
            quantity: parseFloat(String(item.quantity)),
            unitPrice: parseFloat(String(item.unitPrice)) || 0,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            material: { select: { id: true, name: true, materialCode: true, unit: true } },
          },
        },
      },
    });

    res.status(201).json({ success: true, data: srv });
  } catch (error) {
    console.error('Create SRV error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const approveSRV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' | 'reject'

    const srv = await prisma.sRV.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!srv) {
      res.status(404).json({ success: false, error: 'SRV not found' });
      return;
    }

    if (srv.status !== 'PENDING') {
      res.status(400).json({ success: false, error: 'SRV is not in pending status' });
      return;
    }

    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const updatedSRV = await prisma.sRV.update({
      where: { id },
      data: { status },
      include: {
        supplier: true,
        items: {
          include: {
            material: { select: { id: true, name: true, materialCode: true, unit: true } },
          },
        },
      },
    });

    // If approved, update inventory
    if (action === 'approve') {
      for (const item of srv.items) {
        await prisma.inventory.upsert({
          where: { materialId: item.materialId },
          update: {
            currentStock: { increment: item.quantity },
            lastUpdated: new Date(),
          },
          create: {
            materialId: item.materialId,
            currentStock: item.quantity,
          },
        });
      }
    }

    res.json({ success: true, data: updatedSRV });
  } catch (error) {
    console.error('Approve SRV error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
