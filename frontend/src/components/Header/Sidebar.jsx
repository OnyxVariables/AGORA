import { Link } from "react-router-dom";

function Sidebar({ open, close, items, onLogout }) {
  return (
    <aside className={`sidebar header__sidebar ${open ? "open" : ""}`} id="sidebar">
      <div className="input header__sidebar-list">
        {items.map(({ to, label, icon: Icon }) => {
           if (label === "SALIR") {
            return (
              <button 
                key={label} 
                className="value header__sidebar-item" 
                onClick={(e) => {
                  e.preventDefault(); 
                  onLogout();
                  close();
                }}
              >
                <Icon />
                <span>{label}</span>
              </button>
            );
          }

          if (label === "EXPORTAR") {
            return (
              <button
                key={label}
                type="button"
                className="value header__sidebar-item"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("agora-export-metrics"));
                  close();
                }}
              >
                <Icon />
                <span>{label}</span>
              </button>
            );
          }
          
          return (
            <Link key={to} to={to} className="value header__sidebar-item" onClick={close}>
              {<Icon />}
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

export default Sidebar;
