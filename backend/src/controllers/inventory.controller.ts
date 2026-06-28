import { Request, Response } from 'express';
import prisma from '../database/client';
import { paginate } from '../utils';

export const getInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      filter = 'all',
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const materialWhere = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { materialCode: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const allInventory = await prisma.inventory.findMany({
      include: {
        material: true,
      },
      orderBy: { lastUpdated: 'desc' },
    });

    let filtered = allInventory;

    if (filter === 'low') {
      filtered = allInventory.filter(
        (inv) => inv.currentStock <= inv.material.minimumStock && inv.currentStock > 0
      );
    } else if (filter === 'out') {
      filtered = allInventory.filter((inv) => inv.currentStock === 0);
    } else if (filter === 'ok') {
      filtered = allInventory.filter((inv) => inv.currentStock > inv.material.minimumStock);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (inv) =>
          inv.material.name.toLowerCase().includes(searchLower) ||
          inv.material.materialCode.toLowerCase().includes(searchLower)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    const stats = {
      total: allInventory.length,
      lowStock: allInventory.filter(
        (inv) => inv.currentStock > 0 && inv.currentStock <= inv.material.minimumStock
      ).length,
      outOfStock: allInventory.filter((inv) => inv.currentStock === 0).length,
      adequate: allInventory.filter((inv) => inv.currentStock > inv.material.minimumStock).length,
    };

    res.json({
      success: true,
      data: paginated,
      stats,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getInventoryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { materialId } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { materialId },
      include: { material: true },
    });

    if (!inventory) {
      res.status(404).json({ success: false, error: 'Inventory record not found' });
      return;
    }

    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const adjustStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { materialId } = req.params;
    const { quantity, type } = req.body; // type: 'add' | 'subtract' | 'set'

    const inventory = await prisma.inventory.findUnique({ where: { materialId } });
    if (!inventory) {
      res.status(404).json({ success: false, error: 'Inventory record not found' });
      return;
    }

    let newStock = inventory.currentStock;
    const qty = parseFloat(quantity);

    if (type === 'add') {
      newStock += qty;
    } else if (type === 'subtract') {
      newStock = Math.max(0, newStock - qty);
    } else if (type === 'set') {
      newStock = Math.max(0, qty);
    }

    const updated = await prisma.inventory.update({
      where: { materialId },
      data: { currentStock: newStock, lastUpdated: new Date() },
      include: { material: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
