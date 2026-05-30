import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

const FAQ_ITEMS = [
  {
    q: "Who can register on this site?",
    a: "Mining companies, exploration teams, and approved clients who need geochemical assay services from UniPod Nsuk may register for a customer portal account.",
  },
  {
    q: "When can I access the customer portal?",
    a: "Only after you complete registration and verify your email. The portal is not available to the public before registration.",
  },
  {
    q: "I am laboratory staff — where do I sign in?",
    a: "Administrators use the Admin portal; lab coordinators and technicians use the Lab Coordinator portal. Use Sign in with credentials provided by your administrator.",
  },
  {
    q: "How is my data protected?",
    a: "GeoChem Suite uses role-based access, audit logging, and secure authentication aligned with UniPod standards.",
    link: true,
  },
];

export default function FaqSection() {
  return (
    <section id="faq" className="border-t border-border bg-muted/10">
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16 lg:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display">
            Frequently asked questions
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-semibold text-foreground">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.a}
                {item.link && (
                  <>
                    {" "}
                    <a href="#security" className="text-primary font-medium hover:underline">
                      Security details
                    </a>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
