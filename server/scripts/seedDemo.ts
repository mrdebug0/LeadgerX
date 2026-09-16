import bcrypt from 'bcryptjs';
import { connectDatabase, isMongoConnected } from '../config/db.js';
import { 
  UserModel, 
  StoreModel, 
  StoreMemberModel, 
  EntryModel, 
  CustomerModel, 
  InventoryModel, 
  UdhaarModel, 
  ActivityLogModel,
  InvoiceTemplateModel 
} from '../models/index.js';
import { LocalStore } from '../store.js';

export const DEMO_USER_ID = 'user-suresh';
export const DEMO_STORE_ID = 'store-suresh-primary';
export const DEMO_EMAIL = 'prashantmenaria7@gmail.com';

export async function runDemoSeeder() {
  console.log('🌱 [LeadgerX Demo Seeder] Initializing demo data seeding...');
  await connectDatabase();

  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUser = {
    id: DEMO_USER_ID,
    email: DEMO_EMAIL,
    name: 'Suresh Kumar',
    storeName: 'Suresh Kirana Store',
    passwordHash,
    role: 'Owner',
    plan: 'Pro',
    activeStoreId: DEMO_STORE_ID,
    themePreference: 'light',
    createdAt: new Date('2026-06-01T00:00:00Z')
  };

  const demoStore = {
    id: DEMO_STORE_ID,
    name: 'Suresh Kirana Store',
    type: 'kirana',
    ownerId: DEMO_USER_ID,
    userId: DEMO_USER_ID,
    address: 'Main Bazaar, Sector 4, Gandhinagar',
    gstin: '07AAAAA0000A1Z5',
    createdAt: new Date('2026-06-01T00:00:00Z')
  };

  const demoMember = {
    id: 'member-suresh-owner',
    storeId: DEMO_STORE_ID,
    userId: DEMO_USER_ID,
    name: 'Suresh Kumar',
    email: DEMO_EMAIL,
    role: 'Owner',
    permissions: ['*'],
    joinedAt: new Date('2026-06-01T00:00:00Z')
  };

  const demoCustomers = [
    {
      id: 'cust-1',
      storeId: DEMO_STORE_ID,
      name: 'Amit Singh',
      phone: '+91 98765 43210',
      email: 'amit.singh@gmail.com',
      outstandingBalance: 0,
      aiRiskScore: 12,
      aiRiskStatus: 'Low',
      aiRecoverySuggestions: [
        'Excellent payor. Offer seasonal festival discount.',
        'Consider expanding high-margin snack items to this customer.'
      ],
      purchaseCount: 15
    },
    {
      id: 'cust-2',
      storeId: DEMO_STORE_ID,
      name: 'Priya Sharma',
      phone: '+91 91234 56789',
      email: 'priya.sharma@hotmail.com',
      outstandingBalance: 1200,
      aiRiskScore: 38,
      aiRiskStatus: 'Medium',
      aiRecoverySuggestions: [
        'Gentle WhatsApp reminder on weekend.',
        'Suggest partial payment option next visit.'
      ],
      purchaseCount: 8
    },
    {
      id: 'cust-3',
      storeId: DEMO_STORE_ID,
      name: 'Rahul Kumar',
      phone: '+91 88888 77777',
      email: 'rahul.k@outlook.com',
      outstandingBalance: 450,
      aiRiskScore: 65,
      aiRiskStatus: 'Medium',
      aiRecoverySuggestions: [
        'Request pending payment clear before logging new udhaar.',
        'Set strict limit of ₹500 outstanding credit limit.'
      ],
      purchaseCount: 4
    }
  ];

  const demoEntries = [
    {
      id: 'e-1',
      storeId: DEMO_STORE_ID,
      userId: DEMO_USER_ID,
      customerName: 'Amit Singh',
      productName: 'Aashirvaad Atta 5kg',
      quantity: 2,
      price: 270,
      amount: 540,
      type: 'sale',
      status: 'paid',
      paymentMethod: 'cash',
      date: new Date('2026-06-09T10:30:00Z'),
      notes: 'Counter retail sale'
    },
    {
      id: 'e-2',
      storeId: DEMO_STORE_ID,
      userId: DEMO_USER_ID,
      customerName: 'Priya Sharma',
      productName: 'Amul Butter 100g',
      quantity: 3,
      price: 55,
      amount: 165,
      type: 'sale',
      status: 'udhaar',
      paymentMethod: 'credit',
      date: new Date('2026-06-09T14:45:00Z'),
      notes: 'Udhaar logged - pending collection'
    },
    {
      id: 'e-3',
      storeId: DEMO_STORE_ID,
      userId: DEMO_USER_ID,
      customerName: 'Rahul Kumar',
      productName: 'Tata Salt 1kg',
      quantity: 1,
      price: 25,
      amount: 25,
      type: 'sale',
      status: 'udhaar',
      paymentMethod: 'credit',
      date: new Date('2026-06-10T08:00:00Z'),
      notes: 'Regular customer credit'
    },
    {
      id: 'e-4',
      storeId: DEMO_STORE_ID,
      userId: DEMO_USER_ID,
      customerName: 'Self',
      productName: 'Shop Cleaning Supplies',
      quantity: 1,
      price: 350,
      amount: 350,
      type: 'expense',
      status: 'paid',
      paymentMethod: 'cash',
      date: new Date('2026-06-08T11:20:00Z'),
      notes: 'Shop maintenance & hygiene'
    },
    {
      id: 'e-5',
      storeId: DEMO_STORE_ID,
      userId: DEMO_USER_ID,
      customerName: 'Amit Singh',
      productName: 'Fortune Mustard Oil 1L',
      quantity: 2,
      price: 180,
      amount: 360,
      type: 'sale',
      status: 'paid',
      paymentMethod: 'upi',
      date: new Date('2026-06-10T09:15:00Z'),
      notes: 'UPI payment received via QR'
    }
  ];

  const demoInventory = [
    {
      id: 'inv-1',
      storeId: DEMO_STORE_ID,
      name: 'Aashirvaad Atta 5kg',
      sku: 'AA-5K',
      stock: 12,
      minStockAlert: 15,
      purchasePrice: 240,
      sellingPrice: 270,
      category: 'Grocery',
      supplierName: 'ITC Distributor',
      expiryDate: '2026-12-31'
    },
    {
      id: 'inv-2',
      storeId: DEMO_STORE_ID,
      name: 'Tata Salt 1kg',
      sku: 'TS-1K',
      stock: 3,
      minStockAlert: 10,
      purchasePrice: 21,
      sellingPrice: 25,
      category: 'Grocery',
      supplierName: 'Tata Foods Ltd',
      expiryDate: '2027-04-15'
    },
    {
      id: 'inv-3',
      storeId: DEMO_STORE_ID,
      name: 'Maggi Noodles',
      sku: 'MN-70',
      stock: 0,
      minStockAlert: 20,
      purchasePrice: 11,
      sellingPrice: 14,
      category: 'Packaged Foods',
      supplierName: 'Nestle Distribution',
      expiryDate: '2026-11-20'
    },
    {
      id: 'inv-4',
      storeId: DEMO_STORE_ID,
      name: 'Amul Butter 100g',
      sku: 'AB-100',
      stock: 24,
      minStockAlert: 8,
      purchasePrice: 48,
      sellingPrice: 55,
      category: 'Dairy',
      supplierName: 'Amul Distributor',
      expiryDate: '2026-07-15'
    },
    {
      id: 'inv-5',
      storeId: DEMO_STORE_ID,
      name: 'Fortune Mustard Oil 1L',
      sku: 'FMO-1',
      stock: 35,
      minStockAlert: 10,
      purchasePrice: 150,
      sellingPrice: 180,
      category: 'Oils',
      supplierName: 'Adani Wilmar Ltd',
      expiryDate: '2026-10-10'
    }
  ];

  const demoUdhaar = [
    {
      id: 'u-1',
      storeId: DEMO_STORE_ID,
      customerId: 'cust-2',
      customerName: 'Priya Sharma',
      amount: 1200,
      status: 'pending',
      dueDate: new Date('2026-06-25T00:00:00Z'),
      dateCreated: new Date('2026-06-09T14:45:00Z'),
      paymentHistory: []
    },
    {
      id: 'u-2',
      storeId: DEMO_STORE_ID,
      customerId: 'cust-3',
      customerName: 'Rahul Kumar',
      amount: 450,
      status: 'pending',
      dueDate: new Date('2026-06-25T00:00:00Z'),
      dateCreated: new Date('2026-06-10T08:00:00Z'),
      paymentHistory: []
    }
  ];

  const demoTemplate = {
    storeId: DEMO_STORE_ID,
    themeColor: '#0f766e',
    logoUrl: '',
    layout: 'standard',
    footerText: 'Thank you for shopping at Suresh Kirana Store! Visit again.',
    gstEnabled: true,
    termsEnabled: true
  };

  // Seed MongoDB if connected
  if (isMongoConnected()) {
    console.log('📦 Seeding into MongoDB collections...');
    await (UserModel as any).deleteMany({ email: DEMO_EMAIL });
    await (StoreModel as any).deleteMany({ ownerId: DEMO_USER_ID });
    await (StoreMemberModel as any).deleteMany({ storeId: DEMO_STORE_ID });
    await (EntryModel as any).deleteMany({ storeId: DEMO_STORE_ID });
    await (CustomerModel as any).deleteMany({ storeId: DEMO_STORE_ID });
    await (InventoryModel as any).deleteMany({ storeId: DEMO_STORE_ID });
    await (UdhaarModel as any).deleteMany({ storeId: DEMO_STORE_ID });
    await (InvoiceTemplateModel as any).deleteMany({ storeId: DEMO_STORE_ID });

    await (UserModel as any).create(demoUser);
    await (StoreModel as any).create(demoStore);
    await (StoreMemberModel as any).create(demoMember);
    await (EntryModel as any).insertMany(demoEntries);
    await (CustomerModel as any).insertMany(demoCustomers);
    await (InventoryModel as any).insertMany(demoInventory);
    await (UdhaarModel as any).insertMany(demoUdhaar);
    await (InvoiceTemplateModel as any).create(demoTemplate);
    console.log('✅ MongoDB Demo Seed complete.');
  }

  // Also seed / refresh LocalStore fallback safely
  LocalStore.updateAll(db => {
    // Upsert demo user
    db.users = (db.users || []).filter(u => u.email !== DEMO_EMAIL && u.id !== DEMO_USER_ID);
    db.users.push(demoUser as any);

    // Upsert demo store
    if (!db.stores) db.stores = [];
    db.stores = db.stores.filter(s => s.id !== DEMO_STORE_ID);
    db.stores.push(demoStore as any);

    // Upsert demo store member
    if (!db.storeMembers) db.storeMembers = [];
    db.storeMembers = db.storeMembers.filter(m => m.storeId !== DEMO_STORE_ID);
    db.storeMembers.push(demoMember as any);

    // Upsert demo entries
    db.entries = (db.entries || []).filter(e => e.storeId !== DEMO_STORE_ID);
    db.entries.push(...demoEntries.map(e => ({ ...e, date: e.date.toISOString() } as any)));

    // Upsert demo customers
    db.customers = (db.customers || []).filter(c => c.storeId !== DEMO_STORE_ID);
    db.customers.push(...demoCustomers as any);

    // Upsert demo inventory
    db.inventory = (db.inventory || []).filter(i => i.storeId !== DEMO_STORE_ID);
    db.inventory.push(...demoInventory as any);

    // Upsert demo udhaar
    db.udhaar = (db.udhaar || []).filter(u => u.storeId !== DEMO_STORE_ID);
    db.udhaar.push(...demoUdhaar.map(u => ({ ...u, dueDate: u.dueDate.toISOString(), dateCreated: u.dateCreated.toISOString() } as any)));

    // Upsert demo invoice template
    if (!db.invoiceTemplates) db.invoiceTemplates = [];
    db.invoiceTemplates = db.invoiceTemplates.filter(t => t.storeId !== DEMO_STORE_ID);
    db.invoiceTemplates.push(demoTemplate as any);
  });

  console.log('✅ [LeadgerX Demo Seeder] Demo dataset successfully seeded under store:', DEMO_STORE_ID);
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.includes('seedDemo')) {
  runDemoSeeder().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('❌ Seeder error:', err);
    process.exit(1);
  });
}
