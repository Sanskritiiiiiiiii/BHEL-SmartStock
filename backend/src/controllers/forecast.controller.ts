import { Request, Response } from 'express';
import prisma from '../database/client';
import { calculateExponentialSmoothing, generateFutureForecasts } from '../utils';
import { AuthenticatedRequest } from '../middleware/auth';

export const getForecast = async (req: Request, res: Response): Promise<void> => {
  try {
    const { materialId } = req.params;

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: { inventory: true },
    });

    if (!material) {
      res.status(404).json({ success: false, error: 'Material not found' });
      return;
    }

    const latestForecast = await prisma.forecast.findFirst({
      where: { materialId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        material,
        forecast: latestForecast,
      },
    });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const calculateForecast = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { materialId, alpha, historicalData } = req.body;

    if (!materialId || alpha === undefined || !historicalData || !Array.isArray(historicalData)) {
      res.status(400).json({
        success: false,
        error: 'Material ID, alpha, and historical data are required',
      });
      return;
    }

    const alphaVal = parseFloat(alpha);
    if (alphaVal < 0 || alphaVal > 1) {
      res.status(400).json({ success: false, error: 'Alpha must be between 0 and 1' });
      return;
    }

    const data = historicalData.map(Number).filter((n) => !isNaN(n));
    if (data.length < 2) {
      res.status(400).json({ success: false, error: 'At least 2 historical data points are required' });
      return;
    }

    const smoothedData = calculateExponentialSmoothing(data, alphaVal);
    const futureForecasts = generateFutureForecasts(data, alphaVal, 6);

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const historicalLabels = data.map((_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (data.length - i));
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    });

    const futureLabels = futureForecasts.map((_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() + i + 1);
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    });

    // Save forecast to database
    const forecast = await prisma.forecast.upsert({
      where: {
        id: (await prisma.forecast.findFirst({ where: { materialId }, select: { id: true } }))?.id || 'new',
      },
      update: {
        alpha: alphaVal,
        historicalData: { values: data, labels: historicalLabels },
        forecastData: {
          smoothed: smoothedData,
          future: futureForecasts,
          futureLabels,
          historicalLabels,
        },
        period: 'monthly',
      },
      create: {
        materialId,
        alpha: alphaVal,
        historicalData: { values: data, labels: historicalLabels },
        forecastData: {
          smoothed: smoothedData,
          future: futureForecasts,
          futureLabels,
          historicalLabels,
        },
        period: 'monthly',
      },
    });

    res.json({
      success: true,
      data: {
        forecast,
        results: {
          historicalLabels,
          historicalData: data,
          smoothedData,
          futureLabels,
          futureForecasts,
          alpha: alphaVal,
        },
      },
    });
  } catch (error) {
    console.error('Calculate forecast error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const getForecasts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const forecasts = await prisma.forecast.findMany({
      include: {
        material: { select: { id: true, name: true, materialCode: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: forecasts });
  } catch (error) {
    console.error('Get forecasts error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
