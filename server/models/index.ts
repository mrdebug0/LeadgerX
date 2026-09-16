import mongoose, { Schema, model, Document } from 'mongoose';

// 1. Role Schema and Interface
export interface IRole extends Document {
  name: 'Owner' | 'Manager' | 'Employee' | 'Admin';
  permissions: string[];
}

export const RoleSchema = new Schema<IRole>({
  name: { type: String, required: true, enum: ['Owner', 'Manager', 'Employee', 'Admin'] },
  permissions: [{ type: String }]
});

export const RoleModel = mongoose.models.Role || model<IRole>('Role', RoleSchema);

// 2. User Schema and Interface
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  storeName: string;
  role: 'Owner' | 'Manager' | 'Employee' | 'Admin';
  plan: 'Free' | 'Pro';
  activeStoreId?: string;
  themePreference?: 'light' | 'dark' | 'system';
  createdAt: Date;
}

export const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  storeName: { type: String, default: 'LeadgerX Shop' },
  role: { type: String, enum: ['Owner', 'Manager', 'Employee', 'Admin'], default: 'Owner' },
  plan: { type: String, enum: ['Free', 'Pro'], default: 'Pro' },
  activeStoreId: { type: String },
  themePreference: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const UserModel = mongoose.models.User || model<IUser>('User', UserSchema);

// 3. Store Schema and Interface
export interface IStore extends Document {
  name: string;
  type: string; // "kirana", "medical", etc.
  ownerId: any;
  address?: string;
  gstin?: string;
  createdAt: Date;
}

export const StoreSchema = new Schema<IStore>({
  name: { type: String, required: true },
  type: { type: String, default: 'kirana' },
  ownerId: { type: Schema.Types.Mixed, ref: 'User', required: true, index: true },
  address: { type: String, default: '' },
  gstin: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const StoreModel = mongoose.models.Store || model<IStore>('Store', StoreSchema);

// 4. Entry Schema and Interface
export interface IEntry extends Document {
  storeId: any;
  userId: any;
  customerName: string;
  productName: string;
  quantity: number;
  price: number;
  amount: number;
  type: 'sale' | 'purchase' | 'expense' | 'income' | 'return';
  status: 'paid' | 'pending' | 'udhaar';
  paymentMethod: string;
  date: Date;
  notes?: string;
}

export const EntrySchema = new Schema<IEntry>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', required: true, index: true },
  userId: { type: Schema.Types.Mixed, ref: 'User', index: true },
  customerName: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 },
  type: { type: String, enum: ['sale', 'purchase', 'expense', 'income', 'return'], required: true },
  status: { type: String, enum: ['paid', 'pending', 'udhaar'], default: 'paid' },
  paymentMethod: { type: String, default: 'cash' },
  date: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const EntryModel = mongoose.models.Entry || model<IEntry>('Entry', EntrySchema);

// 5. Customer Schema and Interface
export interface ICustomer extends Document {
  storeId: any;
  name: string;
  phone: string;
  email?: string;
  outstandingBalance: number;
  aiRiskScore: number;
  aiRiskStatus: 'Low' | 'Medium' | 'High';
  aiRecoverySuggestions: string[];
  purchaseCount: number;
  tags?: string[];
  notes?: string;
}

export const CustomerSchema = new Schema<ICustomer>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  outstandingBalance: { type: Number, default: 0 },
  aiRiskScore: { type: Number, default: 20 },
  aiRiskStatus: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  aiRecoverySuggestions: [{ type: String }],
  purchaseCount: { type: Number, default: 0 },
  tags: [{ type: String }],
  notes: { type: String, default: '' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const CustomerModel = mongoose.models.Customer || model<ICustomer>('Customer', CustomerSchema);

// 6. Inventory Schema and Interface
export interface IInventory extends Document {
  storeId: any;
  name: string;
  sku?: string;
  category: string;
  stock: number;
  minStock: number;
  minStockAlert?: number;
  price: number;
  sellingPrice?: number;
  purchasePrice?: number;
  expiryDate?: any;
  supplierName?: string;
  barcode?: string;
  qrCode?: string;
}

export const InventorySchema = new Schema<IInventory>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', required: true, index: true },
  name: { type: String, required: true },
  sku: { type: String, default: '' },
  category: { type: String, required: true, default: 'General' },
  stock: { type: Number, required: true, default: 0 },
  minStockAlert: { type: Number, required: true, default: 5 },
  minStock: { type: Number, required: true, default: 5 },
  price: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 },
  expiryDate: { type: Schema.Types.Mixed },
  supplierName: { type: String, default: '' },
  barcode: { type: String, default: '' },
  qrCode: { type: String, default: '' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const InventoryModel = mongoose.models.Inventory || model<IInventory>('Inventory', InventorySchema);

// 7. Supplier Schema and Interface
export interface ISupplier extends Document {
  storeId: any;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  outstandingBalance: number;
}

export const SupplierSchema = new Schema<ISupplier>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', required: true, index: true },
  name: { type: String, required: true },
  contactPerson: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  outstandingBalance: { type: Number, default: 0 }
});

