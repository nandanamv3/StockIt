# StockIt - Inventory Management System

A modern web-based inventory and order management system built for small businesses using React, Tailwind CSS, and Supabase.

## Features

### Current Implementation
- **Sidebar Navigation**: Clean navigation between different sections
- **Inventory Log Page**: Comprehensive stock movement tracking
  - Real-time stock change monitoring
  - Low stock alerts with visual indicators
  - Stock in/out tracking with detailed history
  - Search and filter functionality
  - Visual statistics and summaries

### Planned Features
- Dashboard with sales insights and analytics
- Product Management (CRUD operations)
- Order Management system
- Reports and export functionality
- User authentication
- Real-time notifications

## Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Database**: Supabase (configured but not connected)
- **Date Handling**: date-fns

## Database Schema

The application is designed to work with the following tables:

- **products**: Product information (id, name, sku, quantity, price, category, etc.)
- **orders**: Customer orders
- **order_items**: Individual items within orders
- **inventory_logs**: Stock movement history

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stockit
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file and add your Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx          # Dashboard page (placeholder)
│   ├── InventoryLog.jsx       # Main inventory log page
│   ├── OrderManagement.jsx    # Order management (placeholder)
│   ├── ProductManagement.jsx  # Product management (placeholder)
│   ├── Reports.jsx           # Reports page (placeholder)
│   └── Sidebar.jsx           # Navigation sidebar
├── utils/
│   └── supabase.js           # Supabase configuration and utilities
├── App.jsx                   # Main app component with routing
├── main.jsx                  # App entry point
└── index.css                 # Global styles
```

## Inventory Log Features

### Current Features
- **Stock Movement Tracking**: View all stock changes with detailed history
- **Low Stock Alerts**: Visual alerts for products below threshold
- **Search & Filter**: Find specific products and filter by stock movement type
- **Statistics**: Real-time calculations of total stock in/out and low stock items
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Mock Data
The application currently uses mock data for demonstration. To connect to a real Supabase database:

1. Update `src/utils/supabase.js` with your actual Supabase credentials
2. Replace the mock data in `InventoryLog.jsx` with actual database calls
3. Uncomment the Supabase service calls in the component

## Customization

### Adding New Features
1. Create new components in the `src/components` directory
2. Add routes in `App.jsx`
3. Update the sidebar navigation in `Sidebar.jsx`

### Styling
The application uses Tailwind CSS for styling. You can customize:
- Colors by modifying the color classes
- Layout by adjusting the grid and flexbox classes
- Components by editing the existing Tailwind classes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please create an issue in the repository.