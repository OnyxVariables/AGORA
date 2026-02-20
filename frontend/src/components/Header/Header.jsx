import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./Header.css";
import { Link } from "react-router-dom";
import { NAV_ITEMS } from "../../config/navigation";

function Header({ menu }) {
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
      <header>
        <div className="primerDiv">
          {/* LOGO */}
          <figure className="logo">
            <img src="/img/LogoAgora.png" alt="Logo" />
            <h1>Agora</h1>
          </figure>

          {/* HAMBURGUESA */}
          <label className="bar">
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
          <nav>
            {items.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="boton">
                <Icon /> {label}{" "}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <Sidebar
        open={sidebarOpen}
        close={() => setSidebarOpen(false)}
        items={items}
      />
    </>
  );
}

export default Header;
