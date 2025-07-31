import { Routes, Route } from 'react-router-dom';
import Products from './pages/Products';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/products" element={<Products />} />
        <Route path="/" element={<h1>Welcome to Product Management</h1>} />
      </Routes>
    </div>
  );
}

export default App;