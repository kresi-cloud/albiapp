import { Jogilap } from "@/components/Jogilap";
import { jogiOldal } from "@/domain/jogi";
import { aktualisNyelv } from "@/lib/nyelv";

export const dynamic = "force-dynamic";

export default async function Feltetelek() {
  return <Jogilap oldal={jogiOldal("feltetelek", await aktualisNyelv())} />;
}
