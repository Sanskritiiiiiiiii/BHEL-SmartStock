import { Request, Response } from 'express';
import prisma from '../database/client';

export const getInventoryReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        material: true,
      },
      orderBy: { material: { name: 'asc' } },
    });

    const stats = {
      total: inventory.length,
      lowStock: inventory.filter((i) => i.currentStock > 0 && i.currentStock <= i.material.minimumStock).length,
      outOfStock: inventory.filter((i) => i.currentStock === 0).length,
      adequate: inventory.filter((i) => i.currentStock > i.material.minimumStock).length,
      totalValue: inventory.reduce((sum, i) => sum + i.currentStock * 100, 0),
    };

    res.json({ success: true, data: { inventory, stats } });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getSupplierReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        srvs: {
          select: { id: true, status: true, createdAt: true },
        },
        bids: {
          select: { id: true, amount: true, isWinner: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = suppliers.map((s) => ({
      ...s,
      totalSRVs: s.srvs.length,
      approvedSRVs: s.srvs.filter((srv) => srv.status === 'APPROVED').length,
      totalBidAmount: s.bids.reduce((sum, b) => sum + b.amount, 0),
      winRate: s.totalBids > 0 ? ((s.wonBids / s.totalBids) * 100).toFixed(1) : '0',
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Supplier report error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getSRVReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (startDate || endDate) {
      where['receiptDate'] = {};
      if (startDate) (where['receiptDate'] as Record<string, Date>)['gte'] = new Date(startDate);
      if (endDate) (where['receiptDate'] as Record<string, Date>)['lte'] = new Date(endDate);
    }

    const srvs = await prisma.sRV.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        items: {
          include: {
            material: { select: { name: true, materialCode: true, unit: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: srvs.length,
      pending: srvs.filter((s) => s.status === 'PENDING').length,
      approved: srvs.filter((s) => s.status === 'APPROVED').length,
      rejected: srvs.filter((s) => s.status === 'REJECTED').length,
    };

    res.json({ success: true, data: { srvs, stats } });
  } catch (error) {
    console.error('SRV report error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getSIVReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (startDate || endDate) {
      where['issueDate'] = {};
      if (startDate) (where['issueDate'] as Record<string, Date>)['gte'] = new Date(startDate);
      if (endDate) (where['issueDate'] as Record<string, Date>)['lte'] = new Date(endDate);
    }

    const sivs = await prisma.sIV.findMany({
      where,
      include: {
        items: {
          include: {
            material: { select: { name: true, materialCode: true, unit: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: sivs.length,
      pending: sivs.filter((s) => s.status === 'PENDING').length,
      approved: sivs.filter((s) => s.status === 'APPROVED').length,
      rejected: sivs.filter((s) => s.status === 'REJECTED').length,
    };

    // Department breakdown
    const deptMap = new Map<string, number>();
    sivs.forEach((s) => {
      deptMap.set(s.department, (deptMap.get(s.department) || 0) + 1);
    });

    const departmentBreakdown = Array.from(deptMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));

    res.json({ success: true, data: { sivs, stats, departmentBreakdown } });
  } catch (error) {
    console.error('SIV report error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getForecastReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const forecasts = await prisma.forecast.findMany({
      include: {
        material: { select: { id: true, name: true, materialCode: true, category: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: forecasts });
  } catch (error) {
    console.error('Forecast report error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
