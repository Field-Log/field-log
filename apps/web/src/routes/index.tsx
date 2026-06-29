import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="shell">
      <section className="intro">
        <p className="eyebrow">Machined Pens</p>
        <h1>Autmog archive</h1>
        <p>
          A TanStack Start web shell for the machined pen archive and future API
          backed features.
        </p>
      </section>
    </main>
  );
}
