const prisma = require('../prisma/client');

const getStatus = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  
  if (exp < today) return 'Expired';
  
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 30) return 'Expiring Soon';
  
  return 'Active';
};

exports.getAll = async (req, res) => {
  try {
    const { vehicle_id } = req.query;
    const filter = {};
    if (vehicle_id) filter.vehicle_id = vehicle_id;

    const documents = await prisma.vehicleDocument.findMany({
      where: filter,
      orderBy: { expiry_date: 'asc' }
    });

    // Check if status needs to be updated on-the-fly (e.g. if time has passed)
    const updatedDocs = await Promise.all(documents.map(async (doc) => {
      const currentCalculatedStatus = getStatus(doc.expiry_date);
      if (doc.status !== currentCalculatedStatus) {
        return await prisma.vehicleDocument.update({
          where: { id: doc.id },
          data: { status: currentCalculatedStatus }
        });
      }
      return doc;
    }));

    return res.json(updatedDocs);
  } catch (error) {
    console.error('Fetch vehicle documents error:', error);
    return res.status(500).json({ error: 'Failed to retrieve vehicle documents.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await prisma.vehicleDocument.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Re-verify status on retrieve
    const currentStatus = getStatus(document.expiry_date);
    if (document.status !== currentStatus) {
      const updated = await prisma.vehicleDocument.update({
        where: { id },
        data: { status: currentStatus }
      });
      return res.json(updated);
    }

    return res.json(document);
  } catch (error) {
    console.error('Fetch document by ID error:', error);
    return res.status(500).json({ error: 'Failed to retrieve document details.' });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      vehicle_id,
      document_type,
      document_number,
      issue_date,
      expiry_date,
      file_path
    } = req.body;

    if (!vehicle_id || !document_type || !document_number || !issue_date || !expiry_date) {
      return res.status(400).json({ error: 'All fields (vehicle_id, document_type, document_number, issue_date, expiry_date) are required.' });
    }

    // Validate vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Associated vehicle not found.' });
    }

    const status = getStatus(expiry_date);

    const doc = await prisma.vehicleDocument.create({
      data: {
        vehicle_id,
        document_type,
        document_number,
        issue_date: new Date(issue_date),
        expiry_date: new Date(expiry_date),
        file_path: file_path || null,
        status
      }
    });

    return res.status(201).json(doc);
  } catch (error) {
    console.error('Create document error:', error);
    return res.status(500).json({ error: 'Failed to add vehicle document.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      document_type,
      document_number,
      issue_date,
      expiry_date,
      file_path
    } = req.body;

    const existing = await prisma.vehicleDocument.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const data = {};
    if (document_type !== undefined) data.document_type = document_type;
    if (document_number !== undefined) data.document_number = document_number;
    if (issue_date !== undefined) data.issue_date = new Date(issue_date);
    if (expiry_date !== undefined) {
      data.expiry_date = new Date(expiry_date);
      data.status = getStatus(expiry_date);
    }
    if (file_path !== undefined) data.file_path = file_path;

    const updated = await prisma.vehicleDocument.update({
      where: { id },
      data
    });

    return res.json(updated);
  } catch (error) {
    console.error('Update document error:', error);
    return res.status(500).json({ error: 'Failed to update vehicle document.' });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.vehicleDocument.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    await prisma.vehicleDocument.delete({ where: { id } });
    return res.json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({ error: 'Failed to delete vehicle document.' });
  }
};
