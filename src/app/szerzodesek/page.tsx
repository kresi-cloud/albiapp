import { redirect } from "next/navigation";

/** A szerződések a Dokumentumok lapra kerültek a jegyzőkönyvek és az igazolások mellé. */
export default function Szerzodesek() {
  redirect("/dokumentumok");
}
