import { Request, Response } from 'express';
import prisma from '../database/client';
import { paginate } from '../utils';

export const getMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      category = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { materialCode: { contains: search, mode: 'insensitive' as const } },
                { category: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {},
        category ? { category: { equals: category, mode: 'insensitive' as const } } : {},
      ],
    };

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        include: {
          inventory: { select: { currentStock: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        ...paginate(pageNum, limitNum),
      }),
      prisma.material.count({ where }),
    ]);

    const formattedMaterials = materials.map((m) => ({
      ...m,
      currentStock: m.inventory?.currentStock ?? 0,
    }));

    res.json({
      success: true,
      data: formattedMaterials,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        inventory: true,
      },
    });

    if (!material) {
      res.status(404).json({ success: false, error: 'Material not found' });
      return;
    }

    res.json({ success: true, data: material });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      materialCode,
      name,
      category,
      description,
      unit,
      minimumStock,
      maximumStock,
      safetyBuffer,
      leadTime,
      initialStock,
    } = req.body;

    if (!materialCode || !name || !category || !unit) {
      res.status(400).json({
        success: false,
        error: 'Material code, name, category, and unit are required',
      });
      return;
    }

    // Normalize material code (remove dashes, uppercase)
    const normalizedCode = materialCode.replace(/-/g, '').toUpperCase();

    const existing = await prisma.material.findUnique({
      where: { materialCode: normalizedCode },
    });

    if (existing) {
      res.status(409).json({ success: false, error: 'Material code already exists' });
      return;
    }

    const material = await prisma.material.create({
      data: {
        materialCode: normalizedCode,
        name,
        category,
        description,
        unit,
        minimumStock: parseFloat(minimumStock) || 0,
        maximumStock: parseFloat(maximumStock) || 0,
        safetyBuffer: parseFloat(safetyBuffer) || 0,
        leadTime: parseInt(leadTime) || 0,
        inventory: {
          create: {
            currentStock: parseFloat(initialStock) || 0,
          },
        },
      },
      include: { inventory: true },
    });

    res.status(201).json({ success: true, data: material });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      description,
      unit,
      minimumStock,
      maximumStock,
      safetyBuffer,
      leadTime,
    } = req.body;

    const material = await prisma.material.update({
      where: { id },
      data: {
        name,
        category,
        description,
        unit,
        minimumStock: minimumStock !== undefined ? parseFloat(minimumStock) : undefined,
        maximumStock: maximumStock !== undefined ? parseFloat(maximumStock) : undefined,
        safetyBuffer: safetyBuffer !== undefined ? parseFloat(safetyBuffer) : undefined,
        leadTime: leadTime !== undefined ? parseInt(leadTime) : undefined,
      },
      include: { inventory: true },
    });

    res.json({ success: true, data: material });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const deleteMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.material.delete({ where: { id } });

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.material.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    res.json({
      success: true,
      data: categories.map((c) => ({ name: c.category, count: c._count.category })),
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
