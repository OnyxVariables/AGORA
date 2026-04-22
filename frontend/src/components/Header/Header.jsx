import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./Header.css";
import { Link } from "react-router-dom";
import { NAV_ITEMS } from "../../config/navigation";
import { useAuth } from "../../components/PrivateRoute/AuthContext";

function Header({ menu }) {
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const items = NAV_ITEMS[menu];

  useEffect(() => {
    const handleClickOutside = (e) => {
      const sidebar = document.getElementById("sidebar");
      const bar = document.querySelector(".bar");
      if (
        sidebar &&
        bar &&
        !sidebar.contains(e.target) &&
        !bar.contains(e.target)
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 800) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <header className="header">
        <div className="primerDiv header__inner">
          {/* LOGO */}
          <figure className="logo header__brand">
            <img className="header__brand-image" src="/img/LogoAgora.png" alt="Logo" />
            <h1 className="header__brand-title">Agora</h1>
          </figure>

          {/* HAMBURGUESA */}
          <label className="bar header__toggle">
            <input
              type="checkbox"
              checked={sidebarOpen}
              onChange={toggleSidebar}
            />
            <span className="top"></span>
            <span className="middle"></span>
            <span className="bottom"></span>
          </label>

          {/* NAV escritorio */}
          <nav className="header__nav">
            {items.map(({ to, label, icon: Icon }) => {
              if (label === "SALIR") {
                return (
                  <button 
                    key={label}  
                    className="boton" 
                    onClick={(e) => {
                      e.preventDefault(); // O sino da error 405 (método no permitido)
                      logout(); 
                    }}
                  >
                    <Icon /> {label}
                  </button>
                );
              }

              if (label === "EXPORTAR") {
                return (
                  <button
                    key={label}
                    type="button"
                    className="boton"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("agora-export-metrics"));
                    }}
                  >
                    <Icon /> {label}
                  </button>
                );
              }
              
              return (
                <Link key={to} to={to} className="boton">
                  <Icon /> {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <Sidebar
        open={sidebarOpen}
        close={() => setSidebarOpen(false)}
        items={items}
        onLogout={logout} 
      />
    </>
  );
}

export default Header;
