# LeadgerX — Cloud AI Business Operating System & Ledger SaaS

LeadgerX is a full-stack, multi-tenant, cloud-native SaaS designed for modern retailers, kirana merchants, wholesalers, and SMEs. It combines real-time double-entry bookkeeping, credit (Udhaar) recovery ledger, inventory valuation, AI-assisted OCR bill extraction, voice transcription, automated reports, and demand forecasting powered by Google Gemini.

---

## 🌟 Core Features

1. **Authentication & Multi-Tenant Store Isolation**
   - User account registration & login with session JWT management.
   - Google OAuth single sign-on.
   - Multi-store management: Switch between separate business locations with isolated entries, inventories, customers, and ledger books.
   - Role-Based Access Control (RBAC): Owner, Manager, Employee, Accountant.

2. **Daily Entries & Transaction Management**
   - Categorized tracking: Sales, Purchases, Expenses, Incomes, and Returns.
   - Instant search, date-range filtering, and status tagging (`paid`, `pending`, `udhaar`).
   - Automatic real-time inventory deduction on sales and replenishment on purchases.

3. **Customer Relationship & Udhaar Credit Ledger**
   - Detailed customer profiles with contact details, purchasing history, and total credit liabilities.
   - Timeline auditing all transactions and repayment history per customer.
   - One-click WhatsApp & SMS payment reminders.
   - Automated settlement and partial payment tracking.

4. **Inventory & Stock Management**
   - SKU catalog with purchase price, selling rate, category, and minimum stock safety markers.
   - Automated low-stock alerts.
   - Batch actions (bulk price adjustments, bulk category changes, bulk deletions).
   - Stock movement audit logs.

5. **AI Multimodal Capabilities (Google Gemini)**
   - **Bill Scanner / OCR**: Upload paper receipts or vendor invoices to extract line items, prices, quantities, and GSTIN automatically.
   - **Voice Ledger Entry**: Speak natural language transactions (e.g. *"Sold 5 bags of rice to Ramesh for 1500 rupees"*) to parse and populate forms.
   - **AI Business Coach**: Chat with an AI assistant that analyzes real store metrics and provides actionable growth recommendations.
   - **Demand Forecasting**: Predict item stock-outs based on recent sales velocity.

6. **Analytics & Automated Reports**
   - High-fidelity PDF reports generated via PDFKit with LeadgerX branding.
   - One-click CSV and Excel data export.
   - Interactive financial analytics with Recharts.

7. **Responsive & Offline-First UX**
   - Desktop and mobile-first adaptive UI with responsive navigation drawer and sticky mobile dock.
   - Service worker caching and offline transaction queueing.

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Required for AI Features (Gemini 2.5)
GEMINI_API_KEY=your_gemini_api_key_here

# Application URL
APP_URL=http://localhost:3000

# MongoDB Atlas Database Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/leadgerx?retryWrites=true&w=majority

# JWT Session Encryption
JWT_SECRET=your_super_secret_jwt_key_here

# Google OAuth Single Sign-On
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudinary Storage for Invoices & Logos
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Production Frontend Whitelist (Optional)
FRONTEND_URL=https://leadgerx.yourdomain.com
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
```bash
npm run dev
```
Starts the full-stack Express server with Vite middleware on `http://localhost:3000`.

### 3. Production Build & Start
```bash
npm run build
npm start
```

---

## 📡 Key API Routes

- `GET /api/health` — Health check endpoint (`{"status": "ok", "service": "LeadgerX API"}`)
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User authentication
- `GET /api/summary` — Key financial dashboard metrics
- `GET /api/entries` & `POST /api/entries` — Transaction management
- `GET /api/customers` & `POST /api/customers` — Customer CRM
- `GET /api/customers/:id/timeline` — Customer transaction & credit history
- `GET /api/inventory` & `POST /api/inventory` — Inventory management
- `GET /api/udhaar` & `POST /api/udhaar/collect` — Credit ledger & settlements
- `POST /api/udhaar/remind` — Dispatch payment reminders
- `POST /api/ai/bill-scanner` — OCR receipt processing with Gemini
- `POST /api/ai/voice-entry` — Voice ledger entity parsing with Gemini
- `POST /api/ai/coach` — Business advice and sales insights
- `GET /api/reports/pdf` — Download branded PDF reports
- `GET /api/stores` & `POST /api/stores` — Multi-store management
