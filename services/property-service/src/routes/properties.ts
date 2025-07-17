// services/property-service/src/routes/properties.ts
import express, { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Property, PropertyPhoto } from '../types/property';
import { Client } from '../types/client';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/property-images/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop();
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + extension);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Mock data with proper typing
let properties: Property[] = [];
let clients: Client[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    type: 'buyer',
    status: 'active',
    address: '123 Main St, City, State 12345',
    notes: 'Looking for 3-bedroom house',
    tags: ['first-time-buyer', 'urgent'],
    propertyInterests: [],
    transactions: [],
    source: 'referral',
    budget: {
      min: 200000,
      max: 400000,
      preApproved: true
    },
    timeline: {
      urgency: 'within-3-months'
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+1234567891',
    type: 'seller',
    status: 'active',
    address: '456 Oak Ave, City, State 12345',
    notes: 'Selling downtown condo',
    tags: ['investor'],
    propertyInterests: [],
    transactions: [],
    source: 'website',
    budget: {
      min: 300000,
      max: 600000
    },
    timeline: {
      urgency: 'flexible'
    },
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  }
];

// ===== CLIENT ROUTES =====

interface ClientStatsResponse {
  total: number;
  buyers: number;
  sellers: number;
  renters: number;
  landlords: number;
  active: number;
  inactive: number;
  closed: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

// GET /api/clients/stats
router.get('/clients/stats', async (req: Request, res: Response) => {
  try {
    console.log('📊 Getting client stats...');
    
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    
    clients.forEach(client => {
      byType[client.type] = (byType[client.type] || 0) + 1;
      byStatus[client.status] = (byStatus[client.status] || 0) + 1;
    });
    
    const stats: ClientStatsResponse = {
      total: clients.length,
      buyers: clients.filter(c => c.type === 'buyer').length,
      sellers: clients.filter(c => c.type === 'seller').length,
      renters: clients.filter(c => c.type === 'renter').length,
      landlords: clients.filter(c => c.type === 'landlord').length,
      active: clients.filter(c => c.status === 'active').length,
      inactive: clients.filter(c => c.status === 'inactive').length,
      closed: clients.filter(c => c.status === 'closed').length,
      byType,
      byStatus
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/clients
router.get('/clients', async (req: Request, res: Response) => {
  try {
    console.log('📋 Getting all clients...');
    const { page = '1', limit = '20', search, type, status } = req.query;
    
    let filteredClients = [...clients];

    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredClients = filteredClients.filter(c => 
        c.firstName.toLowerCase().includes(searchLower) ||
        c.lastName.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchLower)
      );
    }

    if (type && typeof type === 'string') {
      filteredClients = filteredClients.filter(c => c.type === type);
    }

    if (status && typeof status === 'string') {
      filteredClients = filteredClients.filter(c => c.status === status);
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedClients = filteredClients.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedClients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredClients.length,
        pages: Math.ceil(filteredClients.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/clients
router.post('/clients', async (req: Request, res: Response) => {
  try {
    console.log('📝 Creating client with data:', req.body);
    
    const {
      firstName,
      lastName,
      name,
      email,
      phone,
      type = 'buyer',
      status = 'active',
      address,
      notes,
      tags,
      source = 'direct',
      budget,
      timeline
    } = req.body;

    let clientFirstName = firstName;
    let clientLastName = lastName;
    
    if (!firstName && !lastName && name) {
      const nameParts = name.split(' ');
      clientFirstName = nameParts[0] || '';
      clientLastName = nameParts.slice(1).join(' ') || '';
    }

    if (!clientFirstName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName (or name), email'
      });
    }

    const existingClient = clients.find(c => c.email === email);
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client with this email already exists'
      });
    }

    const newClient: Client = {
      id: 'client-' + Date.now(),
      firstName: clientFirstName,
      lastName: clientLastName || '',
      email,
      phone: phone || '',
      type,
      status,
      address: address || '',
      notes: notes || '',
      tags: tags || [],
      propertyInterests: [],
      transactions: [],
      source,
      budget,
      timeline,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    clients.push(newClient);

    console.log('✅ Client created successfully:', newClient);

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: newClient
    });
  } catch (error) {
    console.error('❌ Error creating client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/clients/:id
router.get('/clients/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = clients.find(c => c.id === id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/clients/:id
router.put('/clients/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clientIndex = clients.findIndex(c => c.id === id);

    if (clientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    clients[clientIndex] = {
      ...clients[clientIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: clients[clientIndex]
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/clients/:id
router.delete('/clients/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clientIndex = clients.findIndex(c => c.id === id);

    if (clientIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    clients.splice(clientIndex, 1);

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== PROPERTY ROUTES =====

// GET /api/properties/stats
router.get('/properties/stats', async (req: Request, res: Response) => {
  try {
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    
    properties.forEach(property => {
      byStatus[property.status] = (byStatus[property.status] || 0) + 1;
      byType[property.type] = (byType[property.type] || 0) + 1;
    });
    
    const totalValue = properties.reduce((sum, p) => sum + p.price, 0);
    const averagePrice = properties.length > 0 ? totalValue / properties.length : 0;
    
    const stats = {
      total: properties.length,
      totalValue,
      averagePrice,
      favorites: properties.filter(p => p.isFavorite).length,
      byStatus,
      byType
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching property stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/properties
router.get('/properties', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', search, type, status, minPrice, maxPrice } = req.query;
    
    let filteredProperties = [...properties];

    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredProperties = filteredProperties.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    if (type && typeof type === 'string') {
      filteredProperties = filteredProperties.filter(p => p.type === type);
    }

    if (status && typeof status === 'string') {
      filteredProperties = filteredProperties.filter(p => p.status === status);
    }

    if (minPrice) {
      filteredProperties = filteredProperties.filter(p => p.price >= Number(minPrice));
    }

    if (maxPrice) {
      filteredProperties = filteredProperties.filter(p => p.price <= Number(maxPrice));
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedProperties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredProperties.length,
        pages: Math.ceil(filteredProperties.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/properties
router.post('/properties', upload.array('photos', 20), async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      price,
      type,
      status = 'active',
      bedrooms,
      bathrooms,
      squareFootage,
      address,
      city,
      state,
      zipCode,
      features,
      agentId
    } = req.body;

    if (!title || !description || !price || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, price, type'
      });
    }

    const photos: PropertyPhoto[] = req.files ? (req.files as Express.Multer.File[]).map(file => ({
      id: uuidv4(),
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/property-images/${file.filename}`,
      size: file.size
    })) : [];

    const newProperty: Property = {
      id: uuidv4(),
      title,
      description,
      price: Number(price),
      type,
      status,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      squareFootage: squareFootage ? Number(squareFootage) : undefined,
      address: {
        street: address || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || ''
      },
      features: features ? JSON.parse(features) : [],
      photos,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    properties.push(newProperty);

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: newProperty
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create property',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/properties/:id
router.get('/properties/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const property = properties.find(p => p.id === id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;