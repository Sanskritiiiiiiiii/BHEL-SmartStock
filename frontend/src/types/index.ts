export type Role = 'ADMIN' | 'STORE_MANAGER' | 'INVENTORY_OFFICER' | 'PROCUREMENT_OFFICER' | 'VENDOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  vendorId?: string | null;
  vendor?: Supplier | null;
  createdAt: string;
}

export interface Material {
  id: string;
  materialCode: string;
  name: string;
  category: string;
  description?: string;
  unit: string;
  minimumStock: number;
  maximumStock: number;
  safetyBuffer: number;
  leadTime: number;
  currentStock?: number;
  inventory?: Inventory;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  materialId: string;
  currentStock: number;
  lastUpdated: string;
  material?: Material;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  rating: number;
  totalBids: number;
  wonBids: number;
  createdAt: string;
}

export interface SRVItem {
  id: string;
  srvId: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  material?: Pick<Material, 'id' | 'name' | 'materialCode' | 'unit'>;
}

export interface SRV {
  id: string;
  srvNumber: string;
  supplierId: string;
  receiptDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdById: string;
  supplier?: Supplier;
  createdBy?: Pick<User, 'id' | 'name'>;
  items: SRVItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SIVItem {
  id: string;
  sivId: string;
  materialId: string;
  quantity: number;
  material?: Pick<Material, 'id' | 'name' | 'materialCode' | 'unit'>;
}

export interface SIV {
  id: string;
  sivNumber: string;
  department: string;
  issueDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdById: string;
  createdBy?: Pick<User, 'id' | 'name'>;
  items: SIVItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Tender {
  id: string;
  title: string;
  description?: string;
  materialId?: string;
  quantity?: number;
  status: 'OPEN' | 'CLOSED' | 'AWARDED';
  deadline: string;
  bids: SupplierBid[];
  createdAt: string;
}

export interface SupplierBid {
  id: string;
  tenderId: string;
  supplierId: string;
  amount: number;
  currency: string;
  notes?: string;
  isWinner: boolean;
  submittedAt: string;
  supplier?: Supplier;
}

export interface Forecast {
  id: string;
  materialId: string;
  alpha: number;
  historicalData: {
    values: number[];
    labels: string[];
  };
  forecastData: {
    smoothed: number[];
    future: number[];
    futureLabels: string[];
    historicalLabels: string[];
  };
  period: string;
  material?: Pick<Material, 'id' | 'name' | 'materialCode'>;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  stats: {
    totalMaterials: number;
    inventoryValue: number;
    lowStockCount: number;
    pendingSRVs: number;
    pendingSIVs: number;
    totalSuppliers: number;
  };
  lowStockMaterials: Array<{
    id: string;
    name: string;
    code: string;
    currentStock: number;
    minimumStock: number;
    unit: string;
  }>;
  categoryDistribution: Array<{ name: string; count: number }>;
  stockSummary: Array<{
    name: string;
    current: number;
    minimum: number;
    maximum: number;
  }>;
  suppliers: Array<{
    name: string;
    totalBids: number;
    wonBids: number;
    rating: number;
  }>;
  recentActivity: {
    srvs: SRV[];
    sivs: SIV[];
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
