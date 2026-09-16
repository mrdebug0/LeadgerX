import mongoose from 'mongoose';
import { LocalStore } from '../store.js';
import { isMongoConnected } from '../config/db.js';
import {
  UserModel,
  StoreModel,
  StoreMemberModel,
  EntryModel,
  CustomerModel,
  InventoryModel,
  UdhaarModel,
  ActivityLogModel,
  NotificationModel,
  InvoiceTemplateModel
} from '../models/index.js';

// Type-safe model aliases to prevent Mongoose v8 query union overload issues
const User: any = UserModel;
const Store: any = StoreModel;
const StoreMember: any = StoreMemberModel;
const Entry: any = EntryModel;
const Customer: any = CustomerModel;
const Inventory: any = InventoryModel;
const Udhaar: any = UdhaarModel;
const ActivityLog: any = ActivityLogModel;
const Notification: any = NotificationModel;
const InvoiceTemplate: any = InvoiceTemplateModel;

export interface EntryFilter {
  search?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}

// Convert Mongoose document or lean object to clean LeadgerX record with string id
function toRecord<T = any>(doc: any): T {
  if (!doc) return null as any;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : (obj.id || '')
  };
}

function toRecords<T = any>(docs: any[]): T[] {
  if (!Array.isArray(docs)) return [];
  return docs.map(toRecord);
}

function buildStoreFilter(storeId: string): any {
  if (!storeId) return {};
  if (mongoose.Types.ObjectId.isValid(storeId)) {
    return {
      $or: [
        { storeId: storeId },
        { storeId: new mongoose.Types.ObjectId(storeId) }
      ]
    };
  }
  return { storeId };
}

function buildIdQuery(id: string, storeId?: string): any {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const conditions: any[] = [{ id }];
  if (isObjectId) {
    conditions.push({ _id: new mongoose.Types.ObjectId(id) });
    conditions.push({ _id: id });
  } else {
    conditions.push({ _id: id });
  }
  const filter: any = { $or: conditions };
  if (storeId) {
    if (mongoose.Types.ObjectId.isValid(storeId)) {
      filter.$and = [
        {
          $or: [
            { storeId: storeId },
            { storeId: new mongoose.Types.ObjectId(storeId) }
          ]
        }
      ];
    } else {
      filter.storeId = storeId;
    }
  }
  return filter;
}

