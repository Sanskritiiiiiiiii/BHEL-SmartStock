import { Request, Response } from 'express';
import prisma from '../database/client';

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalMaterials,
      inventory,
      pendingSRVs,
      pendingSIVs,
      totalSuppliers,
      recentSRVs,
      recentSIVs,
    ] = await Promise.all([
      prisma.material.count(),
      prisma.inventory.findMany({
        include: {
          material: {
            select: {
              minimumStock: true,
              maximumStock: true,
              name: true,
              materialCode: true,
              category: true,
              unit: true,
            },
          },
        },
      }),
      prisma.sRV.count({ where: { status: 'PENDING' } }),
      prisma.sIV.count({ where: { status: 'PENDING' } }),
      prisma.supplier.count(),
      prisma.sRV.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { name: true } },
          items: { include: { material: { select: { name: true } } } },
        },
      }),
      prisma.sIV.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { material: { select: { name: true } } } },
        },
      }),
    ]);

    const lowStockMaterials = inventory.filter(
      (inv) => inv.currentStock <= inv.material.minimumStock
    );

    const inventoryValue = inventory.reduce((sum, inv) => {
      return sum + inv.currentStock * 100; // Using 100 as default unit value
    }, 0);

    // Category distribution
    const categoryMap = new Map<string, number>();
    const materials = await prisma.material.findMany({
      select: { category: true },
    });
    materials.forEach((m) => {
      categoryMap.set(m.category, (categoryMap.get(m.category) || 0) + 1);
    });

    const categoryDistribution = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));

    // Supplier stats
    const suppliers = await prisma.supplier.findMany({
      select: { name: true, totalBids: true, wonBids: true, rating: true },
      orderBy: { wonBids: 'desc' },
      take: 5,
    });

    // Stock summary for chart
    const stockSummary = inventory.slice(0, 10).map((inv) => ({
      name: inv.material.name.slice(0, 15),
      current: inv.currentStock,
      minimum: inv.material.minimumStock,
      maximum: inv.material.maximumStock,
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalMaterials,
          inventoryValue,
          lowStockCount: lowStockMaterials.length,
          pendingSRVs,
          pendingSIVs,
          totalSuppliers,
        },
        lowStockMaterials: lowStockMaterials.slice(0, 5).map((inv) => ({
          id: inv.materialId,
          name: inv.material.name,
          code: inv.material.materialCode,
          currentStock: inv.currentStock,
          minimumStock: inv.material.minimumStock,
          unit: inv.material.unit,
        })),
        categoryDistribution,
        stockSummary,
        suppliers,
        recentActivity: {
          srvs: recentSRVs,
          sivs: recentSIVs,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
