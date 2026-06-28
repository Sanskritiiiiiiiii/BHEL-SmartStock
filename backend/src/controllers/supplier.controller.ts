import { Request, Response } from 'express';
import prisma from '../database/client';
import { paginate } from '../utils';

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search = '' } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...paginate(pageNum, limitNum),
      }),
      prisma.supplier.count({ where }),
    ]);

    res.json({
      success: true,
      data: suppliers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name || !email) {
      res.status(400).json({ success: false, error: 'Name and email are required' });
      return;
    }

    const existing = await prisma.supplier.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Supplier email already exists' });
      return;
    }

    const supplier = await prisma.supplier.create({
      data: { name, email, phone, address },
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, email, phone, address },
    });

    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const deleteSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.supplier.delete({ where: { id } });
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// TENDERS
export const getTenders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = '' } = req.query as Record<string, string>;

    const where = status ? { status: status as 'OPEN' | 'CLOSED' | 'AWARDED' } : {};

    const tenders = await prisma.tender.findMany({
      where,
      include: {
        bids: {
          include: {
            supplier: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: tenders });
  } catch (error) {
    console.error('Get tenders error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const createTender = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, materialId, quantity, deadline } = req.body;

    if (!title || !deadline) {
      res.status(400).json({ success: false, error: 'Title and deadline are required' });
      return;
    }

    const tender = await prisma.tender.create({
      data: {
        title,
        description,
        materialId: materialId || null,
        quantity: quantity ? parseFloat(quantity) : null,
        deadline: new Date(deadline),
        status: 'OPEN',
      },
    });

    res.status(201).json({ success: true, data: tender });
  } catch (error) {
    console.error('Create tender error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const submitBid = async (req: Request & { user?: { userId: string; vendorId?: string | null } }, res: Response): Promise<void> => {
  try {
    const { tenderId } = req.params;
    const { amount, notes } = req.body;
    const supplierId = req.user?.vendorId;

    if (!supplierId) {
      res.status(400).json({ success: false, error: 'Vendor ID not found for this user' });
      return;
    }

    if (!amount) {
      res.status(400).json({ success: false, error: 'Amount is required' });
      return;
    }

    const tender = await prisma.tender.findUnique({ where: { id: tenderId } });
    if (!tender) {
      res.status(404).json({ success: false, error: 'Tender not found' });
      return;
    }

    if (tender.status !== 'OPEN') {
      res.status(400).json({ success: false, error: 'Tender is not open for bidding' });
      return;
    }

    const existing = await prisma.supplierBid.findFirst({
      where: { tenderId, supplierId },
    });

    let bid;
    if (existing) {
      bid = await prisma.supplierBid.update({
        where: { id: existing.id },
        data: { amount: parseFloat(amount), notes },
      });
    } else {
      bid = await prisma.supplierBid.create({
        data: {
          tenderId,
          supplierId,
          amount: parseFloat(amount),
          currency: 'INR',
          notes,
        },
      });

      await prisma.supplier.update({
        where: { id: supplierId },
        data: { totalBids: { increment: 1 } },
      });
    }

    res.status(201).json({ success: true, data: bid });
  } catch (error) {
    console.error('Submit bid error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const selectWinner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenderId, bidId } = req.params;

    // Mark all other bids as non-winner
    await prisma.supplierBid.updateMany({
      where: { tenderId },
      data: { isWinner: false },
    });

    // Mark selected bid as winner
    const bid = await prisma.supplierBid.update({
      where: { id: bidId },
      data: { isWinner: true },
      include: { supplier: true },
    });

    // Close tender and update supplier stats
    await prisma.tender.update({
      where: { id: tenderId },
      data: { status: 'AWARDED' },
    });

    await prisma.supplier.update({
      where: { id: bid.supplierId },
      data: { wonBids: { increment: 1 } },
    });

    res.json({ success: true, data: bid });
  } catch (error) {
    console.error('Select winner error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