export const dal = {
  users: {
    async findById(id: string) {
      if (isMongoConnected()) {
        const query = buildIdQuery(id);
        const doc = await User.findOne(query).lean();
        return toRecord(doc);
      }
      const db = LocalStore.getAll();
      return db.users.find(u => u.id === id) || null;
    },

    async findByEmail(email: string) {
      const lower = email.toLowerCase().trim();
      if (isMongoConnected()) {
        const doc = await User.findOne({ email: lower }).lean();
        return toRecord(doc);
      }
      const db = LocalStore.getAll();
      return db.users.find(u => u.email.toLowerCase().trim() === lower) || null;
    },

    async create(userData: any) {
      if (isMongoConnected()) {
        const doc = await User.create({
          name: userData.name,
          email: userData.email.toLowerCase().trim(),
          passwordHash: userData.passwordHash,
          storeName: userData.storeName || 'LeadgerX Shop',
          role: userData.role || 'Owner',
          plan: userData.plan || 'Pro',
          activeStoreId: userData.activeStoreId,
          createdAt: new Date()
        });
        return toRecord(doc);
      }

      const id = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payload = {
        id,
        email: userData.email.toLowerCase().trim(),
        name: userData.name,
        passwordHash: userData.passwordHash,
        storeName: userData.storeName || 'My Kirana Store',
        role: userData.role || 'Owner',
        plan: userData.plan || 'Pro',
        createdAt: new Date().toISOString()
      };

      LocalStore.updateAll(db => {
        db.users.push(payload as any);
      });
      return payload;
    },

    async update(id: string, updates: any) {
      if (isMongoConnected()) {
        const query = buildIdQuery(id);
        const doc = await User.findOneAndUpdate(query, updates, { returnDocument: 'after' }).lean();
        return toRecord(doc);
      }

      let updatedUser: any = null;
      LocalStore.updateAll(db => {
        const idx = db.users.findIndex(u => u.id === id);
        if (idx !== -1) {
          db.users[idx] = { ...db.users[idx], ...updates };
          updatedUser = db.users[idx];
        }
      });
      return updatedUser;
    },

    async delete(id: string) {
      if (isMongoConnected()) {
        const query = buildIdQuery(id);
        await User.deleteOne(query);
        return true;
      }

      LocalStore.updateAll(db => {
        db.users = db.users.filter(u => u.id !== id);
      });
      return true;
    }
  },

  stores: {
    async findByUser(userId: string) {
      if (isMongoConnected()) {
        const isObjectId = mongoose.Types.ObjectId.isValid(userId);
        const orConditions: any[] = [{ ownerId: userId }, { userId }];
        if (isObjectId) {
          orConditions.push({ ownerId: new mongoose.Types.ObjectId(userId) });
        }
        const docs = await Store.find({ $or: orConditions }).lean();
        if (docs.length > 0) {
          return toRecords(docs);
        }

        // Auto-initialize default store in MongoDB if none found
        const user = await dal.users.findById(userId);
        const defaultStore = await Store.create({
          name: user?.storeName || 'LeadgerX Main Store',
          type: 'kirana',
          ownerId: userId,
          address: '',
          gstin: '',
          createdAt: new Date()
        });
        return [toRecord(defaultStore)];
      }

      const db = LocalStore.getAll();
      const stores = (db.stores || []).filter(s => s.ownerId === userId || s.userId === userId);
      if (stores.length === 0) {
        const user = db.users.find(u => u.id === userId);
        const defaultStore = {
          id: `store-${userId}`,
          name: user?.storeName || 'LeadgerX Main Store',
          type: 'kirana',
          ownerId: userId,
          userId: userId,
          address: '',
          gstin: '',
          createdAt: new Date().toISOString()
        };
        LocalStore.updateAll(state => {
          if (!state.stores) state.stores = [];
          state.stores.push(defaultStore);
        });
        return [defaultStore];
      }
      return stores;
    },

    async findById(storeId: string) {
      if (isMongoConnected()) {
        const query = buildIdQuery(storeId);
        const doc = await Store.findOne(query).lean();
        return toRecord(doc);
      }
      const db = LocalStore.getAll();
      return (db.stores || []).find(s => s.id === storeId) || null;
    },

    async create(storeData: any) {
      if (isMongoConnected()) {
        const doc = await Store.create({
          name: storeData.name,
          type: storeData.type || 'kirana',
          ownerId: storeData.ownerId,
          address: storeData.address || '',
          gstin: storeData.gstin || '',
          createdAt: new Date()
        });
        return toRecord(doc);
      }

      const id = `store-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payload = {
        id,
        name: storeData.name,
        type: storeData.type || 'kirana',
        ownerId: storeData.ownerId,
        userId: storeData.ownerId,
        address: storeData.address || '',
        gstin: storeData.gstin || '',
        createdAt: new Date().toISOString()
      };

      LocalStore.updateAll(db => {
        if (!db.stores) db.stores = [];
        db.stores.push(payload);
      });
      return payload;
    },

    async update(storeId: string, updates: any) {
      if (isMongoConnected()) {
        const query = buildIdQuery(storeId);
        const doc = await Store.findOneAndUpdate(query, updates, { returnDocument: 'after' }).lean();
        return toRecord(doc);
      }

      let updated: any = null;
      LocalStore.updateAll(db => {
        if (!db.stores) db.stores = [];
        const idx = db.stores.findIndex(s => s.id === storeId);
        if (idx !== -1) {
          db.stores[idx] = { ...db.stores[idx], ...updates };
          updated = db.stores[idx];
        }
      });
      return updated;
    },

    async delete(storeId: string) {
      if (isMongoConnected()) {
        const query = buildIdQuery(storeId);
        await Store.deleteOne(query);
        return true;
      }

      LocalStore.updateAll(db => {
        if (db.stores) {
          db.stores = db.stores.filter(s => s.id !== storeId);
        }
      });
      return true;
    }
  },

  storeMembers: {
    async findByStore(storeId: string) {
      if (isMongoConnected()) {
        const docs = await StoreMember.find({ storeId }).lean();
        return toRecords(docs);
      }
      const db = LocalStore.getAll();
      return (db.storeMembers || []).filter(m => m.storeId === storeId);
    },

    async findMembership(storeId: string, userId: string) {
      if (isMongoConnected()) {
        const doc = await StoreMember.findOne({ storeId, userId }).lean();
        return toRecord(doc);
      }
      const db = LocalStore.getAll();
      return (db.storeMembers || []).find(m => m.storeId === storeId && m.userId === userId) || null;
    },

    async add(storeId: string, memberData: any) {
      if (isMongoConnected()) {
        const doc = await StoreMember.create({
          storeId,
          userId: memberData.userId,
          name: memberData.name || '',
          email: memberData.email || '',
          role: memberData.role || 'Employee',
          permissions: memberData.permissions || ['*'],
          joinedAt: new Date()
        });
        return toRecord(doc);
      }

      const id = `member-${Date.now()}`;
      const payload = {
        id,
        storeId,
        userId: memberData.userId,
        name: memberData.name || '',
        email: memberData.email || '',
        role: memberData.role || 'Employee',
        permissions: memberData.permissions || ['read_entries', 'create_entries'],
        joinedAt: new Date().toISOString()
      };

      LocalStore.updateAll(db => {
        if (!db.storeMembers) db.storeMembers = [];
        db.storeMembers.push(payload);
      });
      return payload;
    },

    async remove(storeId: string, memberId: string) {
      if (isMongoConnected()) {
        const query = buildIdQuery(memberId, storeId);
        await StoreMember.deleteOne(query);
        return true;
      }

      LocalStore.updateAll(db => {
        if (db.storeMembers) {
          db.storeMembers = db.storeMembers.filter(m => m.id !== memberId && m.userId !== memberId);
        }
      });
      return true;
    }
  },

  entries: {
    async find(storeId: string, userId: string, filters: EntryFilter = {}) {
      if (isMongoConnected()) {
        const query: any = { ...buildStoreFilter(storeId) };
        if (filters.search) {
          const regex = new RegExp(filters.search.trim(), 'i');
          query.$or = [
            { customerName: regex },
            { productName: regex },
            { notes: regex }
          ];
        }
        if (filters.type && filters.type !== 'all') {
          query.type = filters.type;
        }
        if (filters.status && filters.status !== 'all') {
          query.status = filters.status;
        }
        if (filters.startDate || filters.endDate) {
          query.date = {};
          if (filters.startDate) query.date.$gte = new Date(filters.startDate);
          if (filters.endDate) query.date.$lte = new Date(filters.endDate);
        }

        const docs = await Entry.find(query).sort({ date: -1 }).lean();
        return toRecords(docs);
      }

      const db = LocalStore.getAll();
      let entries = (db.entries || []).filter(e => e.storeId === storeId);

      if (filters.search) {
        const q = filters.search.toLowerCase();
        entries = entries.filter(e =>
          e.customerName.toLowerCase().includes(q) ||
          e.productName.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
        );
      }

      if (filters.type && filters.type !== 'all') {
        entries = entries.filter(e => e.type === filters.type);
      }

      if (filters.status && filters.status !== 'all') {
        entries = entries.filter(e => e.status === filters.status);
      }

      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        entries = entries.filter(e => new Date(e.date).getTime() >= start);
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime();
        entries = entries.filter(e => new Date(e.date).getTime() <= end);
      }

      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return entries;
    },

    async findById(id: string, storeId: string) {
      if (isMongoConnected()) {
        const query = buildIdQuery(id, storeId);
        const doc = await Entry.findOne(query).lean();
        return toRecord(doc);
      }

      const db = LocalStore.getAll();
      return (db.entries || []).find(e => e.id === id && e.storeId === storeId) || null;
    },

    async create(entryData: any) {
      const price = Number(entryData.price) || 0;
      const quantity = Number(entryData.quantity) || 1;
      const amount = Number(entryData.amount) || (price * quantity);

      if (isMongoConnected()) {
        const doc = await Entry.create({
          storeId: entryData.storeId,
          userId: entryData.userId,
          customerName: entryData.customerName?.trim() || 'Self',
          productName: entryData.productName?.trim() || 'General Items',
          quantity,
          price,
          amount,
          type: entryData.type || 'sale',
          status: entryData.status || 'paid',
          paymentMethod: entryData.paymentMethod || 'cash',
          date: entryData.date ? new Date(entryData.date) : new Date(),
          notes: entryData.notes || ''
        });

        // 1. Update Inventory stock in MongoDB
        if (entryData.productName) {
          const invItem = await Inventory.findOne({
            storeId: entryData.storeId,
            name: { $regex: new RegExp(`^${entryData.productName.trim()}$`, 'i') }
          });
          if (invItem) {
            if (doc.type === 'sale') {
              invItem.stock = Math.max(0, invItem.stock - quantity);
            } else if (doc.type === 'purchase' || doc.type === 'return') {
              invItem.stock += quantity;
            }
            await invItem.save();
          }
        }

        // 2. Update Customer & Udhaar in MongoDB
        if (doc.status === 'udhaar' && doc.customerName && doc.customerName !== 'Self') {
          let cust = await Customer.findOne({
            storeId: entryData.storeId,
            name: { $regex: new RegExp(`^${doc.customerName.trim()}$`, 'i') }
          });
          if (!cust) {
            cust = await Customer.create({
              storeId: entryData.storeId,
              name: doc.customerName,
              phone: entryData.customerPhone || '',
              email: '',
              outstandingBalance: amount,
              aiRiskScore: 35,
              aiRiskStatus: 'Medium',
              aiRecoverySuggestions: ['Newly created udhaar debtor. Collect mobile number and follow up.'],
              purchaseCount: 1
            });
          } else {
            cust.outstandingBalance = (cust.outstandingBalance || 0) + amount;
            cust.purchaseCount = (cust.purchaseCount || 0) + 1;
            await cust.save();
          }

          await Udhaar.create({
            storeId: entryData.storeId,
            customerId: cust._id ? cust._id.toString() : cust.id,
            customerName: cust.name,
            amount: amount,
            totalAmount: amount,
            pendingAmount: amount,
            status: 'pending',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            dateCreated: new Date(),
            paymentHistory: []
          });
        } else if (doc.customerName && doc.customerName !== 'Self') {
          const cust = await Customer.findOne({
            storeId: entryData.storeId,
            name: { $regex: new RegExp(`^${doc.customerName.trim()}$`, 'i') }
          });
          if (cust) {
            cust.purchaseCount = (cust.purchaseCount || 0) + 1;
            await cust.save();
          }
        }

        return toRecord(doc);
      }

      const id = `e-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newEntry = {
        id,
        storeId: entryData.storeId,
        userId: entryData.userId,
        customerName: entryData.customerName?.trim() || 'Self',
        productName: entryData.productName?.trim() || 'General Items',
        quantity,
        price,
        amount,
        type: entryData.type || 'sale',
        status: entryData.status || 'paid',
        paymentMethod: entryData.paymentMethod || 'cash',
        date: entryData.date || new Date().toISOString(),
        notes: entryData.notes || ''
      };

      LocalStore.updateAll(db => {
        if (!db.entries) db.entries = [];
        db.entries.unshift(newEntry);

        if (db.inventory && newEntry.productName) {
          const invItem = db.inventory.find(i =>
            i.name.toLowerCase() === newEntry.productName.toLowerCase()
          );
          if (invItem) {
            if (newEntry.type === 'sale') {
              invItem.stock = Math.max(0, invItem.stock - newEntry.quantity);
            } else if (newEntry.type === 'purchase' || newEntry.type === 'return') {
              invItem.stock += newEntry.quantity;
            }
          }
        }

        if (newEntry.status === 'udhaar' && newEntry.customerName && newEntry.customerName !== 'Self') {
          if (!db.customers) db.customers = [];
          let cust = db.customers.find(c => c.storeId === newEntry.storeId && c.name.toLowerCase() === newEntry.customerName.toLowerCase());
          if (!cust) {
            cust = {
              id: `cust-${Date.now()}`,
              storeId: newEntry.storeId,
              userId: newEntry.userId,
              name: newEntry.customerName,
              phone: entryData.customerPhone || '',
              email: '',
              outstandingBalance: amount,
              aiRiskScore: 35,
              aiRiskStatus: 'Medium',
              aiRecoverySuggestions: ['Newly created udhaar debtor. Collect mobile number and follow up.'],
              purchaseCount: 1
            };
            db.customers.push(cust);
          } else {
            cust.outstandingBalance = (cust.outstandingBalance || 0) + amount;
            cust.purchaseCount = (cust.purchaseCount || 0) + 1;
          }

          if (!db.udhaar) db.udhaar = [];
          db.udhaar.unshift({
            id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            storeId: newEntry.storeId,
            userId: newEntry.userId,
            customerId: cust.id,
            customerName: cust.name,
            amount: amount,
            totalAmount: amount,
            pendingAmount: amount,
            status: 'pending',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            dateCreated: new Date().toISOString(),
            paymentHistory: []
          });
        } else if (newEntry.customerName && newEntry.customerName !== 'Self') {
          if (!db.customers) db.customers = [];
          const cust = db.customers.find(c => c.storeId === newEntry.storeId && c.name.toLowerCase() === newEntry.customerName.toLowerCase());
          if (cust) {
            cust.purchaseCount = (cust.purchaseCount || 0) + 1;
          }
        }
      });

      return newEntry;
    },

    async update(id: string, storeId: string, updates: any) {
      if (isMongoConnected()) {
        const query = buildIdQuery(id, storeId);
        const doc = await Entry.findOneAndUpdate(query, updates, { returnDocument: 'after' }).lean();
        return toRecord(doc);
      }

      let updated: any = null;
      LocalStore.updateAll(db => {
        if (!db.entries) return;
        const idx = db.entries.findIndex(e => e.id === id && e.storeId === storeId);
        if (idx !== -1) {
          db.entries[idx] = { ...db.entries[idx], ...updates };
          updated = db.entries[idx];
        }
      });
      return updated;
    },

    async delete(id: string, storeId: string) {
      if (isMongoConnected()) {
        const query = buildIdQuery(id, storeId);
        await Entry.deleteOne(query);
        return true;
      }

      LocalStore.updateAll(db => {
        if (db.entries) {
          db.entries = db.entries.filter(e => !(e.id === id && e.storeId === storeId));
        }
      });
      return true;
    }
  },

  customers: {
    async find(storeId: string, userId: string, search?: string) {
      if (isMongoConnected()) {
        const query: any = { ...buildStoreFilter(storeId) };
        if (search && search.trim()) {
          const regex = new RegExp(search.trim(), 'i');
          query.$or = [{ name: regex }, { phone: regex }, { email: regex }];
        }
        const docs = await Customer.find(query).sort({ name: 1 }).lean();
        return toRecords(docs);
      }

      const db = LocalStore.getAll();
      let list = (db.customers || []).filter(c => c.storeId === storeId);
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(c =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
        );
      }
      return list;
    },

    async findById(customerId: string, storeId: string) {
      if (isMongoConnected()) {
        const query = buildIdQuery(customerId, storeId);
        const doc = await Customer.findOne(query).lean();
        return toRecord(doc);
      }

      const db = LocalStore.getAll();
      return (db.customers || []).find(c => c.id === customerId && c.storeId === storeId) || null;
    },

    async create(data: any) {
      if (isMongoConnected()) {
        const doc = await Customer.create({
          storeId: data.storeId,
          name: data.name.trim(),
          phone: data.phone || '+91 90000 00000',
          email: data.email || '',
          outstandingBalance: Number(data.outstandingBalance) || 0,
          aiRiskScore: Number(data.aiRiskScore) || 20,
          aiRiskStatus: data.aiRiskStatus || 'Low',
          aiRecoverySuggestions: data.aiRecoverySuggestions || ['Regular customer. Keep credit limit up to ₹2,000.'],
          purchaseCount: Number(data.purchaseCount) || 1,
          notes: data.notes || ''
        });
        return toRecord(doc);
      }

      const id = `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payload = {
        id,
        storeId: data.storeId,
        name: data.name.trim(),
        phone: data.phone || '+91 90000 00000',
        email: data.email || '',
        outstandingBalance: Number(data.outstandingBalance) || 0,
        aiRiskScore: Number(data.aiRiskScore) || 20,
        aiRiskStatus: data.aiRiskStatus || 'Low',
        aiRecoverySuggestions: data.aiRecoverySuggestions || ['Regular customer. Keep credit limit up to ₹2,000.'],
        purchaseCount: Number(data.purchaseCount) || 1,
        notes: data.notes || ''
      };

      LocalStore.updateAll(db => {
        if (!db.customers) db.customers = [];
        db.customers.unshift(payload);
      });
      return payload;
    },

    async update(customerId: string, storeId: string, updates: any) {
      if (isMongoConnected()) {
        const query = buildIdQuery(customerId, storeId);
        const doc = await Customer.findOneAndUpdate(query, updates, { returnDocument: 'after' }).lean();
        return toRecord(doc);
      }

      let updated: any = null;
      LocalStore.updateAll(db => {
        if (!db.customers) return;
        const idx = db.customers.findIndex(c => c.id === customerId && c.storeId === storeId);
        if (idx !== -1) {
          db.customers[idx] = { ...db.customers[idx], ...updates };
          updated = db.customers[idx];
        }
      });
      return updated;
    },

    async delete(customerId: string, storeId: string) {
      if (isMongoConnected()) {
        const query = buildIdQuery(customerId, storeId);
        await Customer.deleteOne(query);
        await Udhaar.deleteMany({ storeId, customerId });
        return true;
      }

      LocalStore.updateAll(db => {
        if (db.customers) {
          db.customers = db.customers.filter(c => !(c.id === customerId && c.storeId === storeId));
        }
        if (db.udhaar) {
          db.udhaar = db.udhaar.filter(u => !(u.customerId === customerId && u.storeId === storeId));
        }
      });
      return true;
    },

    async getTimeline(customerId: string, storeId: string) {
      if (isMongoConnected()) {
        const customer = await dal.customers.findById(customerId, storeId);
        if (!customer) return [];

        const timeline: any[] = [];
        const entries = await Entry.find({ storeId, customerName: customer.name }).lean();
        entries.forEach((e: any) => {
          timeline.push({
            id: `timeline-entry-${e._id}`,
            date: e.date,
            type: e.type,
            title: `${e.type.toUpperCase()}: ${e.productName}`,
            amount: e.amount,
            status: e.status,
            paymentMethod: e.paymentMethod,
            details: `${e.quantity} units @ ₹${e.price}`
          });
        });

        const udhaars = await Udhaar.find({
          storeId,
          $or: [{ customerId }, { customerName: customer.name }]
        }).lean();

        udhaars.forEach((u: any) => {
          timeline.push({
            id: `timeline-udhaar-${u._id}`,
            date: u.dateCreated,
            type: 'udhaar',
            title: `Credit Allocated: ₹${u.amount}`,
            amount: u.amount,
            status: u.status,
            dueDate: u.dueDate,
            details: `Due date: ${new Date(u.dueDate).toLocaleDateString('en-IN')}`
          });

          (u.paymentHistory || []).forEach((p: any, idx: number) => {
            timeline.push({
              id: `timeline-pay-${u._id}-${idx}`,
              date: p.date,
              type: 'payment',
              title: `Settlement Paid: ₹${p.amount}`,
              amount: p.amount,
              status: 'paid',
              details: `Payment method: ${p.method || 'cash'}`
            });
          });
        });

        timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return timeline;
      }

      const db = LocalStore.getAll();
      const customer = (db.customers || []).find(c => c.id === customerId);
      if (!customer) return [];

      const timeline: any[] = [];

      (db.entries || []).forEach(e => {
        if (e.customerName.toLowerCase() === customer.name.toLowerCase()) {
          timeline.push({
            id: `timeline-entry-${e.id}`,
            date: e.date,
            type: e.type,
            title: `${e.type.toUpperCase()}: ${e.productName}`,
            amount: e.amount,
            status: e.status,
            paymentMethod: e.paymentMethod,
            details: `${e.quantity} units @ ₹${e.price}`
          });
        }
      });

      (db.udhaar || []).forEach(u => {
        if (u.customerId === customerId || u.customerName.toLowerCase() === customer.name.toLowerCase()) {
          timeline.push({
            id: `timeline-udhaar-${u.id}`,
            date: u.dateCreated,
            type: 'udhaar',
            title: `Credit Allocated: ₹${u.amount}`,
            amount: u.amount,
            status: u.status,
            dueDate: u.dueDate,
            details: `Due date: ${new Date(u.dueDate).toLocaleDateString('en-IN')}`
          });

          (u.paymentHistory || []).forEach((p: any, idx: number) => {
            timeline.push({
              id: `timeline-pay-${u.id}-${idx}`,
              date: p.date,
              type: 'payment',
              title: `Settlement Paid: ₹${p.amount}`,
              amount: p.amount,
              status: 'paid',
              details: `Payment method: ${p.method || 'cash'}`
            });
          });
        }
      });

      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return timeline;
    }
  },

  inventory: {
    async find(storeId: string, userId: string, filters: any = {}) {
      if (isMongoConnected()) {
        const query: any = { ...buildStoreFilter(storeId) };
        if (filters.search) {
          const regex = new RegExp(filters.search.trim(), 'i');
          query.$or = [{ name: regex }, { sku: regex }, { category: regex }];
        }
        if (filters.category && filters.category !== 'All') {
          query.category = filters.category;
        }
        if (filters.lowStockOnly) {
          query.$expr = { $lte: ['$stock', '$minStockAlert'] };
        }
        const docs = await Inventory.find(query).sort({ name: 1 }).lean();
        return toRecords(docs);
      }

      const db = LocalStore.getAll();
      let list = (db.inventory || []).filter(i => i.storeId === storeId);

      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter(i =>
          i.name.toLowerCase().includes(q) ||
          (i.sku && i.sku.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q))
        );
      }

      if (filters.category && filters.category !== 'All') {
        list = list.filter(i => i.category === filters.category);
      }

      if (filters.lowStockOnly) {
        list = list.filter(i => i.stock <= i.minStockAlert);
      }

      return list;
    },

    async findById(productId: string, storeId: string) {
      if (isMongoConnected()) {
        const query = buildIdQuery(productId, storeId);
        const doc = await Inventory.findOne(query).lean();
        return toRecord(doc);
      }

      const db = LocalStore.getAll();
      return (db.inventory || []).find(i => i.id === productId && i.storeId === storeId) || null;
    },

    async create(data: any) {
      if (isMongoConnected()) {
        const doc = await Inventory.create({
          storeId: data.storeId,
          name: data.name.trim(),
          sku: data.sku || `SKU-${Date.now().toString().slice(-4)}`,
          stock: Math.max(0, Number(data.stock) || 0),
          minStockAlert: Number(data.minStockAlert) || 5,
          minStock: Number(data.minStockAlert) || 5,
          purchasePrice: Number(data.purchasePrice) || 0,
          sellingPrice: Number(data.sellingPrice) || 0,
          price: Number(data.sellingPrice) || 0,
          category: data.category || 'General',
          supplierName: data.supplierName || 'Wholesale Supplier',
          expiryDate: data.expiryDate || ''
        });
        return toRecord(doc);
      }

      const id = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payload = {
        id,
        storeId: data.storeId,
        name: data.name.trim(),
        sku: data.sku || `SKU-${Date.now().toString().slice(-4)}`,
        stock: Math.max(0, Number(data.stock) || 0),
        minStockAlert: Number(data.minStockAlert) || 5,
        purchasePrice: Number(data.purchasePrice) || 0,
        sellingPrice: Number(data.sellingPrice) || 0,
        category: data.category || 'General',
        supplierName: data.supplierName || 'Wholesale Supplier',
        expiryDate: data.expiryDate || ''
      };

      LocalStore.updateAll(db => {
        if (!db.inventory) db.inventory = [];
        db.inventory.unshift(payload);
      });
      return payload;
    },

    async update(productId: string, storeId: string, updates: any) {
      if (isMongoConnected()) {
        const query = buildIdQuery(productId, storeId);
        const cleanUpdates = { ...updates };
        if (cleanUpdates.stock !== undefined) {
          cleanUpdates.stock = Math.max(0, Number(cleanUpdates.stock));
        }
        if (cleanUpdates.sellingPrice !== undefined) {
          cleanUpdates.price = cleanUpdates.sellingPrice;
        }
        const doc = await Inventory.findOneAndUpdate(query, cleanUpdates, { returnDocument: 'after' }).lean();
        return toRecord(doc);
      }

      let updated: any = null;
      LocalStore.updateAll(db => {
        if (!db.inventory) return;
        const idx = db.inventory.findIndex(i => i.id === productId && i.storeId === storeId);
        if (idx !== -1) {
          if (updates.stock !== undefined) {
            updates.stock = Math.max(0, Number(updates.stock));
          }
          db.inventory[idx] = { ...db.inventory[idx], ...updates };
          updated = db.inventory[idx];
        }
      });
      return updated;
    },

    async delete(productId: string, storeId: string) {
      if (isMongoConnected()) {
        const query = buildIdQuery(productId, storeId);
        await Inventory.deleteOne(query);
        return true;
      }

      LocalStore.updateAll(db => {
        if (db.inventory) {
          db.inventory = db.inventory.filter(i => !(i.id === productId && i.storeId === storeId));
        }
      });
      return true;
    },

    async bulkCreate(items: any[], storeId: string, userId: string) {
      if (isMongoConnected()) {
        const payload = items.map(item => ({
          storeId,
          name: item.name?.trim() || 'Imported Product',
          sku: item.sku || `SKU-${Math.floor(Math.random() * 10000)}`,
          stock: Math.max(0, Number(item.stock) || 0),
          minStockAlert: Number(item.minStockAlert) || 5,
          minStock: Number(item.minStockAlert) || 5,
          purchasePrice: Number(item.purchasePrice) || 0,
          sellingPrice: Number(item.sellingPrice) || 0,
          price: Number(item.sellingPrice) || 0,
          category: item.category || 'Grocery',
          supplierName: item.supplierName || 'Distributor',
          expiryDate: item.expiryDate || ''
        }));
        const docs = await Inventory.insertMany(payload);
        return toRecords(docs);
      }

      const created: any[] = [];
      LocalStore.updateAll(db => {
        if (!db.inventory) db.inventory = [];
        items.forEach(item => {
          const id = `inv-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          const payload = {
            id,
            storeId,
            name: item.name?.trim() || 'Imported Product',
            sku: item.sku || `SKU-${Math.floor(Math.random() * 10000)}`,
            stock: Math.max(0, Number(item.stock) || 0),
            minStockAlert: Number(item.minStockAlert) || 5,
            purchasePrice: Number(item.purchasePrice) || 0,
            sellingPrice: Number(item.sellingPrice) || 0,
            category: item.category || 'Grocery',
            supplierName: item.supplierName || 'Distributor',
            expiryDate: item.expiryDate || ''
          };
          db.inventory.unshift(payload);
          created.push(payload);
        });
      });
      return created;
    },

    async bulkUpdateCategory(productIds: string[], category: string, storeId: string) {
      if (isMongoConnected()) {
        const objectIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
        await Inventory.updateMany(
          { storeId, $or: [{ _id: { $in: objectIds } }, { id: { $in: productIds } }] },
          { $set: { category } }
        );
        return true;
      }

      LocalStore.updateAll(db => {
        if (!db.inventory) return;
        db.inventory.forEach(item => {
          if (productIds.includes(item.id) && item.storeId === storeId) {
            item.category = category;
          }
        });
      });
      return true;
    },

    async bulkUpdatePrice(productIds: string[], type: 'percentage' | 'flat', value: number, storeId: string) {
      if (isMongoConnected()) {
        const items = await dal.inventory.find(storeId, '');
        for (const item of items) {
          if (productIds.includes(item.id)) {
            let newPrice = item.sellingPrice;
            if (type === 'percentage') {
              newPrice = Math.round(newPrice * (1 + value / 100));
            } else {
              newPrice = Math.max(0, newPrice + value);
            }
            await dal.inventory.update(item.id, storeId, { sellingPrice: newPrice, price: newPrice });
          }
        }
        return true;
      }

      LocalStore.updateAll(db => {
        if (!db.inventory) return;
        db.inventory.forEach(item => {
          if (productIds.includes(item.id) && item.storeId === storeId) {
            if (type === 'percentage') {
              item.sellingPrice = Math.round(item.sellingPrice * (1 + value / 100));
            } else {
              item.sellingPrice = Math.max(0, item.sellingPrice + value);
            }
          }
        });
      });
      return true;
    },

    async bulkDelete(productIds: string[], storeId: string) {
      if (isMongoConnected()) {
        const objectIds = productIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id));
        await Inventory.deleteMany({
          storeId,
          $or: [{ _id: { $in: objectIds } }, { id: { $in: productIds } }]
        });
        return true;
      }

      LocalStore.updateAll(db => {
        if (db.inventory) {
          db.inventory = db.inventory.filter(i => !(productIds.includes(i.id) && i.storeId === storeId));
        }
      });
      return true;
    }
  },

  udhaar: {
    async find(storeId: string, userId: string) {
      if (isMongoConnected()) {
        const storeFilter = buildStoreFilter(storeId);
        const docs = await Udhaar.find(storeFilter).sort({ dateCreated: -1 }).lean();
        return toRecords(docs);
      }
      const db = LocalStore.getAll();
      return (db.udhaar || []).filter(u => u.storeId === storeId || String(u.storeId) === String(storeId));
    },

    async findById(udhaarId: string, storeId: string) {
      if (isMongoConnected()) {
        const query = buildIdQuery(udhaarId, storeId);
        const doc = await Udhaar.findOne(query).lean();
        return toRecord(doc);
      }
      const db = LocalStore.getAll();
      return (db.udhaar || []).find(u => u.id === udhaarId && u.storeId === storeId) || null;
    },

    async collect(udhaarId: string, storeId: string, amount: number, paymentMethod: string = 'cash', notes: string = '', receivedBy: string = 'Store Owner') {
      if (isMongoConnected()) {
        const query = buildIdQuery(udhaarId, storeId);
        const record = await Udhaar.findOne(query);
        if (!record) return { updatedRecord: null, settledEntry: null };

        const payAmount = Math.min(amount, record.amount);
        record.amount = Math.max(0, record.amount - payAmount);
        if (record.amount === 0) {
          record.status = 'settled';
        }

        if (!record.paymentHistory) record.paymentHistory = [];
        record.paymentHistory.push({
          date: new Date(),
          amount: payAmount,
          method: paymentMethod,
          notes,
          receivedBy
        });
        await record.save();

        // Reduce customer balance
        if (record.customerId) {
          const custQuery = buildIdQuery(record.customerId.toString(), storeId);
          const cust = await Customer.findOne(custQuery);
          if (cust) {
            cust.outstandingBalance = Math.max(0, cust.outstandingBalance - payAmount);
            await cust.save();
          }
        }

        // Create settlement entry in Entry
        const settledEntry = await Entry.create({
          storeId,
          customerName: record.customerName,
          productName: 'Udhaar Settlement Payment',
          quantity: 1,
          price: payAmount,
          amount: payAmount,
          type: 'sale',
          status: 'paid',
          paymentMethod,
          date: new Date(),
          notes: `Settlement for Udhaar #${udhaarId}. ${notes}`
        });

        return { updatedRecord: toRecord(record), settledEntry: toRecord(settledEntry) };
      }

      let updatedRecord: any = null;
      let settledEntry: any = null;

      LocalStore.updateAll(db => {
        if (!db.udhaar) return;
        const record = db.udhaar.find(u => u.id === udhaarId && u.storeId === storeId);
        if (!record) return;

        const payAmount = Math.min(amount, record.amount);
        record.amount = Math.max(0, record.amount - payAmount);
        if (record.amount === 0) {
          record.status = 'settled';
        }

        if (!record.paymentHistory) record.paymentHistory = [];
        record.paymentHistory.push({
          date: new Date().toISOString(),
          amount: payAmount,
          method: paymentMethod,
          notes,
          receivedBy
        });
        updatedRecord = record;

        if (db.customers && record.customerId) {
          const cust = db.customers.find(c => c.id === record.customerId && c.storeId === storeId);
          if (cust) {
            cust.outstandingBalance = Math.max(0, cust.outstandingBalance - payAmount);
          }
        }

        settledEntry = {
          id: `e-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          storeId,
          customerName: record.customerName,
          productName: 'Udhaar Settlement Payment',
          quantity: 1,
          price: payAmount,
          amount: payAmount,
          type: 'sale',
          status: 'paid',
          paymentMethod,
          date: new Date().toISOString(),
          notes: `Settlement for Udhaar #${udhaarId}. ${notes}`
        };
        if (!db.entries) db.entries = [];
        db.entries.unshift(settledEntry);
      });

      return { updatedRecord, settledEntry };
    },

    async create(data: any) {
      const amount = Number(data.amount) || 0;

      if (isMongoConnected()) {
        const doc = await Udhaar.create({
          storeId: data.storeId,
          customerId: data.customerId,
          customerName: data.customerName,
          amount,
          totalAmount: amount,
          pendingAmount: amount,
          status: 'pending',
          dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          dateCreated: new Date(),
          paymentHistory: []
        });

        if (data.customerId) {
          const custQuery = buildIdQuery(data.customerId.toString(), data.storeId);
          const cust = await Customer.findOne(custQuery);
          if (cust) {
            cust.outstandingBalance = (cust.outstandingBalance || 0) + amount;
            await cust.save();
          }
        }

        return toRecord(doc);
      }

      const id = `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payload: any = {
        id,
        storeId: data.storeId,
        customerId: data.customerId,
        customerName: data.customerName,
        amount,
        status: 'pending',
        dueDate: data.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        dateCreated: new Date().toISOString(),
        paymentHistory: []
      };

      LocalStore.updateAll(db => {
        if (!db.udhaar) db.udhaar = [];
        db.udhaar.unshift(payload);

        if (db.customers && data.customerId) {
          const cust = db.customers.find(c => c.id === data.customerId);
          if (cust) {
            cust.outstandingBalance = (cust.outstandingBalance || 0) + payload.amount;
          }
        }
      });
      return payload;
    }
  },

  auditLogs: {
    async find(storeId: string, userId: string, filters: any = {}) {
      if (isMongoConnected()) {
        const query: any = {};
        if (storeId) query.storeId = storeId;
        if (filters.action && filters.action !== 'ALL') query.action = filters.action;
        if (filters.search) {
          const regex = new RegExp(filters.search.trim(), 'i');
          query.$or = [{ userName: regex }, { details: regex }, { action: regex }];
        }
        const docs = await ActivityLog.find(query).sort({ timestamp: -1 }).limit(200).lean();
        return toRecords(docs);
      }

      const db = LocalStore.getAll();
      let logs = db.auditLogs || [];
      if (filters.action && filters.action !== 'ALL') {
        logs = logs.filter(l => l.action === filters.action);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        logs = logs.filter(l =>
          l.userName.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q)
        );
      }
      return logs;
    },

    async log(userId: string, userName: string, action: string, details: string, storeId: string = '') {
      if (isMongoConnected()) {
        const doc = await ActivityLog.create({
          userId,
          userName: userName || 'System Operator',
          action,
          details,
          storeId,
          timestamp: new Date()
        });
        return toRecord(doc);
      }

      const payload = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId,
        userName: userName || 'System Operator',
        action,
        details,
        storeId,
        timestamp: new Date().toISOString()
      };

      LocalStore.updateAll(db => {
        if (!db.auditLogs) db.auditLogs = [];
        db.auditLogs.unshift(payload);
        if (db.auditLogs.length > 500) {
          db.auditLogs = db.auditLogs.slice(0, 500);
        }
      });
      return payload;
    }
  },

  notifications: {
    async find(storeId: string, userId: string) {
      if (isMongoConnected()) {
        const notifs: any[] = [];

        // Dynamic low stock alerts from MongoDB
        const lowStockItems = await Inventory.find({
          storeId,
          $expr: { $lte: ['$stock', '$minStockAlert'] }
        }).lean();

        lowStockItems.forEach((item: any) => {
          notifs.push({
            id: `notif-stock-${item._id}`,
            title: `Low Stock: ${item.name}`,
            message: `Only ${item.stock} units remaining (Alert threshold: ${item.minStockAlert}). Restock recommended.`,
            type: 'LOW_STOCK',
            date: new Date().toISOString(),
            read: false
          });
        });

        // Dynamic overdue udhaar alerts from MongoDB
        const overdueUdhaars = await Udhaar.find({
          storeId,
          status: 'pending',
          amount: { $gt: 0 },
          dueDate: { $lt: new Date() }
        }).lean();

        overdueUdhaars.forEach((u: any) => {
          notifs.push({
            id: `notif-udhaar-${u._id}`,
            title: `Overdue Udhaar: ${u.customerName}`,
            message: `Pending credit of ₹${u.amount} was due on ${new Date(u.dueDate).toLocaleDateString('en-IN')}.`,
            type: 'UDHAAR_OVERDUE',
            date: u.dueDate,
            read: false
          });
        });

        // Stored notifications
        const stored = await Notification.find({
          $or: [{ storeId }, { userId }]
        }).sort({ createdAt: -1 }).limit(20).lean();

        stored.forEach((n: any) => {
          notifs.push({
            id: n._id.toString(),
            title: n.title,
            message: n.message,
            type: n.type || 'SYSTEM',
            date: n.createdAt,
            read: n.isRead
          });
        });

        return notifs;
      }

      const db = LocalStore.getAll();
      const notifs: any[] = [];

      (db.inventory || []).forEach(item => {
        if (item.stock <= item.minStockAlert) {
          notifs.push({
            id: `notif-stock-${item.id}`,
            title: `Low Stock: ${item.name}`,
            message: `Only ${item.stock} units remaining (Alert threshold: ${item.minStockAlert}). Restock recommended.`,
            type: 'LOW_STOCK',
            date: new Date().toISOString(),
            read: false
          });
        }
      });

      const now = new Date().getTime();
      (db.udhaar || []).forEach(u => {
        if (u.status === 'pending' && u.amount > 0) {
          const dueTime = new Date(u.dueDate).getTime();
          const isOverdue = dueTime < now;
          if (isOverdue) {
            notifs.push({
              id: `notif-udhaar-${u.id}`,
              title: `Overdue Udhaar: ${u.customerName}`,
              message: `Pending credit of ₹${u.amount} was due on ${new Date(u.dueDate).toLocaleDateString('en-IN')}.`,
              type: 'UDHAAR_OVERDUE',
              date: u.dueDate,
              read: false
            });
          }
        }
      });

      return notifs;
    },

    async markRead(notificationId: string, userId: string) {
      if (isMongoConnected()) {
        const query = buildIdQuery(notificationId);
        await Notification.updateOne(query, { $set: { isRead: true } });
        return true;
      }
      return true;
    },

    async markAllRead(userId: string) {
      if (isMongoConnected()) {
        await Notification.updateMany({ userId }, { $set: { isRead: true } });
        return true;
      }
      return true;
    }
  },

  invoiceTemplates: {
    async get(storeId: string) {
      if (isMongoConnected()) {
        const doc = await InvoiceTemplate.findOne({ storeId }).lean();
        if (doc) return toRecord(doc);

        const store = await dal.stores.findById(storeId);
        return {
          storeId,
          themeColor: '#0f766e',
          businessTitle: store?.name || 'LeadgerX Kirana Store',
          address: store?.address || '',
          phone: store?.phone || '',
          gstin: store?.gstin || '',
          termsAndConditions: 'Computer-generated bill. Goods once sold cannot be returned.',
          footerNote: 'Thank you for shopping with us! Visit again.',
          logoUrl: '',
          showGst: !!store?.gstin,
          showQrCode: true
        };
      }

      const db = LocalStore.getAll();
      const existing = (db.invoiceTemplates || []).find(t => t.storeId === storeId);
      if (existing) return existing;

      const store = (db.stores || []).find(s => s.id === storeId);
      return {
        storeId,
        themeColor: '#0f766e',
        businessTitle: store?.name || 'LeadgerX Kirana Store',
        address: store?.address || '',
        phone: store?.phone || '',
        gstin: store?.gstin || '',
        termsAndConditions: 'Computer-generated bill. Goods once sold cannot be returned.',
        footerNote: 'Thank you for shopping with us! Visit again.',
        logoUrl: '',
        showGst: !!store?.gstin,
        showQrCode: true
      };
    },

    async save(storeId: string, data: any) {
      if (isMongoConnected()) {
        const doc = await InvoiceTemplate.findOneAndUpdate(
          { storeId },
          { ...data, storeId, updatedAt: new Date() },
          { upsert: true, returnDocument: 'after' }
        ).lean();
        return toRecord(doc);
      }

      let saved: any = null;
      LocalStore.updateAll(db => {
        if (!db.invoiceTemplates) db.invoiceTemplates = [];
        const idx = db.invoiceTemplates.findIndex(t => t.storeId === storeId);
        const payload = { ...data, storeId, updatedAt: new Date().toISOString() };
        if (idx !== -1) {
          db.invoiceTemplates[idx] = payload;
        } else {
          db.invoiceTemplates.push(payload);
        }
        saved = payload;
      });
      return saved;
    }
  },

  analytics: {
    async getSummary(storeId: string, userId: string) {
      const now = new Date();
      const todayUtc = now.toISOString().split('T')[0];
      const localYear = now.getFullYear();
      const localMonth = String(now.getMonth() + 1).padStart(2, '0');
      const localDay = String(now.getDate()).padStart(2, '0');
      const todayLocal = `${localYear}-${localMonth}-${localDay}`;
      const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
      const startOfTodayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      const checkIsToday = (entryDate: any): boolean => {
        if (!entryDate) return true;
        const d = new Date(entryDate);
        const time = d.getTime();
        if (!isNaN(time)) {
          const dUtc = d.toISOString().split('T')[0];
          const dLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return dUtc === todayUtc || 
                 dLocal === todayLocal || 
                 time >= startOfTodayUtc || 
                 time >= startOfTodayLocal || 
                 (now.getTime() - time < 24 * 60 * 60 * 1000 && time <= now.getTime());
        }
        if (typeof entryDate === 'string') {
          return entryDate.startsWith(todayUtc) || entryDate.startsWith(todayLocal);
        }
        return true;
      };

      if (isMongoConnected()) {
        const storeFilter = buildStoreFilter(storeId);
        const entries = await Entry.find(storeFilter).sort({ date: -1 }).lean();
        const udhaars = await Udhaar.find(storeFilter).lean();
        const inventory = await Inventory.find(storeFilter).lean();
        const customers = await Customer.find(storeFilter).lean();

        let todaySales = 0;
        let todaySalesCount = 0;
        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalPurchaseCost = 0;

        entries.forEach((e: any) => {
          const isToday = checkIsToday(e.date);
          if (e.type === 'sale') {
            totalRevenue += Number(e.amount) || 0;
            if (isToday) {
              todaySales += Number(e.amount) || 0;
              todaySalesCount += 1;
            }
          } else if (e.type === 'expense') {
            totalExpenses += Number(e.amount) || 0;
          } else if (e.type === 'purchase') {
            totalPurchaseCost += Number(e.amount) || 0;
          }
        });

        const pendingUdhaar = udhaars.reduce((acc: number, u: any) => acc + (u.status === 'pending' ? (Number(u.amount) || 0) : 0), 0);
        const lowStockCount = inventory.filter((i: any) => (Number(i.stock) || 0) <= (Number(i.minStockAlert) || 5)).length;
        const profit = totalRevenue - totalExpenses - totalPurchaseCost;

        const recentActivity = entries.slice(0, 10).map((e: any) => ({
          id: e._id ? e._id.toString() : (e.id || ''),
          customerName: e.customerName,
          productName: e.productName,
          quantity: e.quantity,
          amount: e.amount,
          type: e.type,
          status: e.status,
          date: e.date,
          title: `${e.type === 'sale' ? 'Sale to' : 'Purchase from'} ${e.customerName || 'Customer'}`,
          subtitle: `${e.productName || 'General Item'} (Qty: ${e.quantity || 1})`,
          time: e.date ? new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
        }));

        return {
          todaySales,
          todaySalesCount,
          totalRevenue,
          totalExpenses,
          profit,
          pendingUdhaar,
          lowStockCount,
          activeCustomers: customers.length,
          customerCount: customers.length,
          inventoryCount: inventory.length,
          entryCount: entries.length,
          weeklyProgress: { current: totalRevenue, goal: 50000 },
          recentActivity
        };
      }

      const db = LocalStore.getAll();
      const entries = (db.entries || []).filter(e => e.storeId === storeId || String(e.storeId) === String(storeId));
      const udhaar = (db.udhaar || []).filter(u => u.storeId === storeId || String(u.storeId) === String(storeId));
      const inventory = (db.inventory || []).filter(i => i.storeId === storeId || String(i.storeId) === String(storeId));
      const customers = (db.customers || []).filter(c => c.storeId === storeId || String(c.storeId) === String(storeId));

      let todaySales = 0;
      let todaySalesCount = 0;
      let totalRevenue = 0;
      let totalExpenses = 0;
      let totalPurchaseCost = 0;

      entries.forEach(e => {
        const isToday = checkIsToday(e.date);
        if (e.type === 'sale') {
          totalRevenue += Number(e.amount) || 0;
          if (isToday) {
            todaySales += Number(e.amount) || 0;
            todaySalesCount += 1;
          }
        } else if (e.type === 'expense') {
          totalExpenses += Number(e.amount) || 0;
        } else if (e.type === 'purchase') {
          totalPurchaseCost += Number(e.amount) || 0;
        }
      });

      const pendingUdhaar = udhaar.reduce((acc, u) => acc + (u.status === 'pending' ? (Number(u.amount) || 0) : 0), 0);
      const lowStockCount = inventory.filter(i => (Number(i.stock) || 0) <= (Number(i.minStockAlert) || 5)).length;
      const profit = totalRevenue - totalExpenses - totalPurchaseCost;

      const recentActivity = entries.slice(0, 10).map(e => ({
        id: e.id,
        customerName: e.customerName,
        productName: e.productName,
        quantity: e.quantity,
        amount: e.amount,
        type: e.type,
        status: e.status,
        date: e.date,
        title: `${e.type === 'sale' ? 'Sale to' : 'Purchase from'} ${e.customerName || 'Customer'}`,
        subtitle: `${e.productName || 'General Item'} (Qty: ${e.quantity || 1})`,
        time: e.date ? new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
      }));

      return {
        todaySales,
        todaySalesCount,
        totalRevenue,
        totalExpenses,
        profit,
        pendingUdhaar,
        lowStockCount,
        activeCustomers: customers.length,
        customerCount: customers.length,
        inventoryCount: inventory.length,
        entryCount: entries.length,
        weeklyProgress: { current: totalRevenue, goal: 50000 },
        recentActivity
      };
    },

    async getTrends(storeId: string, userId: string, days: number = 7) {
      let entries: any[] = [];
      if (isMongoConnected()) {
        const storeFilter = buildStoreFilter(storeId);
        entries = await Entry.find(storeFilter).lean();
      } else {
        const db = LocalStore.getAll();
        entries = (db.entries || []).filter(e => e.storeId === storeId || String(e.storeId) === String(storeId));
      }

      const trendData: any[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

        let sales = 0;
        let expenses = 0;
        let orders = 0;

        entries.forEach((e: any) => {
          const entryDateStr = e.date ? new Date(e.date).toISOString().split('T')[0] : '';
          if (entryDateStr === dateStr) {
            if (e.type === 'sale') {
              sales += e.amount;
              orders++;
            } else if (e.type === 'expense') {
              expenses += e.amount;
            }
          }
        });

        trendData.push({
          date: dateStr,
          day: dayLabel,
          sales,
          expenses,
          profit: sales - expenses,
          orders
        });
      }

      const productMap = new Map<string, { quantity: number; revenue: number }>();
      entries.forEach((e: any) => {
        if (e.type === 'sale' && e.productName) {
          const cur = productMap.get(e.productName) || { quantity: 0, revenue: 0 };
          cur.quantity += e.quantity;
          cur.revenue += e.amount;
          productMap.set(e.productName, cur);
        }
      });

      const topProducts = Array.from(productMap.entries())
        .map(([name, stat]) => ({ name, ...stat }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        trendData,
        topProducts
      };
    }
  }
};
