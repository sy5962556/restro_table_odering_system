# 🚀 Vercel Deployment Guide

This guide walks you through deploying the **Smart Restaurant QR Table Ordering & Management System** monorepo to **Vercel** with MongoDB Atlas database integration.

---

## 📋 Prerequisites

1. A **Vercel Account** ([sign up for free at vercel.com](https://vercel.com/signup))
2. A **MongoDB Atlas Account** ([sign up for free at mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
3. The project code pushed to a **GitHub / GitLab / Bitbucket repository** (or Vercel CLI installed).

---

## 🗄️ Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Log into [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a new **M0 Free Cluster** (or select an existing database).
3. Under **Database Access**:
   - Create a database user (e.g. `dbAdmin`) and copy the generated password.
4. Under **Network Access**:
   - Add IP Address `0.0.0.0/0` (Allow access from anywhere, required for Vercel Serverless Functions).
5. Click **Connect** -> **Drivers** -> Copy the Connection String:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/restaurant_qr_system?retryWrites=true&w=majority
   ```
   *(Replace `<username>` and `<password>` with your actual credentials).*

---

## ⚡ Step 2: Deploy to Vercel (Option A — Vercel Dashboard, Recommended)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`table_odering_system`).
4. Configure Project Settings:
   - **Framework Preset**: `Vite` (or select `Other`)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run vercel-build` (automatically configured via `vercel.json`)
   - **Output Directory**: `client/dist` (automatically configured via `vercel.json`)

5. Expand **Environment Variables** and add the following:

   | Name | Value | Required / Optional |
   | :--- | :--- | :--- |
   | `MONGO_URI` | `mongodb+srv://<user>:<pass>@cluster0.abcde.mongodb.net/restaurant_qr_system?retryWrites=true&w=majority` | **REQUIRED** |
   | `JWT_SECRET` | `your_super_secret_jwt_key_here` | **REQUIRED** |
   | `NODE_ENV` | `production` | Recommended |

6. Click **Deploy**. Vercel will install dependencies, build the Vite React frontend, compile the Express serverless API function, and assign your project a live domain (e.g. `https://your-app.vercel.app`).

---

## 💻 Step 3: Deploy via Vercel CLI (Option B)

If you prefer using the command line:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

When prompted for Environment Variables in the CLI or Vercel Dashboard settings, provide your `MONGO_URI` and `JWT_SECRET`.

---

## ⚙️ How Vercel Deployment Architecture Works

- **`vercel.json`**:
  - Directs API calls (`/api/...`) to the Vercel Serverless Express Function (`api/index.js`).
  - Directs all frontend SPA page navigation to `client/dist/index.html`.
- **Database Connection Caching**:
  - The API function utilizes Mongoose connection pooling (`mongoose.connection.readyState === 1`) to preserve MongoDB connection pools across serverless lambda invocations.
- **Real-Time Updates**:
  - WebSockets automatically fallback to 10-second background HTTP polling for Kitchen KDS, Live Orders, and Order Tracking pages, ensuring live updates run smoothly on serverless infrastructure out-of-the-box.

---

## 🛠️ Verification & Troubleshooting

1. **Test API Health**:
   Visit `https://your-app.vercel.app/api/health` in your browser. You should receive:
   ```json
   {
     "status": "online",
     "environment": "Vercel Serverless Function",
     "message": "Restaurant Smart QR Table Ordering System API is running smoothly",
     "timestamp": "..."
   }
   ```

2. **Auto Data Seeding**:
   Upon first API hit with a fresh MongoDB database, the system will automatically seed default tenant data, menus, and accounts.

3. **Check Vercel Function Logs**:
   If you encounter a 500 error, visit your Vercel Project -> **Logs** tab to view serverless console error output.
