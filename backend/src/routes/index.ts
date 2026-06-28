import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as dashboardController from '../controllers/dashboard.controller';
import * as materialController from '../controllers/material.controller';
import * as inventoryController from '../controllers/inventory.controller';
import * as srvController from '../controllers/srv.controller';
import * as sivController from '../controllers/siv.controller';
import * as supplierController from '../controllers/supplier.controller';
import * as forecastController from '../controllers/forecast.controller';
import * as reportsController from '../controllers/reports.controller';
import { authenticate, authorize } from '../middleware/auth';
import { AuthenticatedRequest } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Auth routes
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.getMe);
router.post('/auth/users', authenticate, authorize('ADMIN'), authController.createUser);
router.get('/auth/users', authenticate, authorize('ADMIN'), authController.getUsers);

// Dashboard routes
router.get('/dashboard', authenticate, dashboardController.getDashboardStats);

// Material routes
router.get('/materials', authenticate, materialController.getMaterials);
router.get('/materials/categories', authenticate, materialController.getCategories);
router.get('/materials/:id', authenticate, materialController.getMaterial);
router.post('/materials', authenticate, authorize('ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER'), materialController.createMaterial);
router.put('/materials/:id', authenticate, authorize('ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER'), materialController.updateMaterial);
router.delete('/materials/:id', authenticate, authorize('ADMIN', 'STORE_MANAGER'), materialController.deleteMaterial);

// Inventory routes
router.get('/inventory', authenticate, inventoryController.getInventory);
router.get('/inventory/:materialId', authenticate, inventoryController.getInventoryItem);
router.patch('/inventory/:materialId/adjust', authenticate, authorize('ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER'), inventoryController.adjustStock);

// SRV routes
router.get('/srv', authenticate, srvController.getSRVs);
router.get('/srv/:id', authenticate, srvController.getSRV);
router.post('/srv', authenticate, authorize('ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER', 'PROCUREMENT_OFFICER'), (req: Request, res: Response, next: NextFunction) => srvController.createSRV(req as AuthenticatedRequest, res).catch(next));
router.patch('/srv/:id/status', authenticate, authorize('ADMIN', 'STORE_MANAGER'), (req: Request, res: Response, next: NextFunction) => srvController.approveSRV(req as AuthenticatedRequest, res).catch(next));

// SIV routes
router.get('/siv', authenticate, sivController.getSIVs);
router.get('/siv/:id', authenticate, sivController.getSIV);
router.post('/siv', authenticate, authorize('ADMIN', 'STORE_MANAGER', 'INVENTORY_OFFICER'), (req: Request, res: Response, next: NextFunction) => sivController.createSIV(req as AuthenticatedRequest, res).catch(next));
router.patch('/siv/:id/status', authenticate, authorize('ADMIN', 'STORE_MANAGER'), (req: Request, res: Response, next: NextFunction) => sivController.approveSIV(req as AuthenticatedRequest, res).catch(next));

// Supplier routes
router.get('/suppliers', authenticate, supplierController.getSuppliers);
router.post('/suppliers', authenticate, authorize('ADMIN', 'STORE_MANAGER'), supplierController.createSupplier);
router.put('/suppliers/:id', authenticate, authorize('ADMIN', 'STORE_MANAGER'), supplierController.updateSupplier);
router.delete('/suppliers/:id', authenticate, authorize('ADMIN'), supplierController.deleteSupplier);

// Tender / Bidding routes
router.get('/tenders', authenticate, supplierController.getTenders);
router.post('/tenders', authenticate, authorize('ADMIN', 'STORE_MANAGER'), supplierController.createTender);
router.post('/tenders/:tenderId/bid', authenticate, authorize('VENDOR'), (req: Request, res: Response, next: NextFunction) => supplierController.submitBid(req as AuthenticatedRequest, res).catch(next));
router.patch('/tenders/:tenderId/bids/:bidId/winner', authenticate, authorize('ADMIN', 'STORE_MANAGER'), supplierController.selectWinner);

// Forecast routes
router.get('/forecasts', authenticate, forecastController.getForecasts);
router.get('/forecasts/:materialId', authenticate, forecastController.getForecast);
router.post('/forecasts/calculate', authenticate, (req: Request, res: Response, next: NextFunction) => forecastController.calculateForecast(req as AuthenticatedRequest, res).catch(next));

// Report routes
router.get('/reports/inventory', authenticate, reportsController.getInventoryReport);
router.get('/reports/suppliers', authenticate, reportsController.getSupplierReport);
router.get('/reports/srv', authenticate, reportsController.getSRVReport);
router.get('/reports/siv', authenticate, reportsController.getSIVReport);
router.get('/reports/forecasts', authenticate, reportsController.getForecastReport);

export default router;
