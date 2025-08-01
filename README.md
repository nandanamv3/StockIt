## Inventory and Order Management System for Small Businesses

## Problem: Inventory and Order Management System for Small Businesses

**Challenge Brief:** Design and build a web-based inventory and order management system tailored for small shop owners or vendors. The system should simplify tracking of stock levels, streamline order processing, and provide essential insights like low-stock alerts and daily sales summaries, helping businesses operate efficiently with minimal technical

## Solution: StockIt - Inventory Management System

A full-stack inventory management solution built with React and Supabase. This system handles real-time inventory tracking, order processing, and business insights tailored for small and growing businesses.

### Features:

• Real-time Inventory: View and manage live stock levels with alerts for low stock. It also has a dynamic search bar and stock status filter

• User Authentication: Secure login for admin/shop owner(s).

• Product Management: Add, edit, and remove products with ease, product filter based on category of each product. Includes product filtering based on each product's category.

• Order Handling: Create and manage orders; auto-update inventory on order completion.

• Sales Dashboard: Visualize total sales, top products on stock, low stock alerts and trends.

### Tech Stack

• Frontend: React + Tailwind CSS

• Backend: Supabase (Database, Auth, Realtime)

• Charts: Recharts

## Getting Started

### Prerequisites

• Node.js 16+

• Supabase account

### Installation

1. Clone and Install

```bash
git clone [repository-url]
cd inventory-management-system
npm install
```

2. Configure Environment

```bash
cp .env.example .env.local
```

Add your Supabase credentials in .env.local:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Setup Database
   • Create necessary tables using Supabase dashboard.
   
   • Enable authentication.

5. Start Development Server

```bash
npm run dev
```

## Project Structure

```bash
inventory-management-system/
├── public/           # Static files
├── src/              # React components & pages
├── .env.local        # Supabase keys
├── package.json      # Dependencies
├── vite.config.js    # Vite setup
```

## Deployment

1. Build Project

```bash
npm run build
```

2. Host on: Vercel (recommended), Netlify, or custom server.

**Development Time:** 1 day
**Technology Stack:** React, Supabase, Tailwind CSS
