import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PagoExitoso from './pages/PagoExitoso';
import PasosPago from './pages/PasosPago';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... otras rutas */}
        <Route path="/evento/:eventId/paso/4" element={<PasosPago />} />
        <Route path="/pago-exitoso" element={<PagoExitoso />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;