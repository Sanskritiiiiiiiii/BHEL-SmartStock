import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

export const generateToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`;
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};

export const generateMaterialCode = (category: string, id: string): string => {
  const prefix = category.toUpperCase().replace(/\s+/g, '').slice(0, 3);
  const numericPart = id.replace(/[^0-9]/g, '').slice(-6).padStart(6, '0');
  return `${prefix}${numericPart}`;
};

export const generateSRVNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SRV${year}${month}${random}`;
};

export const generateSIVNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SIV${year}${month}${random}`;
};

export const calculateExponentialSmoothing = (
  historicalData: number[],
  alpha: number
): number[] => {
  if (historicalData.length === 0) return [];
  
  const forecasts: number[] = [historicalData[0]];
  
  for (let i = 1; i < historicalData.length; i++) {
    const ft = alpha * historicalData[i - 1] + (1 - alpha) * forecasts[i - 1];
    forecasts.push(ft);
  }
  
  return forecasts;
};

export const generateFutureForecasts = (
  historicalData: number[],
  alpha: number,
  periods: number = 6
): number[] => {
  const smoothed = calculateExponentialSmoothing(historicalData, alpha);
  const lastSmoothed = smoothed[smoothed.length - 1];
  const lastActual = historicalData[historicalData.length - 1];
  
  const futureForecast: number[] = [];
  let prevForecast = alpha * lastActual + (1 - alpha) * lastSmoothed;
  
  for (let i = 0; i < periods; i++) {
    futureForecast.push(Math.max(0, prevForecast));
    prevForecast = alpha * prevForecast + (1 - alpha) * prevForecast;
  }
  
  return futureForecast;
};

export const paginate = (page: number, limit: number) => ({
  skip: (page - 1) * limit,
  take: limit,
});
