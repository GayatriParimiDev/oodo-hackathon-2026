const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database records...');
  
  // Delete in reverse order of dependencies to avoid FK violations
  await prisma.expense.deleteMany({});
  await prisma.fuelLog.deleteMany({});
  await prisma.maintenanceLog.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});

  console.log('Seeding roles...');
  const roleFleetManager = await prisma.role.create({
    data: { name: 'FleetManager' },
  });
  const roleDriver = await prisma.role.create({
    data: { name: 'Driver' },
  });
  const roleSafetyOfficer = await prisma.role.create({
    data: { name: 'SafetyOfficer' },
  });
  const roleFinancialAnalyst = await prisma.role.create({
    data: { name: 'FinancialAnalyst' },
  });

  console.log('Seeding users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const usersData = [
    { name: 'Alice FleetManager 1', email: 'fleetmanager1@transitops.com', password_hash: hashedPassword, role_id: roleFleetManager.id },
    { name: 'Bob FleetManager 2', email: 'fleetmanager2@transitops.com', password_hash: hashedPassword, role_id: roleFleetManager.id },
    
    { name: 'Charlie Driver 1', email: 'driver1@transitops.com', password_hash: hashedPassword, role_id: roleDriver.id },
    { name: 'David Driver 2', email: 'driver2@transitops.com', password_hash: hashedPassword, role_id: roleDriver.id },
    
    { name: 'Eve Safety 1', email: 'safetyofficer1@transitops.com', password_hash: hashedPassword, role_id: roleSafetyOfficer.id },
    { name: 'Frank Safety 2', email: 'safetyofficer2@transitops.com', password_hash: hashedPassword, role_id: roleSafetyOfficer.id },
    
    { name: 'Grace Analyst 1', email: 'financialanalyst1@transitops.com', password_hash: hashedPassword, role_id: roleFinancialAnalyst.id },
    { name: 'Heidi Analyst 2', email: 'financialanalyst2@transitops.com', password_hash: hashedPassword, role_id: roleFinancialAnalyst.id },
  ];

  for (const userData of usersData) {
    await prisma.user.create({ data: userData });
  }

  console.log('Seeding vehicles...');
  const vehiclesData = [
    {
      registration_number: 'TX-1001',
      name_model: 'Ford Transit Cargo',
      type: 'Van',
      max_load_capacity: 1500.00,
      odometer: 24500.50,
      acquisition_cost: 32000.00,
      status: 'Available',
      region: 'Austin',
    },
    {
      registration_number: 'TX-1002',
      name_model: 'Freightliner Cascadia',
      type: 'Semi Truck',
      max_load_capacity: 18000.00,
      odometer: 120500.00,
      acquisition_cost: 145000.00,
      status: 'Available',
      region: 'Houston',
    },
    {
      registration_number: 'TX-1003',
      name_model: 'Isuzu NPR',
      type: 'Box Truck',
      max_load_capacity: 5500.00,
      odometer: 45200.75,
      acquisition_cost: 58000.00,
      status: 'Available',
      region: 'Dallas',
    },
    {
      registration_number: 'TX-1004',
      name_model: 'Chevrolet Express 3500',
      type: 'Van',
      max_load_capacity: 1800.00,
      odometer: 89100.20,
      acquisition_cost: 35000.00,
      status: 'InShop',
      region: 'San Antonio',
    },
    {
      registration_number: 'TX-1005',
      name_model: 'GMC Savana',
      type: 'Van',
      max_load_capacity: 1600.00,
      odometer: 210000.00,
      acquisition_cost: 28000.00,
      status: 'Retired',
      region: 'El Paso',
    },
  ];

  for (const vehicleData of vehiclesData) {
    await prisma.vehicle.create({ data: vehicleData });
  }

  console.log('Seeding drivers...');
  const driversData = [
    {
      name: 'John Doe',
      license_number: 'DL-998877',
      license_category: 'Class A CDL',
      license_expiry_date: new Date('2028-06-15'),
      contact_number: '512-555-0199',
      safety_score: 94.50,
      status: 'Available',
    },
    {
      name: 'Jane Smith',
      license_number: 'DL-665544',
      license_category: 'Class A CDL',
      license_expiry_date: new Date('2027-11-20'),
      contact_number: '713-555-0188',
      safety_score: 98.20,
      status: 'Available',
    },
    {
      name: 'Robert Johnson',
      license_number: 'DL-332211',
      license_category: 'Class B CDL',
      license_expiry_date: new Date('2029-01-10'),
      contact_number: '214-555-0177',
      safety_score: 88.00,
      status: 'Available',
    },
    {
      name: 'Michael Brown',
      license_number: 'DL-445566',
      license_category: 'Class C',
      license_expiry_date: new Date('2025-05-14'), // Expired
      contact_number: '210-555-0166',
      safety_score: 75.40,
      status: 'Suspended',
    },
    {
      name: 'Emily Davis',
      license_number: 'DL-778899',
      license_category: 'Class B CDL',
      license_expiry_date: new Date('2027-04-05'),
      contact_number: '915-555-0155',
      safety_score: 91.00,
      status: 'OffDuty',
    },
  ];

  for (const driverData of driversData) {
    await prisma.driver.create({ data: driverData });
  }

  console.log('Seeding completed successfully!');
  
  // Count records
  const roleCount = await prisma.role.count();
  const userCount = await prisma.user.count();
  const vehicleCount = await prisma.vehicle.count();
  const driverCount = await prisma.driver.count();

  console.log('=============================');
  console.log('SEEDING SUMMARY');
  console.log('=============================');
  console.log(`Roles:        ${roleCount}`);
  console.log(`Users:        ${userCount}`);
  console.log(`Vehicles:     ${vehicleCount}`);
  console.log(`Drivers:      ${driverCount}`);
  console.log('=============================');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
