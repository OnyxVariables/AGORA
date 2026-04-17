import "./Table.css";

/**
 * @param {object} props
 * @param {string} props.id
 * @param {string[]} props.headings
 * @param {Record<string, unknown>[]} props.rows
 * @param {string[]} [props.rowKeys]
 * @param {function} [props.getRowClass] - Función que recibe (row, index) y devuelve string de clase CSS
 */
export default function Table({ id, headings, rows, rowKeys = null, getRowClass = null }) {
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
            <tr key={index} className={getRowClass ? getRowClass(row, index) : ''}>
              {(rowKeys ?? Object.keys(row)).filter(key => !key.startsWith('_')).map((key) => (
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
