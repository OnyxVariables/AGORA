import React from "react";
import "./Main.css";

function getVotations() {
  return [
    { id: 1, title: "Elecciones 2026", startDate: "2025-05-12", endDate: "2025-05-12", hash: Math.random().toString(36).substring(2) },
    { id: 2, title: "Elecciones 2029", startDate: "2029-05-12", endDate: "2029-05-12", hash: Math.random().toString(36).substring(2) },
    { id: 3, title: "Elecciones 2033", startDate: "2033-05-12", endDate: "2033-05-12", hash: Math.random().toString(36).substring(2) },
    { id: 4, title: "Elecciones 2037", startDate: "2037-05-12", endDate: "2037-05-12", hash: Math.random().toString(36).substring(2) },
    { id: 5, title: "Elecciones 2041", startDate: "2041-05-12", endDate: "2041-05-12", hash: Math.random().toString(36).substring(2) },
  ];
}

function ActionButtons() {
  return (
    <div className="action-container">
      <button className="btn edit">Edit</button>
      <button className="btn delete">Delete</button>
    </div>
  );
}

function VotationsTable() {
  const votations = getVotations();
  const headers = Object.keys(votations[0]);

  return (
    <table className="table">
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} className="cell cell-header">
              {header.toUpperCase()}
            </th>
          ))}
          <th className="cell cell-header">ACTION</th>
        </tr>
      </thead>
      <tbody>
        {votations.map((votation) => (
          <tr key={votation.id} data-id={votation.id}>
            {headers.map((key) => (
              <td key={key} className="cell">{votation[key]}</td>
            ))}
            <td className="cell">
              <ActionButtons />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function App() {
  return (
    <main className="crudvotations">
      <section className="container">
        <VotationsTable />
        <button className="btn create">Crear</button>
      </section>
    </main>
  );
}