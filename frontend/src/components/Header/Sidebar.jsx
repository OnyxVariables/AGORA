import { Link } from "react-router-dom";

function Sidebar({ open, close, items, onLogout }) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`} id="sidebar">
      <div className="input">
        {items.map(({ to, label, icon: Icon }) => {
           if (label === "SALIR") {
            return (
              <button 
                key={label} 
                className="value" 
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
          
          return (
            <Link key={to} to={to} className="value" onClick={close}>
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
