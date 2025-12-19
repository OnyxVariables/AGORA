import {UserIcon, VoteIcon, ResultsIcon, LogoutIcon, HomeIcon} from "../icons";

//Logica que controla la navegacion / botones / svg
export const NAV_ITEMS = {
  home: [
    { to: "/perfil", label: "NICKNAME", icon: UserIcon },
    { to: "/votar", label: "VOTAR", icon: VoteIcon },
    { to: "/resultados", label: "RESULTADOS", icon: ResultsIcon },
    { to: "/", label: "SALIR", icon: LogoutIcon },
  ],

  perfil: [
    { to: "/home", label: "INICIO", icon: HomeIcon },
    { to: "/votar", label: "VOTAR", icon: VoteIcon },
    { to: "/resultados", label: "RESULTADOS", icon: ResultsIcon },
    { to: "/", label: "SALIR", icon: LogoutIcon },
  ],

  votar: [
    { to: "/home", label: "INICIO", icon: HomeIcon },
    { to: "/perfil", label: "NICKNAME", icon: UserIcon },
    { to: "/resultados", label: "RESULTADOS", icon: ResultsIcon },
    { to: "/", label: "SALIR", icon: LogoutIcon },
  ],

  resultados: [
    { to: "/home", label: "INICIO", icon: HomeIcon },
    { to: "/perfil", label: "NICKNAME", icon: UserIcon },
    { to: "/votar", label: "VOTAR", icon: VoteIcon },
    { to: "/", label: "SALIR", icon: LogoutIcon },
  ],
};