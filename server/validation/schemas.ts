import { z } from 'zod';

// ==========================================
// 1. AUTHENTICATION SCHEMAS
// ==========================================

export const authRegisterSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  storeName: z.string().optional().default('My Business Store'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const authLoginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
});

export const authDemoSchema = z.object({
  plan: z.string().optional().default('Pro')
}).optional();

export const authGoogleSchema = z.object({
  credential: z.string().optional(),
  idToken: z.string().optional()
}).refine(data => !!(data.credential || data.idToken), {
  message: 'Google credential or idToken is required'
});

export const authSaveSettingsSchema = z.object({
  name: z.string().optional(),
  storeName: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  plan: z.string().optional(),
  role: z.string().optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional()
});

export const authThemeSchema = z.object({
  theme: z.enum(['light', 'dark', 'system'])
});

export const authForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim()
});

export const authResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters')
});

// ==========================================
// 2. LEDGER ENTRIES SCHEMAS
// ==========================================

export const entryCreateSchema = z.object({
  date: z.string().optional(),
  productName: z.string().min(1, 'Product name is required').trim(),
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative').default(1),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  amount: z.coerce.number().optional(),
  type: z.enum(['sale', 'expense', 'credit']),
  customerName: z.string().optional().default('Walk-in Customer'),
  customerPhone: z.string().optional().default(''),
  status: z.enum(['paid', 'pending', 'udhaar', 'completed', 'cancelled']).optional().default('paid'),
  paymentMethod: z.string().optional().default('cash'),
  notes: z.string().optional().default(''),
  billUrl: z.string().optional().default('')
});

export const entryUpdateSchema = z.object({
  date: z.string().optional(),
  productName: z.string().min(1).trim().optional(),
  quantity: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0).optional(),
  amount: z.coerce.number().optional(),
  type: z.enum(['sale', 'expense', 'credit']).optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  status: z.enum(['paid', 'pending', 'udhaar', 'completed', 'cancelled']).optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  billUrl: z.string().optional()
});

// ==========================================
// 3. CUSTOMER MANAGEMENT SCHEMAS
// ==========================================

export const customerCreateSchema = z.object({
  name: z.string().min(1, 'Customer name is required').trim(),
  phone: z.string().min(1, 'Customer phone is required').trim(),
  email: z.string().email('Invalid email format').or(z.literal('')).optional().default(''),
  address: z.string().optional().default(''),
  balance: z.coerce.number().optional().default(0),
  totalSpent: z.coerce.number().optional().default(0),
  notes: z.string().optional().default('')
});

export const customerUpdateSchema = z.object({
  name: z.string().min(1).trim().optional(),
  phone: z.string().min(1).trim().optional(),
  email: z.string().email().or(z.literal('')).optional(),
  address: z.string().optional(),
  balance: z.coerce.number().optional(),
  totalSpent: z.coerce.number().optional(),
  riskLevel: z.enum(['Low', 'Medium', 'High']).optional(),
  notes: z.string().optional()
});

// ==========================================
// 4. INVENTORY SCHEMAS
// ==========================================

export const inventoryItemCreateSchema = z.object({
  name: z.string().min(1, 'Item name is required').trim(),
  sku: z.string().optional().default(''),
  barcode: z.string().optional().default(''),
  category: z.string().optional().default('General'),
  stock: z.coerce.number().min(0, 'Stock cannot be negative').default(0),
  minStock: z.coerce.number().min(0).optional().default(5),
  purchasePrice: z.coerce.number().min(0).optional().default(0),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be non-negative'),
  unit: z.string().optional().default('pcs'),
  supplier: z.string().optional().default(''),
  notes: z.string().optional().default('')
});

export const inventoryItemUpdateSchema = z.object({
  name: z.string().min(1).trim().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string().optional(),
  stock: z.coerce.number().min(0).optional(),
  minStock: z.coerce.number().min(0).optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
  unit: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional()
});

export const inventoryBulkCreateSchema = z.object({
  items: z.array(inventoryItemCreateSchema).min(1, 'Items array cannot be empty')
});