export const SupplierModel = mongoose.models.Supplier || model<ISupplier>('Supplier', SupplierSchema);

// 8. Transaction Schema and Interface
export interface ITransaction extends Document {
  storeId: any;
  refId: string; // e-id or custom-id
  amount: number;
  type: 'credit' | 'debit';
  timestamp: Date;
  details: string;
}

export const TransactionSchema = new Schema<ITransaction>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', required: true, index: true },
  refId: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: String, required: true }
});

export const TransactionModel = mongoose.models.Transaction || model<ITransaction>('Transaction', TransactionSchema);

// 9. Udhaar Ledger Schema and Interface
export interface IUdhaar extends Document {
  storeId: any;
  customerId: any;
  customerName: string;
  totalAmount: number;
  pendingAmount: number;
  amount: number;
  dueDate?: any;
  dateCreated?: any;
  status: 'active' | 'settled' | 'pending';
  lastPaymentDate?: any;
  paymentHistory: {
    date: any;
    amount: number;
    method?: string;
    notes?: string;
    receivedBy?: string;
  }[];
}

export const UdhaarSchema = new Schema<IUdhaar>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', required: true, index: true },
  customerId: { type: Schema.Types.Mixed, ref: 'Customer', index: true },
  customerName: { type: String, required: true },
  amount: { type: Number, required: true },
  totalAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  dueDate: { type: Schema.Types.Mixed },
  dateCreated: { type: Schema.Types.Mixed, default: Date.now },
  status: { type: String, enum: ['active', 'settled', 'pending'], default: 'pending' },
  lastPaymentDate: { type: Schema.Types.Mixed },
  paymentHistory: [{
    date: { type: Schema.Types.Mixed, default: Date.now },
    amount: { type: Number, required: true },
    method: { type: String, default: 'cash' },
    notes: { type: String, default: '' },
    receivedBy: { type: String, default: '' }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const UdhaarModel = mongoose.models.Udhaar || model<IUdhaar>('Udhaar', UdhaarSchema);

// 10. Notification Schema and Interface
export interface INotification extends Document {
  userId?: any;
  storeId?: any;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.Mixed, ref: 'User', index: true },
  storeId: { type: Schema.Types.Mixed, ref: 'Store', index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'SYSTEM' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const NotificationModel = mongoose.models.Notification || model<INotification>('Notification', NotificationSchema);

// 11. Report Schema and Interface
export interface IReport extends Document {
  storeId: any;
  type: 'sales' | 'udhaar' | 'inventory' | 'profit';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  downloadUrl?: string;
  createdAt: Date;
}

export const ReportSchema = new Schema<IReport>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', required: true, index: true },
  type: { type: String, enum: ['sales', 'udhaar', 'inventory', 'profit'], required: true },
  period: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
  downloadUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const ReportModel = mongoose.models.Report || model<IReport>('Report', ReportSchema);

// 12. ChatHistory Schema and Interface
export interface IChatHistory extends Document {
  userId: any;
  messages: { role: 'user' | 'assistant'; content: string; timestamp: Date }[];
  updatedAt: Date;
}

export const ChatHistorySchema = new Schema<IChatHistory>({
  userId: { type: Schema.Types.Mixed, ref: 'User', required: true, index: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  updatedAt: { type: Date, default: Date.now }
});

export const ChatHistoryModel = mongoose.models.ChatHistory || model<IChatHistory>('ChatHistory', ChatHistorySchema);

// 13. AIInsight Schema and Interface
export interface IAIInsight extends Document {
  storeId: any;
  metricName: string;
  recommendation: string;
  importance: 'high' | 'medium' | 'low';
  createdAt: Date;
}

export const AIInsightSchema = new Schema<IAIInsight>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', required: true, index: true },
  metricName: { type: String, required: true },
  recommendation: { type: String, required: true },
  importance: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  createdAt: { type: Date, default: Date.now }
});

export const AIInsightModel = mongoose.models.AIInsight || model<IAIInsight>('AIInsight', AIInsightSchema);

// 14. ActivityLog Schema and Interface
export interface IActivityLog extends Document {
  userId: any;
  userName: string;
  action: string;
  details: string;
  storeId: any;
  timestamp: Date;
}

export const ActivityLogSchema = new Schema<IActivityLog>({
  userId: { type: Schema.Types.Mixed, ref: 'User' },
  userName: { type: String, default: 'System' },
  action: { type: String, required: true },
  details: { type: String, required: true },
  storeId: { type: Schema.Types.Mixed, ref: 'Store', index: true },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const ActivityLogModel = mongoose.models.ActivityLog || model<IActivityLog>('ActivityLog', ActivityLogSchema);

// 15. SystemSettings Schema and Interface
export interface ISystemSettings extends Document {
  storeId: any;
  gstinEnabled: boolean;
  termsEnabled: boolean;
  termsText: string;
  whatsappAutomation: boolean;
  themeColor: string;
}

export const SystemSettingsSchema = new Schema<ISystemSettings>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', unique: true, required: true, index: true },
  gstinEnabled: { type: Boolean, default: true },
  termsEnabled: { type: Boolean, default: true },
  termsText: { type: String, default: 'Computer-generated billing. Goods once sold cannot be returned.' },
  whatsappAutomation: { type: Boolean, default: true },
  themeColor: { type: String, default: '#0f766e' }
});

export const SystemSettingsModel = mongoose.models.SystemSettings || model<ISystemSettings>('SystemSettings', SystemSettingsSchema);

// 16. StoreMember Schema and Interface
export interface IStoreMember extends Document {
  storeId: any;
  userId: any;
  name?: string;
  email?: string;
  role: 'Owner' | 'Manager' | 'Employee' | 'Accountant' | 'Admin';
  permissions: string[];
  invitedBy?: any;
  joinedAt: Date;
}

export const StoreMemberSchema = new Schema<IStoreMember>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', required: true, index: true },
  userId: { type: Schema.Types.Mixed, ref: 'User', required: true, index: true },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  role: { type: String, enum: ['Owner', 'Manager', 'Employee', 'Accountant', 'Admin'], default: 'Employee' },
  permissions: [{ type: String }],
  invitedBy: { type: Schema.Types.Mixed, ref: 'User' },
  joinedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const StoreMemberModel = mongoose.models.StoreMember || model<IStoreMember>('StoreMember', StoreMemberSchema);

// 17. InventoryMovement Schema and Interface
export interface IInventoryMovement extends Document {
  storeId: any;
  productId: any;
  productName: string;
  quantityChange: number;
  type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'loss';
  referenceId?: string;
  notes?: string;
  createdBy?: any;
  createdAt: Date;
}

export const InventoryMovementSchema = new Schema<IInventoryMovement>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', required: true, index: true },
  productId: { type: Schema.Types.Mixed, ref: 'Inventory', required: true, index: true },
  productName: { type: String, required: true },
  quantityChange: { type: Number, required: true },
  type: { type: String, enum: ['sale', 'purchase', 'adjustment', 'return', 'loss'], required: true },
  referenceId: { type: String },
  notes: { type: String },
  createdBy: { type: Schema.Types.Mixed, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export const InventoryMovementModel = mongoose.models.InventoryMovement || model<IInventoryMovement>('InventoryMovement', InventoryMovementSchema);

// 18. Payment & Udhaar Transaction Schema and Interface
export interface IPayment extends Document {
  storeId: any;
  customerId?: any;
  customerName?: string;
  supplierId?: any;
  supplierName?: string;
  udhaarId?: any;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque';
  type: 'collection' | 'settlement' | 'disbursement';
  date: Date;
  referenceNumber?: string;
  notes?: string;
  receivedBy?: any;
}

export const PaymentSchema = new Schema<IPayment>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', required: true, index: true },
  customerId: { type: Schema.Types.Mixed, ref: 'Customer' },
  customerName: { type: String },
  supplierId: { type: Schema.Types.Mixed, ref: 'Supplier' },
  supplierName: { type: String },
  udhaarId: { type: Schema.Types.Mixed, ref: 'Udhaar' },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque'], default: 'cash' },
  type: { type: String, enum: ['collection', 'settlement', 'disbursement'], default: 'collection' },
  date: { type: Date, default: Date.now },
  referenceNumber: { type: String },
  notes: { type: String },
  receivedBy: { type: Schema.Types.Mixed, ref: 'User' }
});

export const PaymentModel = mongoose.models.Payment || model<IPayment>('Payment', PaymentSchema);

// 19. AI Conversation and Message Models
export interface IAIConversation extends Document {
  storeId: any;
  userId: any;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export const AIConversationSchema = new Schema<IAIConversation>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', required: true, index: true },
  userId: { type: Schema.Types.Mixed, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New Business Session' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const AIConversationModel = mongoose.models.AIConversation || model<IAIConversation>('AIConversation', AIConversationSchema);

export interface IAIMessage extends Document {
  conversationId: any;
  role: 'user' | 'assistant';
  content: string;
  metricsContext?: string;
  createdAt: Date;
}

export const AIMessageSchema = new Schema<IAIMessage>({
  conversationId: { type: Schema.Types.Mixed, ref: 'AIConversation', required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  metricsContext: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const AIMessageModel = mongoose.models.AIMessage || model<IAIMessage>('AIMessage', AIMessageSchema);

// 20. InvoiceTemplate Schema and Interface
export interface IInvoiceTemplate extends Document {
  storeId: any;
  themeColor: string;
  businessTitle: string;
  address: string;
  phone: string;
  gstin: string;
  termsAndConditions: string;
  footerNote: string;
  logoUrl?: string;
  showGst: boolean;
  showQrCode: boolean;
  updatedAt: Date;
}

export const InvoiceTemplateSchema = new Schema<IInvoiceTemplate>({
  storeId: { type: Schema.Types.Mixed, ref: 'Store', required: true, unique: true, index: true },
  themeColor: { type: String, default: '#000000' },
  businessTitle: { type: String, default: 'LeadgerX Kirana Store' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  gstin: { type: String, default: '' },
  termsAndConditions: { type: String, default: 'Computer-generated bill. Goods once sold cannot be returned.' },
  footerNote: { type: String, default: 'Thank you for shopping with us! Visit again.' },
  logoUrl: { type: String, default: '' },
  showGst: { type: Boolean, default: true },
  showQrCode: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export const InvoiceTemplateModel = mongoose.models.InvoiceTemplate || model<IInvoiceTemplate>('InvoiceTemplate', InvoiceTemplateSchema);

