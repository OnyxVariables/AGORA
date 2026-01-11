import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import Index from "./pages/index/index";
import Home from "./pages/Home/Home";
import Perfil from "./pages/Perfil/Perfil";
import Votar from "./pages/Votar/Votar";
import Resultados from "./pages/Resultados/Resultados";
import Error404 from "./pages/error404/error404";
import CRUDVotations from "./pages/CRUDVotations/CRUDVotations";
import Metrics from "./pages/Metrics/Metrics";

function App() {
  return (
    <Router>
      <div className="app-background"> {/* Envuelvo todas las rutas en un contenedor para que les afecte el background */}
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Rutas ciudadano */}
          <Route element={<PrivateRoute roleRequired={2} />}>
            <Route path="/Home" element={<Home />} />
            <Route path="/Perfil" element={<Perfil />} />
            <Route path="/Votar" element={<Votar />} />
            <Route path="/Resultados" element={<Resultados />} />
          </Route>

          {/* Rutas admin */}
          <Route element={<PrivateRoute roleRequired={1} />}>
            <Route path="/CRUDVotations" element={<CRUDVotations />} />
            <Route path="/metrics" element={<Metrics />} />
          </Route>

          <Route path="/*" element={<Error404 />} />
          </Routes>
      </div>
    </Router>
  );
}

export default App;