import {
  UserIcon,
  VoteIcon,
  ResultsIcon,
  LogoutIcon,
  HomeIcon,
  MetricsIcon,
  CRUDVotationIcon,
  ExportIcon,
  MonitorIcon,
  PartyIcon,
} from "../icons";

//Logica que controla la navegacion / botones / svg
export const NAV_ITEMS = {
  home: [
    { to: "/perfil", label: "NICKNAME", icon: UserIcon },
    { to: "/votar", label: "VOTAR", icon: VoteIcon },
    { to: "/resultados", label: "RESULTADOS", icon: ResultsIcon },
    { to: "#", label: "SALIR", icon: LogoutIcon },
  ],

  perfil: [
    { to: "/home", label: "INICIO", icon: HomeIcon },
    { to: "/votar", label: "VOTAR", icon: VoteIcon },
    { to: "/resultados", label: "RESULTADOS", icon: ResultsIcon },
    { to: "#", label: "SALIR", icon: LogoutIcon },
  ],

  votar: [
    { to: "/home", label: "INICIO", icon: HomeIcon },
    { to: "/perfil", label: "NICKNAME", icon: UserIcon },
    { to: "/resultados", label: "RESULTADOS", icon: ResultsIcon },
    { to: "#", label: "SALIR", icon: LogoutIcon },
  ],

  resultados: [
    { to: "/home", label: "INICIO", icon: HomeIcon },
    { to: "/perfil", label: "NICKNAME", icon: UserIcon },
    { to: "/votar", label: "VOTAR", icon: VoteIcon },
    { to: "#", label: "SALIR", icon: LogoutIcon },
  ],

  crudvotations: [
    { to: "/metrics", label: "MÉTRICAS", icon: MetricsIcon },
    { to: "/crudparties", label: "PARTIDOS", icon: PartyIcon },
    { to: "/admin/monitor", label: "MONITOR", icon: MonitorIcon },
    { to: "#", label: "SALIR", icon: LogoutIcon },
  ],

  metrics: [
    { to: "/metrics", label: "EXPORTAR", icon: ExportIcon },
    { to: "/crudvotations", label: "VOTACIONES", icon: CRUDVotationIcon },
    { to: "/crudparties", label: "PARTIDOS", icon: PartyIcon },
    { to: "/admin/monitor", label: "MONITOR", icon: MonitorIcon },
    { to: "#", label: "SALIR", icon: LogoutIcon },
  ],

  monitor: [
    { to: "/metrics", label: "MÉTRICAS", icon: MetricsIcon },
    { to: "/crudvotations", label: "VOTACIONES", icon: CRUDVotationIcon },
    { to: "/crudparties", label: "PARTIDOS", icon: PartyIcon },
    { to: "#", label: "SALIR", icon: LogoutIcon },
  ],

  crudparties: [
    { to: "/metrics", label: "MÉTRICAS", icon: MetricsIcon },
    { to: "/crudvotations", label: "VOTACIONES", icon: CRUDVotationIcon },
    { to: "/admin/monitor", label: "MONITOR", icon: MonitorIcon },
    { to: "#", label: "SALIR", icon: LogoutIcon },
  ],
};
