# Inventory Management System

A comprehensive web-based inventory and order management system built for small businesses. This system helps shop owners track stock levels, manage orders, and get insights into their business performance.

## Features

### 🔐 User Authentication
- Secure login and signup system
- Role-based access control (Admin/Staff)
- Protected routes and permissions

### 📦 Product Management
- Add, edit, and delete products
- Track product information (name, SKU, price, category, images)
- Set low stock thresholds for automatic alerts
- Real-time inventory tracking

### 📋 Order Management
- Create and manage customer orders
- Track order status (pending, completed, cancelled)
- Automatic inventory updates when orders are processed
- Detailed order views with itemized lists

### 📊 Dashboard & Analytics
- Real-time business metrics
- Low stock alerts
- Recent orders overview
- Sales summaries (daily, total)
- Visual charts and insights

### 📈 Inventory Monitoring
- Low stock alerts and notifications
- Inventory transaction history
- Product movement tracking
- Stock level warnings

### 📄 Reports & Export
- Export inventory lists (CSV/PDF)
- Sales reports with date ranges
- Customizable reporting options

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Icons**: Heroicons

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd inventory-management
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
4. Update `.env.local` with your Supabase credentials:
```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-schema.sql`
4. Run the SQL to create all tables, triggers, and policies

### 5. Start the Development Server
```bash
npm start
```

The application will open at `http://localhost:3000`

## Usage

### First Time Setup

1. **Create an Account**: Sign up with an email and password
2. **First User is Admin**: The first user created will have admin privileges
3. **Add Products**: Start by adding your inventory items
4. **Create Orders**: Begin processing customer orders
5. **Monitor Dashboard**: Use the dashboard to track your business metrics

### User Roles

- **Admin**: Full access to all features including product management, order processing, and system administration
- **Staff**: Can view products and orders, create new orders, but cannot modify product catalog

### Key Workflows

#### Adding Products
1. Navigate to Products page
2. Click "Add Product"
3. Fill in product details (name, SKU, price, quantity, etc.)
4. Set low stock threshold for alerts
5. Save the product

#### Processing Orders
1. Go to Orders page
2. Click "New Order"
3. Add customer information (optional)
4. Select products and quantities
5. Review total and submit order
6. Update order status as it progresses

#### Monitoring Inventory
1. Check Dashboard for low stock alerts
2. Review inventory levels in Products page
3. Look for red highlighted items (below threshold)
4. Restock as needed

## Database Schema

The system uses the following main tables:

- **users**: Extended user profiles with roles
- **products**: Product catalog with inventory levels
- **orders**: Customer orders with status tracking
- **order_items**: Line items for each order
- **inventory_transactions**: Audit trail for stock movements

## Security Features

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Secure authentication with Supabase Auth
- Protected API endpoints
- Input validation and sanitization

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   ├── layout/         # Layout components
│   ├── orders/         # Order management
│   └── products/       # Product management
├── contexts/           # React contexts
├── config/            # Configuration files
└── types/             # TypeScript type definitions
```

### Available Scripts

- `npm start`: Start development server
- `npm build`: Build for production
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App

### Environment Variables

- `REACT_APP_SUPABASE_URL`: Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

1. **Authentication not working**: Check your Supabase URL and keys in `.env.local`
2. **Database errors**: Ensure you've run the database schema setup
3. **Build fails**: Check for TypeScript errors and missing dependencies
4. **Images not loading**: Verify image URLs are accessible

### Support

For support and questions, please open an issue in the repository or contact the development team.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Create React App
- UI components inspired by Tailwind UI
- Icons by Heroicons
- Database and authentication by Supabase
