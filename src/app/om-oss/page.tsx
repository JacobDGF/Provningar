import Link from 'next/link'
import { Mail, MessageCircle, ShieldCheck, Compass } from 'lucide-react'

const faqs = [
  {
    q: 'Vad är en prövning?',
    a: 'En prövning är ett sätt att få betyg i en kurs du läst tidigare, eller att höja ett betyg du redan har. Du gör ett prov (skriftligt och/eller muntligt) som visar dina kunskaper enligt kursplanen, och får sedan ett nytt betyg satt av en behörig examinator.',
  },
  {
    q: 'Hur fungerar Prövningsguiden?',
    a: 'Vi samlar prövningar från skolor och komvux i hela Sverige på ett ställe. Du kan söka, jämföra och filtrera efter ämne, stad och datum, se lediga platser i realtid och skicka en anmälan. Den faktiska bokningen och betalningen slutförs alltid direkt hos skolan som anordnar prövningen.',
  },
  {
    q: 'Kostar det något att använda Prövningsguiden?',
    a: 'Nej, det är helt kostnadsfritt att söka och jämföra prövningar hos oss. Vissa skolor tar ut en avgift för själva prövningen, vilket alltid visas tydligt innan du går vidare.',
  },
  {
    q: 'Hur vet jag att en skola är pålitlig?',
    a: 'Vi visar Skolverket-godkända skolor med en särskild markering, samt betyg och omdömen från tidigare studenter på varje skolas profil.',
  },
  {
    q: 'Kan jag göra en prövning på distans?',
    a: 'Ja, flera av våra anslutna skolor erbjuder distansprövningar. Filtrera på skoltyp eller kontakta skolan direkt för att se vilka alternativ som finns.',
  },
]

export default function OmOssPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Om Prövningsguiden</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Vi hjälper tusentals studenter varje år att hitta rätt prövning för att höja sina betyg
          och komma in på sin drömutbildning – tryggt, snabbt och samlat på ett ställe.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <InfoCard
          icon={ShieldCheck}
          title="Trygg & granskad"
          text="Vi listar endast Skolverket-godkända skolor och visar verifierade omdömen."
        />
        <InfoCard
          icon={Compass}
          title="Allt på ett ställe"
          text="Sök, jämför och hitta prövningar från hela landet utan att besöka tiotals olika hemsidor."
        />
        <InfoCard
          icon={MessageCircle}
          title="Verkligt stöd"
          text="Vårt team finns tillgängligt om du har frågor under hela din resa mot bättre betyg."
        />
      </div>

      <div className="mt-12">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Vanliga frågor</h2>
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {faqs.map((item) => (
            <details key={item.q} className="group p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-800">
                {item.q}
                <span className="ml-2 flex-shrink-0 text-slate-400 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-slate-200 bg-white p-6 text-center">
        <h2 className="text-lg font-bold text-slate-900">Har du fler frågor?</h2>
        <p className="mt-1 text-sm text-slate-600">Vi svarar vanligtvis inom en arbetsdag.</p>
        <a
          href="mailto:hej@provningsguiden.se"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Mail size={16} />
          hej@provningsguiden.se
        </a>
        <p className="mt-6 text-sm">
          <Link href="/upptack" className="font-medium text-primary-600 hover:text-primary-700">
            Tillbaka till Upptäck →
          </Link>
        </p>
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck
  title: string
  text: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
      <Icon size={22} className="mx-auto mb-2 text-primary-600" />
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
    </div>
  )
}
