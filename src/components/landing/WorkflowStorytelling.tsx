import GeologicalWorkflowStorytelling from "../lims/GeologicalWorkflowStorytelling";

export default function WorkflowStorytelling() {
  return (
    <section id="workflow" className="border-t border-border" aria-labelledby="workflow-heading">
      <div className="mx-auto max-w-7xl px-6 pt-16 md:pt-20 pb-4 text-center">
        <h2
          id="workflow-heading"
          className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display"
        >
          From field specimen to final certificate
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Interactive walkthrough of custody, preparation, analysis, and reporting — the core
          workflow your lab runs every day.
        </p>
      </div>
      <GeologicalWorkflowStorytelling />
    </section>
  );
}
