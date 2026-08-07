import type { Metadata } from "next";
import { Averia_Serif_Libre, Inter, Lora } from "next/font/google";
import { fieldSizeFor, getPieceForDrawer, getDrawerNapkins } from "@/lib/drawer";
import { NapkinsDrawer } from "@/components/drawer/NapkinsDrawer";

// the modal reuses the reader's EntrySection, whose CSS consumes these vars
const averia = Averia_Serif_Libre({ variable: "--font-averia", subsets: ["latin"], weight: "400" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], style: ["normal", "italic"] });

type Props = { searchParams: Promise<{ piece?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { piece } = await searchParams;
  const opened = piece ? await getPieceForDrawer(piece) : null;
  return {
    title: opened
      ? `${opened.entry.title} — The Napkins Drawer`
      : "The Napkins Drawer — Napkins",
    description:
      "Every piece ever published in Napkins, scattered as a pile of napkins. Pick one up.",
  };
}

export default async function DrawerPage({ searchParams }: Props) {
  const { piece } = await searchParams;
  const napkins = await getDrawerNapkins();
  // deep-linked piece arrives server-rendered so a shared link opens instantly
  const initialPiece = piece ? await getPieceForDrawer(piece) : null;

  return (
    <div className={`${averia.variable} ${inter.variable} ${lora.variable}`}>
      <NapkinsDrawer
        napkins={napkins}
        initialPiece={initialPiece}
        field={fieldSizeFor(napkins.length)}
      />
    </div>
  );
}
