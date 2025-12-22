import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/index/index";
import Home from "./pages/Home/Home";
import Perfil from "./pages/Perfil/Perfil";
import Votar from "./pages/Votar/Votar";
import Resultados from "./pages/Resultados/Resultados";
import ThemeToggle from "./components/ThemeToggle/ThemeToggle";

function App() {
  return (
    <Router>
      <div className="app-background"> {/* Envuelvo todas las rutas en un contenedor para que les afecte el background */}
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/Perfil" element={<Perfil />} />
          <Route path="/Votar" element={<Votar />} />
          <Route path="/Resultados" element={<Resultados />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;