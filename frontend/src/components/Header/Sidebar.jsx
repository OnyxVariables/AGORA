import { Link } from "react-router-dom";
import {
  UserIcon,
  VoteIcon,
  ResultsIcon,
  LogoutIcon,
  HomeIcon,
} from "../../icons";

function Sidebar({ open, close, items }) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`} id="sidebar">
      <div className="input">
        {items.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="value" onClick={close}>
            {<Icon />}
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;
