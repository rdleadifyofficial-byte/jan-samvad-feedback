import { ArrowRight, MessageCircle, QrCode, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return <main className="min-h-screen overflow-hidden bg-[#f6f3ea] text-[#17352c]">
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
      <header className="flex items-center justify-between border-b border-[#17352c]/15 pb-5">
        <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-full bg-[#17352c] text-white"><MessageCircle className="size-5" /></div><div><p className="font-semibold">जन संवाद</p><p className="text-xs text-[#587068]">आपकी बात • हमारी प्राथमिकता</p></div></div>
        <Link href="/inbox" className="text-sm font-medium text-[#587068] hover:text-[#17352c]">प्रशासन</Link>
      </header>
      <section className="grid min-h-[78vh] items-center gap-12 py-14 lg:grid-cols-[1.1fr_.9fr]">
        <div><div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d9983e]/35 bg-[#fff8e9] px-4 py-2 text-sm font-medium text-[#8a5a17]"><span className="size-2 rounded-full bg-[#df7b2f]" /> जन-जागरूकता एवं सार्वजनिक फीडबैक</div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-6xl lg:text-7xl">अपनी बात कहिए,<br/><span className="text-[#df7b2f]">बदलाव में भागीदार</span> बनिए।</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#587068]">आपके क्षेत्र की सड़क, पानी, सफाई, रोशनी या किसी अन्य जनसमस्या पर अपना सुझाव साझा करें। हर प्रतिक्रिया एक ही फीडबैक इनबॉक्स में दर्ज होगी।</p>
          <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg" className="h-13 rounded-full bg-[#17352c] px-7 text-base hover:bg-[#244b3f]"><Link href="/feedback">फीडबैक दें <ArrowRight className="ml-2 size-4" /></Link></Button><Button asChild variant="outline" size="lg" className="h-13 rounded-full border-[#17352c]/20 bg-white/50 px-7 text-base"><Link href="/qr"><QrCode className="mr-2 size-4" /> QR प्राप्त करें</Link></Button></div>
        </div>
        <div className="relative mx-auto w-full max-w-md"><div className="absolute -inset-5 rotate-3 rounded-[2.5rem] bg-[#df7b2f]" /><div className="relative rounded-[2.25rem] bg-[#17352c] p-7 text-white shadow-2xl"><div className="mb-12 flex items-center justify-between"><span className="text-sm text-white/65">त्वरित प्रक्रिया</span><ShieldCheck className="size-6 text-[#efb866]" /></div><p className="text-3xl font-semibold leading-tight">Scan करें.<br/>अपनी समस्या बताएं.<br/>फीडबैक दर्ज हो गया.</p><div className="mt-10 space-y-3">{["QR से फॉर्म खोलें", "श्रेणी और स्थान चुनें", "मोबाइल पर पुष्टि पाएं"].map((x,i)=><div key={x} className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3"><span className="grid size-7 place-items-center rounded-full bg-[#efb866] text-xs font-bold text-[#17352c]">{i+1}</span><span className="text-sm">{x}</span></div>)}</div></div></div>
      </section>
    </div>
  </main>;
}