export const inventoryBulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'List of item IDs is required')
});

export const inventoryBulkCategorySchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'List of item IDs is required'),
  category: z.string().min(1, 'Category name is required').trim()
});

export const inventoryBulkPriceSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'List of item IDs is required'),
  changeType: z.enum(['percentage', 'flat']).optional(),
  value: z.coerce.number().optional(),
  percentage: z.coerce.number().optional(),
  fixedAmount: z.coerce.number().optional(),
  type: z.enum(['increase', 'decrease']).optional()
});

// ==========================================
// 5. UDHAAR / CREDIT RECOVERY SCHEMAS
// ==========================================

export const udhaarCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  customerName: z.string().min(1, 'Customer name is required').trim(),
  customerPhone: z.string().optional().default(''),
  amount: z.coerce.number().positive('Udhaar amount must be greater than zero'),
  dueDate: z.string().optional().default(''),
  notes: z.string().optional().default('')
});

export const udhaarCollectSchema = z.object({
  udhaarId: z.string().optional(),
  recordId: z.string().optional(),
  amountCollected: z.coerce.number().positive('Collected amount must be greater than zero').optional(),
  amount: z.coerce.number().positive('Collected amount must be greater than zero').optional(),
  paymentMethod: z.string().optional().default('cash'),
  notes: z.string().optional().default('')
}).refine(data => (data.udhaarId || data.recordId) && (data.amountCollected !== undefined || data.amount !== undefined), {
  message: 'Valid Udhaar ID and amount are required'
});

export const udhaarRemindSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  recordId: z.string().optional(),
  channel: z.enum(['whatsapp', 'sms']).optional().default('whatsapp')
});

// ==========================================
// 6. STORE MANAGEMENT SCHEMAS
// ==========================================

export const storeCreateSchema = z.object({
  name: z.string().min(1, 'Store name is required').trim(),
  type: z.string().optional().default('kirana'),
  currency: z.string().optional().default('INR'),
  address: z.string().optional().default(''),
  gstin: z.string().optional().default(''),
  phone: z.string().optional().default('')
});

export const storeUpdateSchema = z.object({
  name: z.string().min(1).trim().optional(),
  type: z.string().optional(),
  currency: z.string().optional(),
  address: z.string().optional(),
  gstin: z.string().optional(),
  phone: z.string().optional(),
  settings: z.record(z.string(), z.any()).optional()
});

export const storeMemberSchema = z.object({
  name: z.string().optional().default('Team Member'),
  email: z.string().email('Valid email address is required').toLowerCase().trim(),
  role: z.string().optional().default('Employee')
});

// ==========================================
// 7. INVOICE TEMPLATE SCHEMA
// ==========================================

export const invoiceTemplateSchema = z.object({
  themeColor: z.string().optional().default('#0f766e'),
  layout: z.string().optional().default('standard'),
  logoUrl: z.string().optional().default(''),
  footerText: z.string().optional().default(''),
  gstEnabled: z.boolean().optional().default(false),
  termsEnabled: z.boolean().optional().default(true)
});

// ==========================================
// 8. AI & SYNC SCHEMAS
// ==========================================

export const aiVoiceSchema = z.object({
  voiceTranscript: z.string().optional(),
  transcript: z.string().optional(),
  audioData: z.string().optional()
}).refine(data => data.voiceTranscript || data.transcript || data.audioData, {
  message: 'Either voiceTranscript, transcript, or audioData must be provided'
});

export const aiBillScannerSchema = z.object({
  imageBase64: z.string().min(1, 'Image data is required')
});

export const aiCoachSchema = z.object({
  messages: z.array(z.any()).optional(),
  prompt: z.string().optional(),
  message: z.string().optional()
}).refine(data => (Array.isArray(data.messages) && data.messages.length > 0) || !!data.prompt || !!data.message, {
  message: 'Messages array or message prompt is required'
});

export const offlineSyncSchema = z.object({
  entries: z.array(z.any()).optional().default([]),
  inventory: z.array(z.any()).optional().default([])
});
