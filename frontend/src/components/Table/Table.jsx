import "./Table.css";

/**
 * @param {object} props
 * @param {string} props.id
 * @param {string[]} props.headings
 * @param {Record<string, unknown>[]} props.rows
 * @param {string[]} [props.rowKeys]
 */
export default function Table({ id, headings, rows, rowKeys = null }) {
  return (
    <div className="table-wrapper">
      <table id={id} className="table">
      <thead>
        <tr>
          {headings &&
            headings.map((col) => (
              <th className="cell cell-header" key={col}>
                {col.toUpperCase()}
              </th>
            ))}
        </tr>
      </thead>

      <tbody>
        {rows &&
          rows.map((row, index) => (
            <tr key={index}>
              {(rowKeys ?? Object.keys(row)).map((key) => (
                <td className="cell" key={key}>
                  {row[key]}
                </td>
              ))}
            </tr>
          ))}
      </tbody>
      </table>
    </div>
  );
}
