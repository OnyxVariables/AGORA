import "./Table.css"

export default function Table({ id, headings, rows }) {
  return (
    <table id={id} className="table">
      <thead>
        <tr>
          {headings && headings.map((col) => (
            <th className="cell cell-header" key={col}>{col}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows && rows.map((row, index) => (
          <tr key={index}>
            {Object.values(row).map((value, i) => (
              <td className="cell" key={i}>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
