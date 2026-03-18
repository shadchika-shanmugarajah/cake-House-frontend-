Cake House — Scalable Architecture Documentation
Comprehensive architecture documentation for the Cake House bakery e-commerce platform, covering backend, frontend, database models, API modules, and best-practice recommendations.

Full Folder Structure
Backend (/backend)
backend/
├── config/
│   └── db.js                    # MongoDB connection
├── middleware/
│   ├── auth.js                  # verifyUser + verifyAdmin JWT middleware
│   ├── validate.js              # [NEW] Request validation middleware
│   └── errorHandler.js          # [NEW] Centralized error handler
├── models/
│   ├── Admin.js                 # Admin account schema
│   ├── BulkOrder.js             # Bulk order schema
│   ├── Category.js              # Product category schema
│   ├── Inventory.js             # Inventory item schema
│   ├── Notification.js          # User notification schema
│   ├── Order.js                 # Order schema
│   ├── Product.js               # Product schema (with reviews)
│   ├── User.js                  # Customer schema
│   └── Rating.js                # [NEW] Standalone ratings/reviews
├── routes/
│   ├── auth.js                  # Register, User login, Admin login
│   ├── bulkOrders.js            # Bulk order CRUD
│   ├── categories.js            # Category management
│   ├── inventory.js             # Inventory CRUD
│   ├── notifications.js         # Notifications read/mark
│   ├── orders.js                # Order CRUD
│   ├── products.js              # Product CRUD + reviews
│   ├── users.js                 # User profile management
│   └── analytics.js             # [NEW] Admin dashboard analytics
├── services/
│   └── notificationService.js   # Email + SMS via Nodemailer / Twilio
├── scripts/
│   ├── seed.js                  # Product seed script
│   └── seedInventory.js         # Inventory seed script
├── utils/                       # [NEW]
│   ├── AppError.js              # Custom error class
│   └── constants.js             # Enums, status codes, config values
├── validators/                  # [NEW]
│   ├── authValidator.js         # Login/register validation rules
│   ├── productValidator.js      # Product field validation
│   └── orderValidator.js        # Order field validation
├── .env                         # Environment variables
├── .gitignore
├── index.js                     # Express app entry point
├── package.json
└── README.md
Frontend (/src)
src/
├── api/
│   └── api.js                   # Centralized fetch wrapper + all API modules
├── assets/                      # Static images, icons
├── components/
│   ├── AdminProtectedRoute.jsx  # Route guard (admin)
│   ├── UserProtectedRoute.jsx   # Route guard (user)
│   ├── admin/
│   │   ├── AdminBackHeader.jsx  # Admin back-navigation header
│   │   ├── AdminSidebar.jsx     # [NEW] Reusable sidebar
│   │   ├── StatCard.jsx         # [NEW] Dashboard stat card
│   │   └── DataTable.jsx        # [NEW] Reusable data table
│   └── client/
│       ├── Chatbot.jsx          # Customer chatbot widget
│       ├── Footer.jsx           # Site footer
│       ├── HeroSection.jsx      # Landing hero banner
│       ├── Navbar.jsx           # Top navigation bar
│       ├── ProductCard.jsx      # Product card component
│       ├── ProductGrid.jsx      # Product grid layout
│       └── Reviews.jsx          # Ratings & reviews component
├── context/
│   ├── AuthContext.jsx          # User + Admin auth state
│   ├── CartContext.jsx          # Shopping cart state
│   ├── OrderContext.jsx         # Order management state
│   └── ProductContext.jsx       # Product listing state
├── pages/
│   ├── admin/
│   │   ├── AdminBulkOrders.jsx  # Bulk order management
│   │   ├── AdminCategories.jsx  # Category CRUD
│   │   ├── AdminCustomers.jsx   # Customer management
│   │   ├── AdminDashboard.jsx   # Dashboard with analytics
│   │   ├── AdminInventory.jsx   # Inventory management
│   │   ├── AdminLayout.jsx      # Admin shell layout
│   │   ├── AdminLogin.jsx       # Admin login page
│   │   ├── AdminLoyalty.jsx     # Loyalty program mgmt
│   │   ├── AdminOrders.jsx      # Order management
│   │   ├── AdminProducts.jsx    # Product management
│   │   ├── AdminSettings.jsx    # Admin settings
│   │   └── CakesManagement.jsx  # Cakes-specific management
│   └── client/
│       ├── About.jsx            # About page
│       ├── BulkOrder.jsx        # Bulk order form
│       ├── Cart.jsx             # Shopping cart
│       ├── Checkout.jsx         # Checkout flow
│       ├── Home.jsx             # Home / landing page
│       ├── Landing.jsx          # Marketing landing
│       ├── Login.jsx            # User login
│       ├── OrderSuccess.jsx     # Order confirmation
│       ├── ProductDetail.jsx    # Single product view
│       ├── Products.jsx         # Product listing
│       ├── Profile.jsx          # User profile
│       └── Register.jsx         # User registration
├── utils/
│   └── exportUtils.js           # CSV/PDF data exports
├── App.jsx                      # Root component + routing
├── App.css
├── index.css                    # Global styles
└── main.jsx                     # Vite entry point
Backend Architecture
Tech Stack
Layer	Technology
Runtime	Node.js (ES Modules)
Framework	Express.js 4.21
Database	MongoDB via Mongoose 8.8
Auth	JWT (jsonwebtoken 9.x)
Email	Nodemailer 6.x
SMS	Twilio SDK 5.x
Config	dotenv
Entry Point (index.js)
index.js
connectDB()
CORS middleware
JSON body parser (10MB)
Route Mounting
/api/auth
/api/users
/api/products
/api/orders
/api/bulk-orders
/api/notifications
/api/inventory
/api/categories
/api/health
Middleware Layer
Middleware	File	Purpose
verifyUser	middleware/auth.js	Validates JWT → sets req.user
verifyAdmin	middleware/auth.js	Validates JWT + checks admin/superadmin role → sets req.admin
Role-Based Auth Flow
MongoDB
Server
Client
MongoDB
Server
Client
User Flow
Admin Flow
Protected Requests
POST /api/auth/register
Create User
{ user, token (role:user, 7d) }
POST /api/auth/login
Find User by email+password
{ type:user, data+token }
POST /api/auth/admin/login
Find Admin by email+password
{ type:admin, data+token (1d) }
GET /api/orders (Bearer token)
verifyUser middleware
Order data
DELETE /api/products/:id (Bearer token)
verifyAdmin middleware
Success / 403 denied
Services
Service	File	Description
NotificationService	services/notificationService.js	Sends email (SMTP/Nodemailer) and SMS (Twilio) notifications when bulk orders are confirmed. Falls back gracefully when credentials aren't configured.
Frontend Architecture
Tech Stack
Layer	Technology
Framework	React 19.2
Build Tool	Vite 7.2
Routing	react-router-dom 7.13
UI Library	MUI 7.3 + MUI Icons
Animations	framer-motion 12.x
HTTP	Fetch API (custom wrapper)
Toasts	react-toastify 11.x
Payments	Stripe React / JS
Icons	lucide-react, react-icons
Context Providers (State Architecture)
AuthProvider
CartProvider
OrderProvider
ProductProvider
Router
AppContent
Context	Purpose
AuthContext	Manages user + admin state, login/logout for both roles, localStorage persistence
CartContext	Shopping cart items, add/remove/update quantities
OrderContext	Order creation, tracking, history
ProductContext	Product listing, filtering, search
Routing Structure
Route	Component	Protection
/	Home	Public
/login	Login	Public
/register	Register	Public
/products	Products	Public
/product/:id	ProductDetail	Public
/about	About	Public
/cart	Cart	UserProtectedRoute
/checkout	Checkout	UserProtectedRoute
/bulk-order	BulkOrder	UserProtectedRoute
/order-success	OrderSuccess	UserProtectedRoute
/profile	Profile	UserProtectedRoute
/admin/login	AdminLogin	Public
/admin/dashboard	AdminDashboard	AdminProtectedRoute
/admin/products	AdminProducts	AdminProtectedRoute
/admin/categories	AdminCategories	AdminProtectedRoute
/admin/orders	AdminOrders	AdminProtectedRoute
/admin/bulk-orders	AdminBulkOrders	AdminProtectedRoute
/admin/customers	AdminCustomers	AdminProtectedRoute
/admin/settings	AdminSettings	AdminProtectedRoute
/admin/inventory	AdminInventory	AdminProtectedRoute
API Layer (api/api.js)
Centralized fetch wrapper with automatic token injection:

