import "./SectionContainer.css"

export default function SectionContainer({ children }) {
  return (
    <section className="container">
      {children}
    </section>
  )
}
