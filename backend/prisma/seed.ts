import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { email: 'techsupply@example.com' },
    update: {},
    create: {
      name: 'TechSupply India Pvt Ltd',
      email: 'techsupply@example.com',
      phone: '+91-9876543210',
      address: '123 Industrial Area, Mumbai, Maharashtra',
      rating: 4.5,
      totalBids: 12,
      wonBids: 8,
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { email: 'metalpro@example.com' },
    update: {},
    create: {
      name: 'MetalPro Solutions',
      email: 'metalpro@example.com',
      phone: '+91-9876543211',
      address: '456 Commerce Hub, Delhi',
      rating: 4.2,
      totalBids: 10,
      wonBids: 6,
    },
  });

  const supplier3 = await prisma.supplier.upsert({
    where: { email: 'globalparts@example.com' },
    update: {},
    create: {
      name: 'Global Parts & Components',
      email: 'globalparts@example.com',
      phone: '+91-9876543212',
      address: '789 Export Zone, Chennai',
      rating: 3.8,
      totalBids: 8,
      wonBids: 3,
    },
  });

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const managerPassword = await bcrypt.hash('manager123', 12);
  const officerPassword = await bcrypt.hash('officer123', 12);
  const vendorPassword = await bcrypt.hash('vendor123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@mmis.com' },
    update: {},
    create: {
      name: 'System Administrator',
      email: 'admin@mmis.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@mmis.com' },
    update: {},
    create: {
      name: 'Store Manager',
      email: 'manager@mmis.com',
      password: managerPassword,
      role: Role.STORE_MANAGER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'officer@mmis.com' },
    update: {},
    create: {
      name: 'Inventory Officer',
      email: 'officer@mmis.com',
      password: officerPassword,
      role: Role.INVENTORY_OFFICER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'procurement@mmis.com' },
    update: {},
    create: {
      name: 'Procurement Officer',
      email: 'procurement@mmis.com',
      password: officerPassword,
      role: Role.PROCUREMENT_OFFICER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'vendor@techsupply.com' },
    update: {},
    create: {
      name: 'TechSupply Vendor',
      email: 'vendor@techsupply.com',
      password: vendorPassword,
      role: Role.VENDOR,
      vendorId: supplier1.id,
    },
  });

  // Create materials with inventory
  const materialsData = [
    { code: 'STL001', name: 'Stainless Steel Sheets', category: 'Metals', unit: 'kg', min: 100, max: 1000, safety: 50, lead: 7, stock: 450 },
    { code: 'ALU002', name: 'Aluminum Rods', category: 'Metals', unit: 'kg', min: 50, max: 500, safety: 25, lead: 5, stock: 30 },
    { code: 'ELC003', name: 'Copper Wire 2.5mm', category: 'Electrical', unit: 'm', min: 200, max: 2000, safety: 100, lead: 3, stock: 850 },
    { code: 'ELC004', name: 'Circuit Breakers 32A', category: 'Electrical', unit: 'pcs', min: 20, max: 200, safety: 10, lead: 10, stock: 45 },
    { code: 'HYD005', name: 'Hydraulic Oil ISO 46', category: 'Lubricants', unit: 'L', min: 100, max: 500, safety: 50, lead: 4, stock: 0 },
    { code: 'BRG006', name: 'Ball Bearings SKF 6205', category: 'Mechanical', unit: 'pcs', min: 50, max: 500, safety: 25, lead: 14, stock: 120 },
    { code: 'PLT007', name: 'PVC Pipes 2 inch', category: 'Plumbing', unit: 'm', min: 100, max: 1000, safety: 50, lead: 5, stock: 380 },
    { code: 'FAB008', name: 'Industrial Filters', category: 'Filtration', unit: 'pcs', min: 30, max: 300, safety: 15, lead: 7, stock: 25 },
    { code: 'CHM009', name: 'Acetone Industrial Grade', category: 'Chemicals', unit: 'L', min: 50, max: 300, safety: 25, lead: 3, stock: 160 },
    { code: 'TOL010', name: 'Precision Drill Bits Set', category: 'Tools', unit: 'set', min: 10, max: 100, safety: 5, lead: 10, stock: 35 },
    { code: 'GAS011', name: 'Welding Gas Cylinders', category: 'Gas', unit: 'unit', min: 5, max: 50, safety: 3, lead: 7, stock: 12 },
    { code: 'SAF012', name: 'Safety Helmets', category: 'Safety', unit: 'pcs', min: 20, max: 200, safety: 10, lead: 5, stock: 75 },
  ];

  for (const mat of materialsData) {
    const existingMaterial = await prisma.material.findUnique({ where: { materialCode: mat.code } });
    if (!existingMaterial) {
      await prisma.material.create({
        data: {
          materialCode: mat.code,
          name: mat.name,
          category: mat.category,
          unit: mat.unit,
          minimumStock: mat.min,
          maximumStock: mat.max,
          safetyBuffer: mat.safety,
          leadTime: mat.lead,
          inventory: {
            create: { currentStock: mat.stock },
          },
        },
      });
    }
  }

  console.log('✅ Seed complete!');
  console.log('');
  console.log('🔑 Login credentials:');
  console.log('  Admin:        admin@mmis.com / admin123');
  console.log('  Store Manager: manager@mmis.com / manager123');
  console.log('  Inv. Officer:  officer@mmis.com / officer123');
  console.log('  Vendor:       vendor@techsupply.com / vendor123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
