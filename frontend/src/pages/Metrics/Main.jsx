import { useEffect, useState } from "react";

import "./Main.css";
import SectionContainer from "../../components/SectionContainer/SectionContainer";
import Select from "../../components/Select/Select";
import Table from "../../components/Table/Table";
import ChartSection from "../../components/ChartSection/ChartSection";

export default function Main() {
  const [votations, setVotations] = useState({});
  const [blocks, setBlocks] = useState({});

  // TODO(srvariable): Get data from database
  useEffect(() => {
    setVotations({
      id: "votations",
      headings: ["ID", "Título", "Fecha Inicio", "Fecha Fin", "Hash"],
      rows: [
        {
          id: 1,
          title: "Elecciones 2026",
          startDate: "2025-05-12",
          endDate: "2025-05-12",
          hash: Math.random().toString(36).substring(2),
        },
        {
          id: 2,
          title: "Elecciones 2029",
          startDate: "2029-05-12",
          endDate: "2029-05-12",
          hash: Math.random().toString(36).substring(2),
        },
        {
          id: 3,
          title: "Elecciones 2033",
          startDate: "2033-05-12",
          endDate: "2033-05-12",
          hash: Math.random().toString(36).substring(2),
        },
        {
          id: 4,
          title: "Elecciones 2037",
          startDate: "2037-05-12",
          endDate: "2037-05-12",
          hash: Math.random().toString(36).substring(2),
        },
        {
          id: 5,
          title: "Elecciones 2041",
          startDate: "2041-05-12",
          endDate: "2041-05-12",
          hash: Math.random().toString(36).substring(2),
        },
      ],
    });

    setBlocks({
      id: "blocks",
      headings: [
        "Participantes",
        "Votos",
        "% Participantes",
        "Nº Bloques",
        "Votos válidos",
      ],
      rows: [
        {
          participants: 10521,
          votes: 10000,
          participantPercentage: 97,
          blocks: 500,
          validVotes: 9500,
        },
        {
          participants: 20456,
          votes: 15000,
          participantPercentage: 84,
          blocks: 1000,
          validVotes: 19852,
        },
        {
          participants: 15890,
          votes: 7000,
          participantPercentage: 45,
          blocks: 750,
          validVotes: 14999,
        },
        {
          participants: 83456,
          votes: 42897,
          participantPercentage: 53,
          blocks: 3056,
          validVotes: 83400,
        },
        {
          participants: 53675,
          votes: 25678,
          participantPercentage: 48,
          blocks: 2500,
          validVotes: 53000,
        },
      ],
    });
  }, []);

  return (
    <main className="main">
      <SectionContainer>
        <Select
          id="votationId"
          label="Escoge un ID para ver métricas de las votaciones:"
        />
        <Table
          id={votations.id}
          headings={votations.headings}
          rows={votations.rows}
        />
      </SectionContainer>
      <ChartSection />
      <SectionContainer>
        <Select
          id="blockId"
          label="Escoge un ID para ver métricas de los bloques:"
        />
        <Table id={blocks.id} headings={blocks.headings} rows={blocks.rows} />
      </SectionContainer>
    </main>
  );
}
