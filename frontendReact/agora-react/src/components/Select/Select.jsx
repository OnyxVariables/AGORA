import "./Select.css"

export default function Select({ id, label }) {
  return (
    <article className="select-container">
      <label htmlFor={id}>{label}</label>
      <select name={id} id={id} className="select">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
    </article>
  )
}