User routes → reads userAuth from localStorage
Admin routes (path starts with /admin or page is /admin/*) → reads adminAuth from localStorage
Database Models Overview
places
places
receives
belongsTo
contains
contains
tracks
User
ObjectId
_id
String
name
String
email
UK
String
password
String
phone
String
profileImage
String
address
Date
createdAt
Admin
ObjectId
_id
String
email
UK
String
password
String
role
Date
createdAt
Product
ObjectId
_id
String
name
String
description
Number
price
String
category
String
image
Number
rating
Number
reviewCount
Boolean
isTrending
Number
stock
Array
reviews
Date
createdAt
Category
ObjectId
_id
String
name
UK
String
description
Date
createdAt
Order
ObjectId
_id
String
id
UK
Array
items
Number
subtotal
Number
tax
Number
shipping
Number
total
Object
customer
String
deliveryAddress
String
deliveryType
String
paymentMethod
String
status
String
paymentStatus
Boolean
unread
Date
createdAt
BulkOrder
ObjectId
_id
String
id
UK
Array
items
Number
totalQuantity
Number
subtotal
Number
tax
Number
shipping
Number
total
Object
customer
String
preferredDate
String
alternateDate
String
additionalNotes
String
status
String
paymentStatus
Date
createdAt
Inventory
ObjectId
_id
String
id
UK
String
name
String
category
String
sku
Number
stock
String
unit
Number
minStock
Number
maxStock
Number
price
String
supplier
String
status
Date
createdAt
Notification
ObjectId
_id
String
customerEmail
String
orderId
String
message
String
type
Boolean
read
Date
createdAt
API Modules Overview
Authentication (/api/auth)
Method	Endpoint	Auth	Description
POST	/register	None	Register new user
POST	/login	None	User login → JWT (7d)
POST	/admin/login	None	Admin login → JWT (1d)
Users (/api/users)
Method	Endpoint	Auth	Description
GET	/	Admin	List all users
GET	/:email	User	Get user by email
PUT	/:email	User	Update user profile
Products (/api/products)
Method	Endpoint	Auth	Description
GET	/	None	List all products
GET	/:id	None	Get product by ID
POST	/	Admin	Create product
PUT	/:id	Admin	Update product
DELETE	/:id	Admin	Delete product
POST	/:id/reviews	User	Add review to product
Categories (/api/categories)
Method	Endpoint	Auth	Description
GET	/	None	List all categories
POST	/	Admin	Create category
DELETE	/:id	Admin	Delete category
Orders (/api/orders)
Method	Endpoint	Auth	Description
GET	/	User/Admin	List orders
POST	/	User	Create order
PATCH	/mark-viewed	Admin	Mark all as viewed
Bulk Orders (/api/bulk-orders)
Method	Endpoint	Auth	Description
GET	/	User/Admin	List bulk orders (filter by status)
POST	/	User	Create bulk order
PATCH	/:id/confirm	Admin	Confirm bulk order
PATCH	/:id/cancel	Admin	Cancel bulk order
Inventory (/api/inventory)
Method	Endpoint	Auth	Description
GET	/	Admin	List inventory (with filters)
GET	/:id	Admin	Get single item
POST	/	Admin	Create inventory item
PUT	/:id	Admin	Update inventory item
DELETE	/:id	Admin	Delete inventory item
Notifications (/api/notifications)
Method	Endpoint	Auth	Description
GET	/:email	User	Get notifications by email
PATCH	/:id/read	User	Mark single as read
PATCH	/mark-all-read/:email	User	Mark all as read
Improvement Recommendations
1. Security Hardening
CAUTION

Passwords are stored in plain text — both User and Admin models store raw passwords. This is the #1 priority fix.

Issue	Current	Recommended
Password storage	Plain text	bcrypt hash + salt
JWT secret	Hardcoded fallback	Env-only, no fallback
CORS	Allow all origins	Whitelist production domains
Rate limiting	None	express-rate-limit on auth routes
Input sanitization	None	express-mongo-sanitize
Helmet headers	None	helmet middleware
2. Validation
Issue	Recommended
No request validation	Add express-validator or joi middleware on all POST/PUT routes
No email format check	Validate email formats on register/login
No password strength	Enforce min length, complexity rules
No numeric bounds	Validate price > 0, stock ≥ 0, rating 1-5
3. Error Handling
Issue	Recommended
Inconsistent error responses	Create AppError class with status codes
No global error handler	Add centralized errorHandler middleware
Silent failures	Add structured logging (winston/pino)
Unhandled promise rejections	Add process-level handlers
4. Missing Features to Complete
Feature	Status	What's Needed
Admin Dashboard Analytics	Partial (frontend exists)	Backend /api/analytics endpoint with aggregation pipelines
Ratings & Reviews	Embedded in Product	Consider standalone Rating model for querying/filtering
Order Status Updates	Status field exists	Add PATCH endpoint + status transition flow
Cart Persistence	Client-side only	Consider server-side cart for multi-device sync
Password Reset	Not implemented	Add forgot/reset password flow
Image Upload	Base64 in JSON	Consider Cloudinary/S3 for proper file uploads
Pagination	No pagination	Add skip/limit query params to all list endpoints
5. Code Architecture
Area	Recommendation
Route handlers	Extract business logic into a controllers/ layer
Config management	Centralize all env vars into a typed config.js
Database indexes	Add compound indexes on frequently queried fields (e.g. Order.customer.email + status)
API versioning	Prefix routes with /api/v1/ for future compatibility
Verification Plan
This document is a read-only architecture overview — no code changes are proposed. Verification consists of:

Manual Verification
Review accuracy: Confirm that the folder structure, models, and API endpoints match the actual codebase
Review recommendations: Assess whether the improvement items align with project priorities
NOTE

This is a documentation artifact. If you'd like me to implement any of the recommended improvements (password hashing, validation middleware, analytics endpoint, etc.), just let me know which items to prioritize and I'll create a separate implementation plan for those.