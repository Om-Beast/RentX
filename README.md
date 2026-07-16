<div align="center">

# 🚗 RentX

### A Production-Grade Vehicle Rental Marketplace

*Connecting fleet owners and customers through a secure, transaction-safe booking and payment platform.*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-000000?style=for-the-badge)](https://your-live-demo-url.vercel.app)
[![Source Code](https://img.shields.io/badge/📂_Source_Code-181717?style=for-the-badge&logo=github)](https://github.com/your-username/rentx)

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-0C2451?style=flat-square&logo=razorpay&logoColor=white)
![JWT](https://img.shields.io/badge/JWT_Auth-black?style=flat-square&logo=jsonwebtokens&logoColor=white)

![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Status](https://img.shields.io/badge/status-active_development-brightgreen?style=flat-square)

</div>

<br>

## 📖 Introduction

RentX is a full-stack vehicle rental platform built on the MERN stack, modeled after real-world marketplaces like Zoomcar and Turo. Rather than a simple listings-and-forms app, RentX is built around the two hardest parts of any rental marketplace: **keeping bookings consistent under concurrent access** and **moving money safely**. The platform supports two distinct roles — customers who browse and book vehicles, and fleet owners who list and manage their inventory — each with a dedicated dashboard and workflow.

<br>

## 📸 Screenshots

<div align="center">

| Home | Vehicle Listing | Vehicle Details |
|:---:|:---:|:---:|
| ![Home](https://via.placeholder.com/300x180?text=Home+Page) | ![Listing](https://via.placeholder.com/300x180?text=Vehicle+Listing) | ![Details](https://via.placeholder.com/300x180?text=Vehicle+Details) |

| Checkout | Payment | Booking Success |
|:---:|:---:|:---:|
| ![Checkout](https://via.placeholder.com/300x180?text=Checkout) | ![Payment](https://via.placeholder.com/300x180?text=Razorpay+Payment) | ![Success](https://via.placeholder.com/300x180?text=Booking+Success) |

| Fleet Dashboard | My Vehicles | Booking Requests |
|:---:|:---:|:---:|
| ![Fleet Dashboard](https://via.placeholder.com/300x180?text=Fleet+Dashboard) | ![My Vehicles](https://via.placeholder.com/300x180?text=My+Vehicles) | ![Requests](https://via.placeholder.com/300x180?text=Booking+Requests) |

| Analytics |
|:---:|
| ![Analytics](https://via.placeholder.com/300x180?text=Analytics) |

</div>

> Replace the placeholder links above with real screenshots or GIFs before publishing — recruiters open the images before they open the code.

<br>

## 🏗️ Architecture

```mermaid
flowchart TD
    subgraph Client["🖥️ Client Layer"]
        A["React 19 + Vite<br/>Tailwind CSS · Framer Motion"]
    end

    subgraph API["⚙️ API Layer"]
        B["Express.js REST API"]
        C["JWT Auth Middleware"]
        D["Role-Based Access Control"]
    end

    subgraph Services["🔌 External Services"]
        E["Cloudinary<br/>Image Storage"]
        F["Razorpay<br/>Payment Gateway"]
    end

    subgraph Data["🗄️ Data Layer"]
        G[("MongoDB Atlas")]
    end

    subgraph Surfaces["📊 Application Surfaces"]
        H["Customer Dashboard"]
        I["Fleet Owner Dashboard"]
    end

    A -->|"Axios / HTTPS"| B
    B --> C --> D
    D --> G
    B --> E
    B --> F
    G --> H
    G --> I
```

<br>

## 🔀 Project Flow

<details>
<summary><strong>Customer Journey</strong></summary>

```mermaid
flowchart LR
    A[Register / Login] --> B[Browse Vehicles]
    B --> C[View Vehicle Details]
    C --> D[Select Dates & Book]
    D --> E[Checkout]
    E --> F[Razorpay Payment]
    F --> G[Booking Success]
    G --> H[My Bookings]
```
</details>

<details>
<summary><strong>Fleet Owner Journey</strong></summary>

```mermaid
flowchart LR
    A[Register / Login] --> B[Add Vehicle]
    B --> C[Upload Images via Cloudinary]
    C --> D[Toggle Availability]
    D --> E[Receive Booking Requests]
    E --> F[Approve / Reject Request]
    F --> G[Track Revenue on Fleet Dashboard]
```
</details>

<details>
<summary><strong>Booking Flow</strong></summary>

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB

    C->>F: Select vehicle & dates
    F->>B: POST /api/bookings
    B->>DB: Check vehicle availability
    DB-->>B: Availability status
    B->>DB: Create booking (status: pending)
    DB-->>B: Booking created
    B-->>F: Booking ID + summary
    F-->>C: Redirect to checkout
```
</details>

<details>
<summary><strong>Payment Flow</strong></summary>

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend
    participant B as Backend
    participant R as Razorpay

    C->>F: Confirm checkout
    F->>B: POST /api/payments/create-order
    B->>R: Create Razorpay order
    R-->>B: Order ID
    B-->>F: Order details
    F->>R: Open Razorpay checkout widget
    R-->>F: Payment response + signature
    F->>B: POST /api/payments/verify
    B->>B: Verify Razorpay signature
    B-->>F: Payment confirmed
    F-->>C: Booking success page
```
</details>

<br>

## 📁 Folder Structure

```
RentX/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/                # Route-level pages
│   │   ├── context/               # Auth / global state
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── utils/                  # Helpers, API client
│   │   ├── assets/
│   │   └── App.jsx
│   ├── public/
│   └── vite.config.js
│
├── server/                      # Express backend
│   ├── controllers/              # Route handlers
│   ├── models/                    # Mongoose schemas
│   ├── routes/                    # API route definitions
│   ├── middleware/               # Auth, RBAC, error handling
│   ├── config/                    # DB, Cloudinary, Razorpay config
│   ├── utils/
│   └── server.js
│
├── .env.example
├── .gitignore
└── README.md
```

<br>

## ✨ Features

| Module | Capabilities |
|---|---|
| **Authentication** | Register, login, JWT-based sessions, protected API routes, role-based access control |
| **Customer** | Browse vehicles, view details, book, checkout, Razorpay payment, booking success page, booking history |
| **Fleet Owner** | Add / edit / delete vehicles, toggle availability, manage listings, view & respond to booking requests |
| **Dashboard** | Revenue summary, total vehicles, pending requests, recent bookings analytics |
| **Booking System** | Availability checks, booking validation, status tracking, booking history |
| **Security** | JWT verification, middleware-protected routes, Razorpay payment signature verification |

<br>

## 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router, Axios, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose |
| **Authentication** | JWT, Protected Routes, Role-Based Access |
| **Payments** | Razorpay, Signature Verification |
| **Storage** | Cloudinary |
| **Deployment** | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

<br>

## 🔌 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Log in and receive a JWT | No |
| `GET` | `/api/vehicles` | List all available vehicles | No |
| `GET` | `/api/vehicles/:id` | Get vehicle details | No |
| `POST` | `/api/vehicles` | Add a new vehicle | Yes (Fleet Owner) |
| `PUT` | `/api/vehicles/:id` | Update vehicle details | Yes (Fleet Owner) |
| `DELETE` | `/api/vehicles/:id` | Remove a vehicle | Yes (Fleet Owner) |
| `PATCH` | `/api/vehicles/:id/availability` | Toggle availability | Yes (Fleet Owner) |
| `POST` | `/api/bookings` | Create a booking | Yes (Customer) |
| `GET` | `/api/bookings/me` | Get my bookings | Yes (Customer) |
| `GET` | `/api/bookings/requests` | Get incoming requests | Yes (Fleet Owner) |
| `PATCH` | `/api/bookings/:id/status` | Approve / reject a booking | Yes (Fleet Owner) |
| `POST` | `/api/payments/create-order` | Create a Razorpay order | Yes |
| `POST` | `/api/payments/verify` | Verify payment signature | Yes |
| `GET` | `/api/dashboard/analytics` | Fleet owner analytics | Yes (Fleet Owner) |

<br>

## 🗄️ Database Collections

| Collection | Key Fields |
|---|---|
| **Users** | `name`, `email`, `password (hashed)`, `role`, `createdAt` |
| **Vehicles** | `ownerId`, `title`, `type`, `pricePerDay`, `images[]`, `isAvailable`, `location` |
| **Bookings** | `customerId`, `vehicleId`, `startDate`, `endDate`, `status`, `totalAmount` |
| **Payments** | `bookingId`, `razorpayOrderId`, `razorpayPaymentId`, `signature`, `status`, `amount` |

<br>

## 🔐 Security Features

- Password hashing before storage
- JWT-based stateless authentication
- Middleware-enforced route protection
- Role-based access control (Customer vs. Fleet Owner)
- Razorpay payment signature verification to prevent payment spoofing
- Environment-based secrets management (no credentials in source)

<br>

## ⚡ Performance Considerations

- Indexed MongoDB queries on frequently filtered fields (availability, owner, date range)
- Cloudinary-hosted images with automatic optimization and CDN delivery
- Vite-powered frontend build for fast dev server and optimized production bundles
- Component-level code splitting on route boundaries

<br>

## 🔑 Environment Variables

**Server (`server/.env`)**

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLIENT_URL=http://localhost:5173
```

**Client (`client/.env`)**

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

<br>

## 🚀 Local Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/rentx.git
cd rentx

# 2. Install server dependencies
cd server
npm install
cp .env.example .env   # then fill in your values

# 3. Install client dependencies
cd ../client
npm install
cp .env.example .env   # then fill in your values

# 4. Run the backend
cd ../server
npm run dev

# 5. Run the frontend (in a separate terminal)
cd ../client
npm run dev
```

The app will be available at `http://localhost:5173`, with the API running at `http://localhost:5000`.

<br>

## ☁️ Deployment Guide

| Component | Platform | Notes |
|---|---|---|
| **Frontend** | Vercel | Set `VITE_API_BASE_URL` to your deployed backend URL in project env settings |
| **Backend** | Render | Set all server `.env` variables in the Render dashboard; enable auto-deploy from `main` |
| **Database** | MongoDB Atlas | Whitelist Render's outbound IPs (or `0.0.0.0/0` for simplicity during development) |

<br>

## 🛣️ Future Roadmap

- [ ] Google OAuth login
- [ ] Redis caching for high-traffic read endpoints
- [ ] Email verification on signup
- [ ] In-app and email notifications for booking status changes
- [ ] AI-powered vehicle recommendations
- [ ] Admin dashboard for platform-wide moderation

<br>

## 🤝 Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

```bash
# Fork, then:
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

<br>

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<br>

## 👤 Author

**Your Name**

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/your-username)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/your-profile)

<div align="center">

*Built as a demonstration of production-grade full-stack engineering — booking consistency, payment integrity, and role-based workflows over CRUD.*

</div>
