const prisma = require('../prisma/client');

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const drivers = await prisma.driver.findMany({
      where: filter,
    });
    return res.json(drivers);
  } catch (error) {
    console.error('Fetch drivers error:', error);
    return res.status(500).json({ error: 'Failed to retrieve drivers.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        trips: true,
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found.' });
    }
    return res.json(driver);
  } catch (error) {
    console.error('Fetch driver by ID error:', error);
    return res.status(500).json({ error: 'Failed to retrieve driver details.' });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      name,
      license_number,
      license_category,
      license_expiry_date,
      contact_number,
      safety_score,
      status,
      userId,
    } = req.body;

    if (!name || !license_number || !license_category || !license_expiry_date || !contact_number || safety_score === undefined || !status) {
      return res.status(400).json({ error: 'All fields (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) are required.' });
    }

    const existing = await prisma.driver.findUnique({ where: { license_number } });
    if (existing) {
      return res.status(400).json({ error: 'License number already exists.' });
    }

    const data = {
      name,
      license_number,
      license_category,
      license_expiry_date: new Date(license_expiry_date),
      contact_number,
      safety_score: parseFloat(safety_score),
      status,
    };

    const driver = await prisma.driver.create({
      data,
    });

    return res.status(201).json(driver);
  } catch (error) {
    console.error('Create driver error:', error);
    return res.status(500).json({ error: 'Failed to create driver.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      license_number,
      license_category,
      license_expiry_date,
      contact_number,
      safety_score,
      status,
      userId,
    } = req.body;

    const existingDriver = await prisma.driver.findUnique({ where: { id } });
    if (!existingDriver) {
      return res.status(404).json({ error: 'Driver not found.' });
    }

    if (license_number && license_number !== existingDriver.license_number) {
      const duplicateLicense = await prisma.driver.findUnique({ where: { license_number } });
      if (duplicateLicense) {
        return res.status(400).json({ error: 'License number already in use by another driver.' });
      }
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (license_number !== undefined) data.license_number = license_number;
    if (license_category !== undefined) data.license_category = license_category;
    if (license_expiry_date !== undefined) data.license_expiry_date = new Date(license_expiry_date);
    if (contact_number !== undefined) data.contact_number = contact_number;
    if (safety_score !== undefined) data.safety_score = parseFloat(safety_score);
    if (status !== undefined) data.status = status;
    
    if (userId !== undefined) {
      // Driver model doesn't have userId relation in schema.prisma, skip
    }

    const driver = await prisma.driver.update({
      where: { id },
      data,
    });

    return res.json(driver);
  } catch (error) {
    console.error('Update driver error:', error);
    return res.status(500).json({ error: 'Failed to update driver.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.driver.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Driver not found.' });
    }

    await prisma.driver.delete({ where: { id } });
    return res.json({ message: 'Driver deleted successfully.' });
  } catch (error) {
    console.error('Delete driver error:', error);
    return res.status(500).json({ error: 'Failed to delete driver. Make sure the driver has no associated trips.' });
  }
};
