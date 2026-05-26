import { createFileRoute } from "@tanstack/react-router";
import { Field, Section } from "./app.settings.index";

export const Route = createFileRoute("/app/settings/laboratory")({ component: Lab });
function Lab(){return(<><Section title="Laboratory Profile">{[["Lab name","GeoChem Central"],["Accreditation","ISO 17025:2017"],["Manager","M. Rivera"],["Capacity","2,500 samples/mo"]].map(f=><Field key={f[0]} label={f[0]} value={f[1]}/>)}</Section></>);}
