import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./components/Icon";
import { useLanguage } from "./context/LanguageContext";
import { centres, centreById, facilityLabels } from "./data/centres";
import { crops, cropById } from "./data/crops";
import { readJson, writeJson } from "./lib/storage";
import {
  active,
  bookingError,
  localDate,
  recommend,
  remaining,
  slots,
  type CentreSettings,
} from "./services/procurement";
import type { Booking, BookingStatus, Centre, Grade, RoleKey } from "./types";
import "./App.css";

type Page =
  | "home"
  | "book"
  | "token"
  | "alerts"
  | "profile"
  | "centres"
  | "detail"
  | "procurement"
  | "payments"
  | "queue"
  | "capacity"
  | "farmers";
type Alert = {
  id: string;
  phone: string;
  en: string;
  ta: string;
  token: number;
  read: boolean;
  time: number;
};
type Saved = {
  bookings: Booking[];
  alerts: Alert[];
  queues: Record<string, number>;
  settings: CentreSettings;
  profiles: Record<string, { name: string; village: string }>;
};
const empty: Saved = {
  bookings: [],
  alerts: [],
  queues: {},
  settings: {},
  profiles: {},
};
const key = "kish.app.v1";
const timestamp = () => Date.now();
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
export default function App() {
  const { language, setLanguage } = useLanguage();
  const t = (en: string, ta: string) => (language === "ta" ? ta : en);
  const [data, setData] = useState<Saved>(() => {
    const d = readJson<Saved>(key, empty);
    return d &&
      Array.isArray(d.bookings) &&
      Array.isArray(d.alerts) &&
      d.queues &&
      d.settings &&
      d.profiles
      ? d
      : empty;
  });
  const [session, setSession] = useState<{
    phone: string;
    role: RoleKey;
  } | null>(() => readJson("kish.session", null));
  const [stage, setStage] = useState(
    readJson("kish.languageChosen", false) ? "intro" : "language",
  );
  const [page, setPage] = useState<Page>("home");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState<RoleKey>("farmer");
  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [operatorCentre, setOperatorCentre] = useState(centres[1].id);
  const [selectedCentre, setSelectedCentre] = useState(centres[1].id);
  const [step, setStep] = useState(0);
  const [crop, setCrop] = useState(crops[0].id);
  const [quantity, setQuantity] = useState("250");
  const [unit, setUnit] = useState("kg");
  const [date, setDate] = useState(localDate(1));
  const [slot, setSlot] = useState("");
  const [record, setRecord] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [recordCrop, setRecordCrop] = useState("");
  const [recordCentre, setRecordCentre] = useState("");
  const [preferredCentre, setPreferredCentre] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const [grade, setGrade] = useState<Grade>("A");
  const [notice, setNotice] = useState("");
  const [large, setLarge] = useState(() => readJson("kish.large", false));
  useEffect(() => {
    writeJson(key, data);
  }, [data]);
  useEffect(() => {
    writeJson("kish.session", session);
  }, [session]);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    writeJson("kish.large", large);
  }, [large]);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === key) setData(readJson(key, empty));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const navigate = (p: Page) => {
    setPage(p);
    setRecord(null);
    setError("");
    setNotice("");
    setFilter("all");
    setSearch("");
    setRecordCrop("");
    setRecordCentre("");
    if (p !== "book") setPreferredCentre(null);
    window.scrollTo(0, 0);
  };
  const mine = data.bookings.filter((b) => b.farmerPhone === session?.phone);
  const current = mine.find(active);
  const profile = data.profiles[session?.phone ?? ""];
  const isFarmer = session?.role === "farmer";
  const isAdmin = session?.role === "administration";
  const visible = isFarmer
    ? mine
    : isAdmin
      ? data.bookings
      : data.bookings.filter((b) => b.centreId === operatorCentre);
  const filteredRecords = visible.filter((b) => {
    if (recordCrop && b.cropId !== recordCrop) return false;
    if (recordCentre && b.centreId !== recordCentre) return false;
    if (
      search &&
      !`${b.farmerName} ${b.farmerPhone} ${b.tokenNo} ${b.date}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    if (page === "payments")
      return (
        b.amount !== undefined && (filter === "all" || b.status === filter)
      );
    return (
      filter === "all" ||
      (filter === "active"
        ? active(b)
        : ["completed", "payment_pending", "paid"].includes(b.status))
    );
  });
  const quantityKg =
    Number(quantity) * (unit === "quintal" ? 100 : unit === "tonne" ? 1000 : 1);
  const chosen = centreById(selectedCentre)!;
  const ranked = recommend(
    crop,
    quantityKg,
    date,
    data.bookings,
    data.settings,
    data.queues,
  );
  const status = (s: BookingStatus) =>
    ({
      booked: t("Booked", "முன்பதிவு"),
      arrived: t("In queue", "வரிசையில்"),
      weighing: t("Procurement", "கொள்முதல்"),
      completed: t("Payment pending", "பணம் நிலுவையில்"),
      payment_pending: t("Processing", "செயலாக்கத்தில்"),
      paid: t("Paid", "பணம் வழங்கப்பட்டது"),
      cancelled: t("Cancelled", "ரத்து செய்யப்பட்டது"),
    })[s];
  const roleName = (r: RoleKey) =>
    r === "farmer"
      ? t("Farmer", "விவசாயி")
      : r === "procurement_centre"
        ? t("Procurement centre", "கொள்முதல் நிலையம்")
        : t("Administration", "நிர்வாகம்");
  function addAlert(d: Saved, b: Booking, en: string, ta: string): Saved {
    return {
      ...d,
      alerts: [
        {
          id: crypto.randomUUID(),
          phone: b.farmerPhone,
          en,
          ta,
          token: b.tokenNo,
          time: timestamp(),
          read: false,
        },
        ...d.alerts,
      ],
    };
  }
  function updateBooking(b: Booking, next: BookingStatus) {
    setError("");
    const transitions: Partial<Record<BookingStatus, BookingStatus[]>> = {
      booked: ["arrived", "cancelled"],
      arrived: ["weighing", "cancelled"],
      weighing: ["completed"],
      completed: ["payment_pending"],
      payment_pending: ["paid"],
    };
    if (!transitions[b.status]?.includes(next)) return;
    if (
      next === "completed" &&
      (!Number.isFinite(Number(weight)) ||
        Number(weight) <= 0 ||
        Number(weight) > b.quantityKg * 1.2)
    ) {
      setError(
        t(
          "Enter a valid measured weight, up to 120% of the booked quantity.",
          "முன்பதிவு அளவின் 120% வரை சரியான எடையை உள்ளிடவும்.",
        ),
      );
      return;
    }
    setData((d) => {
      const fresh = d.bookings.find((x) => x.id === b.id);
      if (!fresh || fresh.status !== b.status) return d;
      const rate =
        centreById(b.centreId)!.rates[b.cropId] *
        (grade === "A" ? 1 : grade === "B" ? 0.95 : 0.9);
      const updated = {
        ...fresh,
        status: next,
        ...(next === "completed"
          ? {
              weighedKg: Number(weight),
              grade,
              ratePerQuintal: rate,
              amount: Math.round(Number(weight) * rate) / 100,
            }
          : {}),
        ...(next === "paid"
          ? {
              paidAt: timestamp(),
              reference: `KISH-${b.id.slice(0, 8).toUpperCase()}`,
            }
          : {}),
      };
      const labels: Record<string, [string, string]> = {
        arrived: ["Arrival recorded", "வருகை பதிவு செய்யப்பட்டது"],
        weighing: ["Procurement started", "கொள்முதல் தொடங்கியது"],
        completed: ["Procurement completed", "கொள்முதல் முடிந்தது"],
        payment_pending: [
          "Demo payment processing",
          "மாதிரி பணம் செயலாக்கத்தில்",
        ],
        paid: ["Demo payment recorded", "மாதிரி பணப் பதிவு முடிந்தது"],
        cancelled: ["Booking cancelled", "முன்பதிவு ரத்து செய்யப்பட்டது"],
      };
      return addAlert(
        {
          ...d,
          bookings: d.bookings.map((x) => (x.id === b.id ? updated : x)),
        },
        b,
        ...labels[next],
      );
    });
  }
  function confirmBooking() {
    const latest = readJson<Saved>(key, data);
    const issue = bookingError(
      chosen,
      crop,
      quantityKg,
      date,
      slot,
      latest.bookings,
      latest.settings,
      session!.phone,
    );
    if (issue) {
      setError(
        issue === "active"
          ? t(
              "You already have an active token. Complete or cancel it first.",
              "ஏற்கனவே டோக்கன் உள்ளது. அதை முடிக்கவும் அல்லது ரத்து செய்யவும்.",
            )
          : t(
              "This slot or quantity is unavailable. Check your centre and slot.",
              "இந்த நேரம் அல்லது அளவு கிடைக்கவில்லை. நிலையம் மற்றும் நேரத்தை மீண்டும் தேர்வு செய்யவும்.",
            ),
      );
      return;
    }
    const b: Booking = {
      id: crypto.randomUUID(),
      tokenNo:
        Math.max(
          0,
          ...latest.bookings
            .filter((x) => x.centreId === selectedCentre && x.date === date)
            .map((x) => x.tokenNo),
        ) + 1,
      centreId: selectedCentre,
      cropId: crop,
      quantityKg,
      date,
      slotId: slot,
      status: "booked",
      createdAt: timestamp(),
      farmerName: profile?.name || name,
      farmerPhone: session!.phone,
    };
    const next = addAlert(
      { ...latest, bookings: [...latest.bookings, b] },
      b,
      "Your booking is confirmed",
      "உங்கள் முன்பதிவு உறுதி செய்யப்பட்டது",
    );
    writeJson(key, next);
    setData(next);
    navigate("token");
    setNotice(
      t(
        "Booking confirmed. Your token is ready.",
        "முன்பதிவு உறுதி செய்யப்பட்டது. டோக்கன் தயார்.",
      ),
    );
  }
  function advanceQueue(c: Centre) {
    setData((d) => {
      const count = d.queues[c.id] ?? c.initialQueue;
      let next = {
        ...d,
        queues: { ...d.queues, [c.id]: Math.max(0, count - 1) },
      };
      if (count > 0 && count <= 3)
        for (const b of d.bookings.filter(
          (b) => b.centreId === c.id && active(b),
        ))
          next = addAlert(
            next,
            b,
            count === 1
              ? "Your turn is ready. Check in at the centre."
              : "Your turn is approaching.",
            count === 1
              ? "உங்கள் முறை வந்துவிட்டது. வருகையைப் பதிவு செய்யவும்."
              : "உங்கள் முறை நெருங்குகிறது.",
          );
      return next;
    });
  }
  const button = (
    label: string,
    onClick: () => void,
    secondary = false,
    disabled = false,
  ) => (
    <button
      className={secondary ? "button secondary" : "button"}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
  const heading = (eyebrow: string, title: string, desc?: string) => (
    <div className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {desc && <p>{desc}</p>}
    </div>
  );
  const blank = (title: string, body: string) => (
    <section className="card empty">
      <Icon name="field" size={40} />
      <h2>{title}</h2>
      <p>{body}</p>
      {isFarmer &&
        !current &&
        button(t("Book a token", "டோக்கன் முன்பதிவு"), () => {
          setStep(0);
          navigate("book");
        })}
    </section>
  );
  function centreCard(c: Centre, best = false): ReactNode {
    const q = data.queues[c.id] ?? c.initialQueue;
    const free = remaining(c, data.bookings, data.settings, date);
    return (
      <button
        className={`card centre-card ${best ? "recommended" : ""}`}
        key={c.id}
        onClick={() => {
          setSelectedCentre(c.id);
          if (page === "book") {
            setSlot("");
            setStep(3);
          } else navigate("detail");
        }}
      >
        {best && (
          <p className="eyebrow">
            {t("BEST FIT FOR YOUR TRIP", "உங்கள் பயணத்திற்கு சிறந்த தேர்வு")}
          </p>
        )}
        <div className="row">
          <span className="icon-tile">
            <Icon name="location" />
          </span>
          <span
            className={`badge ${data.settings[c.id]?.open === false ? "muted" : q > 12 ? "amber" : ""}`}
          >
            {data.settings[c.id]?.open === false
              ? t("Closed", "மூடப்பட்டது")
              : q > 12
                ? t("Busy", "கூட்டம் அதிகம்")
                : t("Open", "திறந்துள்ளது")}
          </span>
        </div>
        <h3>{c.name[language]}</h3>
        <p>
          {c.village[language]} · {c.district[language]}
        </p>
        <div className="metrics">
          <span>
            <Icon name="location" />
            {c.distanceKm} {t("km", "கி.மீ.")}
          </span>
          <span>
            <Icon name="clock" />
            {q * c.minutesPerFarmer} {t("min wait", "நிமிட காத்திருப்பு")}
          </span>
        </div>
        <div className="meter">
          <span
            style={{
              width: `${Math.min(100, Math.max(0, (free / (c.capacityTonnes * 1000)) * 100))}%`,
            }}
          />
        </div>
        <p className="small">
          {Math.max(0, free / 1000).toFixed(1)}{" "}
          {t("tonnes available", "டன் இடம் உள்ளது")}
        </p>
        {best && (
          <p className="reason">
            {t(
              "Available slots and capacity, with the lowest combined travel and queue estimate.",
              "நேரமும் கொள்ளளவும் உள்ள நிலையங்களில் பயண நேரம் மற்றும் காத்திருப்பு குறைவான தேர்வு.",
            )}
          </p>
        )}
      </button>
    );
  }
  function bookingCard(b: Booking) {
    return (
      <button
        className="card booking-row"
        key={b.id}
        onClick={() => {
          setRecord(b.id);
          setWeight(String(b.weighedKg ?? b.quantityKg));
          setGrade(b.grade ?? "A");
        }}
      >
        <span className="token-small">#{b.tokenNo}</span>
        <span>
          <strong>
            {cropById(b.cropId)?.name[language]} · {b.quantityKg}{" "}
            {t("kg", "கிலோ")}
          </strong>
          <small>
            {centreById(b.centreId)?.village[language]} · {b.date} · {b.slotId}
          </small>
          {!isFarmer && <small>{b.farmerName}</small>}
        </span>
        <span className={`badge ${b.status === "cancelled" ? "muted" : ""}`}>
          {status(b.status)}
        </span>
        <Icon name="chevron" />
      </button>
    );
  }
  function recordDetail(b: Booking) {
    return (
      <>
        <button className="text-button" onClick={() => setRecord(null)}>
          ← {t("Back to records", "பதிவுகளுக்குத் திரும்பு")}
        </button>
        {heading(
          t("PROCUREMENT RECORD", "கொள்முதல் பதிவு"),
          `${t("Token", "டோக்கன்")} #${b.tokenNo}`,
        )}
        <section className="card">
          <span className="badge">{status(b.status)}</span>
          <dl>
            <dt>{t("Farmer", "விவசாயி")}</dt>
            <dd>{b.farmerName}</dd>
            <dt>{t("Crop", "பயிர்")}</dt>
            <dd>{cropById(b.cropId)?.name[language]}</dd>
            <dt>{t("Centre", "நிலையம்")}</dt>
            <dd>{centreById(b.centreId)?.name[language]}</dd>
            <dt>{t("Date / time", "தேதி / நேரம்")}</dt>
            <dd>
              {b.date} · {b.slotId}
            </dd>
            <dt>{t("Booked quantity", "முன்பதிவு அளவு")}</dt>
            <dd>
              {b.quantityKg} {t("kg", "கிலோ")}
            </dd>
            {b.weighedKg && (
              <>
                <dt>{t("Measured weight / grade", "அளந்த எடை / தரம்")}</dt>
                <dd>
                  {b.weighedKg} {t("kg", "கிலோ")} · {b.grade}
                </dd>
                <dt>{t("Rate per 100 kg", "100 கிலோ விலை")}</dt>
                <dd>{money(b.ratePerQuintal!)}</dd>
              </>
            )}
          </dl>
          {b.amount !== undefined && (
            <div className="amount">
              <p>{t("Amount payable · demo", "வழங்க வேண்டிய தொகை · மாதிரி")}</p>
              <h2>{money(b.amount)}</h2>
              <p>
                {b.reference ??
                  t(
                    "Payment reference not recorded yet",
                    "பணப் பரிவர்த்தனை எண் இன்னும் பதிவாகவில்லை",
                  )}
              </p>
              {b.paidAt && (
                <p>
                  {new Date(b.paidAt).toLocaleString(
                    language === "ta" ? "ta-IN" : "en-IN",
                  )}
                </p>
              )}
            </div>
          )}
          {!isFarmer && (
            <div className="stack">
              {b.status === "booked" &&
                button(t("Check in farmer", "வருகை பதிவு"), () =>
                  updateBooking(b, "arrived"),
                )}
              {b.status === "arrived" &&
                button(t("Start procurement", "கொள்முதலை தொடங்கு"), () =>
                  updateBooking(b, "weighing"),
                )}
              {b.status === "weighing" && (
                <>
                  <label>
                    {t("Measured weight (kg)", "அளந்த எடை (கிலோ)")}
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </label>
                  <label>
                    {t("Grade", "தரம்")}
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value as Grade)}
                    >
                      <option value="A">A · 100%</option>
                      <option value="B">B · 95%</option>
                      <option value="C">C · 90%</option>
                    </select>
                  </label>
                  <p>
                    {t("Estimated amount", "மதிப்பிடப்பட்ட தொகை")}:{" "}
                    {money(
                      (((Number(weight) || 0) *
                        centreById(b.centreId)!.rates[b.cropId]) /
                        100) *
                        (grade === "A" ? 1 : grade === "B" ? 0.95 : 0.9),
                    )}
                  </p>
                  {button(t("Complete procurement", "கொள்முதலை முடி"), () =>
                    updateBooking(b, "completed"),
                  )}
                </>
              )}
              {b.status === "completed" &&
                button(
                  t("Process demo payment", "மாதிரி பணத்தை செயலாக்கு"),
                  () => updateBooking(b, "payment_pending"),
                )}
              {b.status === "payment_pending" &&
                button(
                  t("Record demo payment", "மாதிரி பணம் வழங்கியதாக பதிவு"),
                  () => updateBooking(b, "paid"),
                )}
            </div>
          )}
          {button(
            t("Print / save receipt", "ரசீதை அச்சிடு / சேமி"),
            () => window.print(),
            true,
          )}
        </section>
      </>
    );
  }
  const roles: RoleKey[] = ["farmer", "procurement_centre", "administration"];
  let content: ReactNode;
  // Screens are composed below; all roles use the same persistent demo records.
  if (!session)
    content = (
      <div className="entry">
        <div className="entry-art">
          <Icon name="field" size={64} />
          <p>{t("FROM YOUR FIELD.", "உங்கள் வயலிலிருந்து.")}</p>
          <p>{t("TO A FAIRER MARKET.", "நியாயமான சந்தைக்கு.")}</p>
          <div className="field-lines" />
        </div>
        {stage === "language" ? (
          <>
            {heading(
              "KISH",
              "வணக்கம். Welcome.",
              "Choose your language · உங்கள் மொழியைத் தேர்வு செய்யவும்",
            )}
            <div className="stack">
              {(["ta", "en"] as const).map((l) => (
                <button
                  className={`choice ${language === l ? "selected" : ""}`}
                  key={l}
                  onClick={() => setLanguage(l)}
                >
                  <strong>{l === "ta" ? "தமிழ்" : "English"}</strong>
                  <span>{language === l ? "●" : "○"}</span>
                </button>
              ))}
              {button(t("Continue", "தொடரவும்"), () => {
                writeJson("kish.languageChosen", true);
                setStage("intro");
              })}
            </div>
          </>
        ) : stage === "intro" ? (
          <>
            {heading(
              t("YOUR HARVEST. YOUR TIME.", "உங்கள் விளைச்சல். உங்கள் நேரம்."),
              t(
                "A simpler way to sell your produce.",
                "உங்கள் விளைபொருளை விற்க எளிய வழி.",
              ),
              t(
                "Choose a centre, reserve your turn and follow every step through to payment.",
                "நிலையத்தைத் தேர்வு செய்து, நேரத்தை முன்பதிவு செய்து, பணம் பெறும் வரை கண்காணியுங்கள்.",
              ),
            )}
            <div className="journey">
              <span>01 · {t("Book", "முன்பதிவு")}</span>
              <span>02 · {t("Deliver", "ஒப்படை")}</span>
              <span>03 · {t("Track", "கண்காணி")}</span>
            </div>
            {button(t("Get started", "தொடங்கலாம்"), () => setStage("login"))}
          </>
        ) : stage === "login" ? (
          <>
            {heading(
              t("WELCOME TO KISH", "கிஷ் உங்களை வரவேற்கிறது"),
              t("Your mobile. Your account.", "உங்கள் கைபேசி. உங்கள் கணக்கு."),
              t(
                "Try the complete app with a demo mobile login. No SMS is sent.",
                "மாதிரி கைபேசி உள்நுழைவுடன் முழு செயலியையும் முயற்சிக்கவும். குறுஞ்செய்தி அனுப்பப்படாது.",
              ),
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^[6-9]\d{9}$/.test(phone)) {
                  setError(
                    t(
                      "Enter a valid 10-digit Indian mobile number.",
                      "சரியான 10 இலக்க இந்திய கைபேசி எண்ணை உள்ளிடவும்.",
                    ),
                  );
                  return;
                }
                setError("");
                setOtp("");
                setStage("otp");
              }}
            >
              <label>
                {t("Mobile number", "கைபேசி எண்")}
                <div className="phone-input">
                  <span>+91</span>
                  <input
                    aria-label={t("Mobile number", "கைபேசி எண்")}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={phone}
                    placeholder="98765 43210"
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
              </label>
              <button className="button" type="submit">
                {t("Continue with demo", "மாதிரியில் தொடரவும்")}
              </button>
            </form>
          </>
        ) : stage === "otp" ? (
          <>
            {heading(
              t("DEMO VERIFICATION", "மாதிரி சரிபார்ப்பு"),
              t("Verify your mobile", "கைபேசி எண்ணை சரிபார்க்கவும்"),
              `+91 ${phone}`,
            )}
            <p className="info">
              {t(
                "Demo code: 123456. This does not verify ownership of a phone.",
                "மாதிரி குறியீடு: 123456. இது கைபேசி உரிமையை உறுதிப்படுத்தாது.",
              )}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (otp !== "123456") {
                  setError(
                    t(
                      "Incorrect demo code. Enter 123456.",
                      "தவறான மாதிரி குறியீடு. 123456 உள்ளிடவும்.",
                    ),
                  );
                  return;
                }
                setError("");
                setStage("role");
                const saved = data.profiles[phone];
                if (saved) {
                  setName(saved.name);
                  setVillage(saved.village);
                }
              }}
            >
              <label>
                {t("Six-digit code", "ஆறு இலக்க குறியீடு")}
                <input
                  className="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
              </label>
              <button className="button">
                {t("Verify & continue", "சரிபார்த்து தொடரவும்")}
              </button>
            </form>
            <div className="row">
              <button
                className="text-button"
                onClick={() => {
                  setOtp("");
                  setNotice(
                    t(
                      "Demo code remains 123456. No SMS is sent.",
                      "மாதிரி குறியீடு 123456. குறுஞ்செய்தி அனுப்பப்படாது.",
                    ),
                  );
                }}
              >
                {t("Resend code", "மீண்டும் குறியீடு")}
              </button>
              <button
                className="text-button"
                onClick={() => {
                  setError("");
                  setStage("login");
                }}
              >
                {t("Change number", "எண்ணை மாற்று")}
              </button>
            </div>
          </>
        ) : (
          <>
            {heading(
              t("MAKE YOURSELF AT HOME", "உங்களுக்கான செயலி"),
              t(
                "How will you use Kish?",
                "கிஷ் செயலியை எவ்வாறு பயன்படுத்துவீர்கள்?",
              ),
              t(
                "All three roles are available in this local demo.",
                "இந்த உள்ளூர் மாதிரியில் மூன்று பணிகளையும் முயற்சிக்கலாம்.",
              ),
            )}
            <div className="stack">
              {roles.map((r, i) => (
                <button
                  className={`choice ${role === r ? "selected" : ""}`}
                  key={r}
                  onClick={() => setRole(r)}
                >
                  <Icon name={(["field", "home", "shield"] as const)[i]} />
                  <strong>{roleName(r)}</strong>
                  <span>{role === r ? "●" : "○"}</span>
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim() || !village.trim()) return;
                setData((d) => ({
                  ...d,
                  profiles: {
                    ...d.profiles,
                    [phone]: { name: name.trim(), village: village.trim() },
                  },
                }));
                setSession({ phone, role });
                navigate("home");
              }}
            >
              <label>
                {t("Your name", "உங்கள் பெயர்")}
                <input
                  required
                  maxLength={80}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                {t("Village", "கிராமம்")}
                <input
                  required
                  maxLength={100}
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                />
              </label>
              <button className="button">
                {t("Open Kish", "கிஷ் திறக்கவும்")}
              </button>
            </form>
          </>
        )}
      </div>
    );
  else if (record && visible.some((b) => b.id === record))
    content = recordDetail(visible.find((b) => b.id === record)!);
  else if (page === "home")
    content = (
      <>
        {heading(
          t("YOUR MANDI COMPANION", "உங்கள் மண்டி துணை"),
          `${t("Vanakkam", "வணக்கம்")}, ${profile?.name.split(" ")[0] || t("Farmer", "விவசாயி")}.`,
          isFarmer
            ? t(
                "A good day begins with a clear plan.",
                "தெளிவான திட்டத்துடன் நல்ல நாளைத் தொடங்குங்கள்.",
              )
            : roleName(session.role),
        )}
        {isFarmer ? (
          <>
            <section className="hero-card">
              <div className="row">
                <span className="eyebrow">
                  {current
                    ? t("YOUR CURRENT TOKEN", "உங்கள் தற்போதைய டோக்கன்")
                    : t("READY WHEN YOU ARE", "உங்களுக்காகத் தயார்")}
                </span>
                <Icon name="ticket" size={28} />
              </div>
              {current ? (
                <>
                  <h2 className="token-number">#{current.tokenNo}</h2>
                  <h3>{centreById(current.centreId)?.name[language]}</h3>
                  <p>
                    {current.date} · {current.slotId} · {status(current.status)}
                  </p>
                  <p>
                    {data.queues[current.centreId] ??
                      centreById(current.centreId)!.initialQueue}{" "}
                    {t(
                      "farmers ahead · demo queue",
                      "விவசாயிகள் முன்னால் · மாதிரி வரிசை",
                    )}
                  </p>
                  {button(t("Track my token", "என் டோக்கனை கண்காணி"), () =>
                    navigate("token"),
                  )}
                </>
              ) : (
                <>
                  <h2>
                    {t(
                      "Your next harvest,\none less wait.",
                      "உங்கள் அடுத்த விளைச்சல்,\nகுறைவான காத்திருப்பு.",
                    )}
                  </h2>
                  <p>
                    {t(
                      "Reserve a slot before you leave your village.",
                      "கிராமத்திலிருந்து புறப்படும் முன் நேரத்தை முன்பதிவு செய்யுங்கள்.",
                    )}
                  </p>
                  {button(t("Book a token", "டோக்கன் முன்பதிவு"), () => {
                    setStep(0);
                    navigate("book");
                  })}
                </>
              )}
            </section>
            <div className="quick-grid">
              {(
                [
                  ["ticket", "token", t("Track token", "டோக்கன் நிலை")],
                  ["book", "procurement", t("My procurement", "என் கொள்முதல்")],
                  ["money", "payments", t("Payments", "பண விவரம்")],
                  ["bell", "alerts", t("Alerts", "அறிவிப்புகள்")],
                ] as [IconName, Page, string][]
              ).map(([icon, p, label]) => (
                <button
                  className="quick-action"
                  key={p}
                  onClick={() => navigate(p)}
                >
                  <Icon name={icon} size={25} />
                  <strong>{label}</strong>
                  <Icon name="chevron" size={16} />
                </button>
              ))}
            </div>
            <div className="section-title">
              <h2>{t("A better place to go", "செல்ல ஏற்ற நிலையம்")}</h2>
              <span>{t("For tomorrow", "நாளைக்கு")}</span>
            </div>
            {recommend(
              crop,
              quantityKg,
              localDate(1),
              data.bookings,
              data.settings,
              data.queues,
            )
              .slice(0, 1)
              .map((c) => centreCard(c, true))}
            <div className="section-title">
              <h2>
                {t("Around your village", "உங்கள் கிராமத்திற்கு அருகில்")}
              </h2>
              <button
                className="text-button"
                onClick={() => navigate("centres")}
              >
                {t("View all", "அனைத்தும்")} →
              </button>
            </div>
            <div className="centre-grid">
              {centres.slice(0, 2).map((c) => centreCard(c))}
            </div>
          </>
        ) : (
          <>
            <div className="stats">
              <div>
                <strong>{visible.length}</strong>
                <span>{t("Bookings", "முன்பதிவுகள்")}</span>
              </div>
              <div>
                <strong>{visible.filter(active).length}</strong>
                <span>{t("Active", "செயலில்")}</span>
              </div>
              <div>
                <strong>
                  {money(
                    visible
                      .filter((b) => b.status === "paid")
                      .reduce((n, b) => n + (b.amount ?? 0), 0),
                  )}
                </strong>
                <span>{t("Demo payments", "மாதிரி பணப் பதிவுகள்")}</span>
              </div>
            </div>
            <div className="quick-grid">
              {(
                [
                  ["queue", "queue", t("Manage queue", "வரிசை நிர்வாகம்")],
                  ["book", "procurement", t("Procurement", "கொள்முதல்")],
                  ["money", "payments", t("Payments", "பண விவரம்")],
                  ["home", "capacity", t("Centre capacity", "நிலைய கொள்ளளவு")],
                ] as [IconName, Page, string][]
              ).map(([icon, p, label]) => (
                <button
                  className="quick-action"
                  key={p}
                  onClick={() => navigate(p)}
                >
                  <Icon name={icon} />
                  <strong>{label}</strong>
                </button>
              ))}
            </div>
            <h2>{t("Recent bookings", "சமீபத்திய முன்பதிவுகள்")}</h2>
            {visible.length
              ? visible.slice().reverse().slice(0, 5).map(bookingCard)
              : blank(
                  t("No bookings yet", "இன்னும் முன்பதிவு இல்லை"),
                  t(
                    "Use the Farmer demo role to create a booking. Then return here to process it.",
                    "விவசாயி மாதிரியில் முன்பதிவு செய்யவும். பிறகு இங்கு வந்து செயலாக்கவும்.",
                  ),
                )}
          </>
        )}
      </>
    );
  else if (page === "book" && isFarmer) {
    const titles = [
      t("What are you selling?", "என்ன பயிர் விற்கிறீர்கள்?"),
      t("How much produce?", "எவ்வளவு விளைபொருள்?"),
      t("Choose your centre", "நிலையத்தை தேர்ந்தெடுங்கள்"),
      t("Choose your date & time", "தேதி மற்றும் நேரம் தேர்வு"),
      t("Everything look right?", "விவரங்கள் சரியாக உள்ளனவா?"),
    ];
    content = (
      <>
        {heading(
          `${t("BOOK A TOKEN", "டோக்கன் முன்பதிவு")} · ${step + 1}/5`,
          titles[step],
        )}
        <div className="stepper">
          {titles.map((s, i) => (
            <span key={s} className={i <= step ? "done" : ""} />
          ))}
        </div>
        {current ? (
          blank(
            t("You have an active booking", "ஏற்கனவே முன்பதிவு உள்ளது"),
            t(
              "Open Token to track or cancel your booking.",
              "கண்காணிக்க அல்லது ரத்து செய்ய டோக்கனைத் திறக்கவும்.",
            ),
          )
        ) : (
          <>
            {step === 0 && (
              <div className="crop-grid">
                {crops.map((c) => (
                  <button
                    className={`choice crop ${crop === c.id ? "selected" : ""}`}
                    key={c.id}
                    onClick={() => {
                      setCrop(c.id);
                      setStep(1);
                    }}
                  >
                    <Icon name="field" size={32} />
                    <strong>{c.name[language]}</strong>
                    <Icon name="chevron" />
                  </button>
                ))}
              </div>
            )}
            {step === 1 && (
              <section className="card">
                <label>
                  {t("Quantity", "அளவு")}
                  <input
                    className="quantity"
                    type="number"
                    min="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </label>
                <label>
                  {t("Unit", "அலகு")}
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option value="kg">{t("Kilograms (kg)", "கிலோ")}</option>
                    <option value="quintal">
                      {t("Quintals (100 kg)", "குவிண்டால் (100 கிலோ)")}
                    </option>
                    <option value="tonne">
                      {t("Tonnes (1,000 kg)", "டன் (1,000 கிலோ)")}
                    </option>
                  </select>
                </label>
                <p>
                  {t("Total", "மொத்தம்")}:{" "}
                  {Number.isFinite(quantityKg) ? quantityKg : 0}{" "}
                  {t("kg", "கிலோ")}
                </p>
                {button(
                  t("Find suitable centres", "ஏற்ற நிலையங்களைக் காண்க"),
                  () => {
                    setError("");
                    if (
                      preferredCentre &&
                      ranked.some((c) => c.id === preferredCentre)
                    ) {
                      setSelectedCentre(preferredCentre);
                      setSlot("");
                      setStep(3);
                    } else setStep(2);
                  },
                  false,
                  !Number.isFinite(quantityKg) ||
                    quantityKg <= 0 ||
                    quantityKg > 100000,
                )}
              </section>
            )}
            {step === 2 && (
              <>
                <label>
                  {t("Planned date", "திட்டமிட்ட தேதி")}
                  <select
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setSlot("");
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <option key={i} value={localDate(i)}>
                        {localDate(i)}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  {t(
                    "Ranked by estimated travel + waiting time. Distances and queue data are samples.",
                    "மதிப்பிடப்பட்ட பயணம் மற்றும் காத்திருப்பு நேரப்படி வரிசை. தூரம் மற்றும் வரிசை மாதிரித் தரவுகள்.",
                  )}
                </p>
                {ranked.length ? (
                  ranked.map((c, i) => centreCard(c, i === 0))
                ) : (
                  <p className="info">
                    {t(
                      "No suitable slots. Try another date or a smaller quantity.",
                      "ஏற்ற நேரங்கள் இல்லை. வேறு தேதி அல்லது குறைந்த அளவை முயற்சிக்கவும்.",
                    )}
                  </p>
                )}
              </>
            )}
            {step === 3 && (
              <section className="card">
                <h2>{chosen.name[language]}</h2>
                <label>
                  {t("Date", "தேதி")}
                  <select
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setSlot("");
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <option key={i} value={localDate(i)}>
                        {
                          [
                            t("Today", "இன்று"),
                            t("Tomorrow", "நாளை"),
                            t("Day after tomorrow", "நாளை மறுநாள்"),
                          ][i]
                        }{" "}
                        · {localDate(i)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="slot-grid">
                  {slots(chosen, date, data.bookings, data.settings).map(
                    (s) => (
                      <button
                        className={`choice ${slot === s.id ? "selected" : ""}`}
                        key={s.id}
                        disabled={s.past || !s.left}
                        onClick={() => setSlot(s.id)}
                      >
                        <strong>{s.id}</strong>
                        <small>
                          {s.past
                            ? t("Passed", "முடிந்தது")
                            : s.left
                              ? `${s.left} ${t("available", "இடங்கள்")}`
                              : t("Full", "நிரம்பியது")}
                        </small>
                      </button>
                    ),
                  )}
                </div>
                {button(
                  t("Review booking", "முன்பதிவை சரிபார்"),
                  () => setStep(4),
                  false,
                  !slot,
                )}
              </section>
            )}
            {step === 4 && (
              <section className="card">
                <dl>
                  <dt>{t("Crop", "பயிர்")}</dt>
                  <dd>{cropById(crop)?.name[language]}</dd>
                  <dt>{t("Quantity", "அளவு")}</dt>
                  <dd>
                    {quantityKg} {t("kg", "கிலோ")}
                  </dd>
                  <dt>{t("Centre", "நிலையம்")}</dt>
                  <dd>{chosen.name[language]}</dd>
                  <dt>{t("Date / time", "தேதி / நேரம்")}</dt>
                  <dd>
                    {date} · {slot}
                  </dd>
                  <dt>{t("Sample distance", "மாதிரி தூரம்")}</dt>
                  <dd>
                    {chosen.distanceKm} {t("km", "கி.மீ.")}
                  </dd>
                  <dt>
                    {t("Estimated queue wait", "மதிப்பிடப்பட்ட காத்திருப்பு")}
                  </dt>
                  <dd>
                    {(data.queues[chosen.id] ?? chosen.initialQueue) *
                      chosen.minutesPerFarmer}{" "}
                    {t("minutes", "நிமிடங்கள்")}
                  </dd>
                </dl>
                <p className="info">
                  {t(
                    "Bring your produce and farmer identification. Final weight and value are recorded at the centre.",
                    "விளைபொருள் மற்றும் விவசாயி அடையாள அட்டையை கொண்டு வாருங்கள். இறுதி எடை மற்றும் விலை நிலையத்தில் பதிவு செய்யப்படும்.",
                  )}
                </p>
                {button(
                  t("Confirm booking", "முன்பதிவை உறுதி செய்"),
                  confirmBooking,
                )}
              </section>
            )}
            {step > 0 &&
              button(
                t("Back", "பின்செல்"),
                () => {
                  setStep(step - 1);
                  setError("");
                },
                true,
              )}
          </>
        )}
      </>
    );
  } else if (page === "token" && isFarmer)
    content = current ? (
      <>
        {heading(
          t("YOUR DIGITAL TOKEN", "உங்கள் மின்னணு டோக்கன்"),
          t("Your turn, made clear.", "உங்கள் முறை, தெளிவாக."),
        )}
        <section className="ticket">
          <div className="row">
            <strong>KISH</strong>
            <span className="badge">{status(current.status)}</span>
          </div>
          <div className="ticket-main">
            <p>{t("TOKEN NUMBER", "டோக்கன் எண்")}</p>
            <h2 className="token-number">
              {String(current.tokenNo).padStart(3, "0")}
            </h2>
            <h3>{centreById(current.centreId)?.name[language]}</h3>
            <p>
              {current.date} · {current.slotId}
            </p>
          </div>
          <div className="ticket-bottom">
            <strong>{current.farmerName}</strong>
            <p>
              {cropById(current.cropId)?.name[language]} · {current.quantityKg}{" "}
              {t("kg", "கிலோ")}
            </p>
            <small>{current.id.slice(0, 8).toUpperCase()}</small>
          </div>
        </section>
        <section className="card">
          <div className="row">
            <h2>{t("Queue preview", "வரிசை முன்னோட்டம்")}</h2>
            <span className="badge amber">{t("Simulation", "மாதிரி")}</span>
          </div>
          <div className="stats">
            <div>
              <strong>
                {data.queues[current.centreId] ??
                  centreById(current.centreId)!.initialQueue}
              </strong>
              <span>{t("farmers ahead", "விவசாயிகள் முன்னால்")}</span>
            </div>
            <div>
              <strong>
                {(data.queues[current.centreId] ??
                  centreById(current.centreId)!.initialQueue) *
                  centreById(current.centreId)!.minutesPerFarmer}
              </strong>
              <span>{t("minutes estimated", "நிமிடங்கள் மதிப்பீடு")}</span>
            </div>
          </div>
          <p>
            {t(
              "This is a demo queue, not a live arrival forecast.",
              "இது மாதிரி வரிசை; நேரடி வருகை கணிப்பு அல்ல.",
            )}
          </p>
          {button(
            t("Simulate next farmer", "அடுத்த விவசாயி · மாதிரி"),
            () => advanceQueue(centreById(current.centreId)!),
            true,
            (data.queues[current.centreId] ??
              centreById(current.centreId)!.initialQueue) === 0,
          )}
          {current.status === "booked" &&
            button(t("I have arrived", "நான் வந்துவிட்டேன்"), () =>
              updateBooking(current, "arrived"),
            )}
          {button(
            t("Print / save token", "டோக்கனை அச்சிடு / சேமி"),
            () => window.print(),
            true,
          )}
          {["booked", "arrived"].includes(current.status) &&
            button(
              t("Cancel booking", "முன்பதிவை ரத்து செய்"),
              () => {
                if (
                  window.confirm(
                    t(
                      "Cancel this booking and release the slot?",
                      "இந்த முன்பதிவை ரத்து செய்து நேரத்தை விடுவிக்கவா?",
                    ),
                  )
                )
                  updateBooking(current, "cancelled");
              },
              true,
            )}
        </section>
      </>
    ) : (
      blank(
        t("No active token", "செயலில் டோக்கன் இல்லை"),
        t(
          "Book a slot to get your digital token. Completed tokens are in My procurement.",
          "டோக்கன் பெற நேரத்தை முன்பதிவு செய்யவும். முடிந்த பதிவுகள் என் கொள்முதலில் உள்ளன.",
        ),
      )
    );
  else if (page === "centres" || page === "detail")
    content =
      page === "detail" ? (
        <>
          {heading(
            t("CENTRE DETAILS", "நிலைய விவரங்கள்"),
            chosen.name[language],
          )}
          {centreCard(chosen)}
          <section className="card">
            <h2>{t("At this centre", "இந்த நிலையத்தில்")}</h2>
            <p>
              {chosen.facilities
                .map((f) => facilityLabels[f]?.[language] ?? f)
                .join(" · ")}
            </p>
            <p>
              {t("Opening hours", "திறக்கும் நேரம்")}:{" "}
              {Math.floor(chosen.opensAt / 60)}:
              {String(chosen.opensAt % 60).padStart(2, "0")} –{" "}
              {Math.floor(chosen.closesAt / 60)}:
              {String(chosen.closesAt % 60).padStart(2, "0")}
            </p>
            <h3>
              {t(
                "Sample crop rates / 100 kg",
                "மாதிரி பயிர் விலைகள் / 100 கிலோ",
              )}
            </h3>
            {crops.map((c) => (
              <div className="list-row" key={c.id}>
                <span>{c.name[language]}</span>
                <strong>{money(chosen.rates[c.id])}</strong>
              </div>
            ))}
            {button(
              t("Book at this centre", "இந்த நிலையத்தில் முன்பதிவு"),
              () => {
                setPreferredCentre(chosen.id);
                setStep(0);
                navigate("book");
              },
            )}
          </section>
        </>
      ) : (
        <>
          {heading(
            t("PLAN YOUR VISIT", "பயணத்தை திட்டமிடுங்கள்"),
            t("Procurement centres", "கொள்முதல் நிலையங்கள்"),
          )}
          <label>
            {t("Search centres", "நிலையங்களைத் தேடு")}
            <input value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          {centres
            .filter((c) =>
              `${c.name.en} ${c.name.ta}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((c) => centreCard(c))}
        </>
      );
  else if (page === "procurement" || page === "payments" || page === "queue")
    content = (
      <>
        {heading(
          roleName(session.role),
          page === "payments"
            ? t("Payment status", "பண நிலை")
            : page === "queue"
              ? t("Bookings & queue", "முன்பதிவுகள் மற்றும் வரிசை")
              : t("Procurement records", "கொள்முதல் பதிவுகள்"),
        )}
        {page === "queue" && !isFarmer && (
          <section className="card">
            <p>
              {t("Sample farmers ahead", "மாதிரியில் முன்னால் உள்ள விவசாயிகள்")}
              :{" "}
              {data.queues[operatorCentre] ??
                centreById(operatorCentre)!.initialQueue}
            </p>
            {button(
              t("Serve next sample farmer", "அடுத்த மாதிரி விவசாயி"),
              () => advanceQueue(centreById(operatorCentre)!),
              true,
            )}
          </section>
        )}
        <label>
          {t("Search name, token or date", "பெயர், டோக்கன் அல்லது தேதியை தேடு")}
          <input value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <div className="filter-grid">
          <label>
            {t("Crop", "பயிர்")}
            <select
              value={recordCrop}
              onChange={(e) => setRecordCrop(e.target.value)}
            >
              <option value="">{t("All crops", "அனைத்து பயிர்கள்")}</option>
              {crops.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name[language]}
                </option>
              ))}
            </select>
          </label>
          {isAdmin && (
            <label>
              {t("Centre", "நிலையம்")}
              <select
                value={recordCentre}
                onChange={(e) => setRecordCentre(e.target.value)}
              >
                <option value="">
                  {t("All centres", "அனைத்து நிலையங்கள்")}
                </option>
                {centres.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.village[language]}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="tabs">
          {(page === "payments"
            ? [
                ["all", t("All", "அனைத்தும்")],
                ["completed", t("Pending", "நிலுவை")],
                ["payment_pending", t("Processing", "செயலாக்கம்")],
                ["paid", t("Paid", "வழங்கியது")],
              ]
            : [
                ["all", t("All", "அனைத்தும்")],
                ["active", t("Current", "தற்போதைய")],
                ["completed", t("Completed", "முடிந்தவை")],
              ]
          ).map(([id, label]) => (
            <button
              key={id}
              className={filter === id ? "selected" : ""}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {filteredRecords.length
          ? filteredRecords.slice().reverse().map(bookingCard)
          : blank(
              t("No records here yet", "இன்னும் பதிவுகள் இல்லை"),
              t(
                "Records appear as your booking moves through procurement.",
                "கொள்முதல் நடைபெறும் போது பதிவுகள் இங்கு தோன்றும்.",
              ),
            )}
      </>
    );
  else if (page === "alerts") {
    const alerts = data.alerts.filter((a) => a.phone === session.phone);
    content = (
      <>
        {heading(
          t("STAY INFORMED", "தகவல்களை அறியுங்கள்"),
          t("Your alerts", "உங்கள் அறிவிப்புகள்"),
        )}
        {alerts.length > 0 &&
          button(
            t("Mark all as read", "அனைத்தையும் படித்ததாக குறி"),
            () =>
              setData((d) => ({
                ...d,
                alerts: d.alerts.map((a) =>
                  a.phone === session.phone ? { ...a, read: true } : a,
                ),
              })),
            true,
          )}
        {alerts.length
          ? alerts.map((a) => (
              <button
                className={`card alert ${a.read ? "read" : ""}`}
                key={a.id}
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    alerts: d.alerts.map((x) =>
                      x.id === a.id ? { ...x, read: true } : x,
                    ),
                  }))
                }
              >
                <Icon name="bell" />
                <div>
                  <h3>{a[language]}</h3>
                  <p>
                    {t("Token", "டோக்கன்")} #{a.token}
                  </p>
                  <small>
                    {new Date(a.time).toLocaleString(
                      language === "ta" ? "ta-IN" : "en-IN",
                    )}
                  </small>
                </div>
                {!a.read && <span className="unread" />}
              </button>
            ))
          : blank(
              t("You’re all caught up", "புதிய அறிவிப்புகள் இல்லை"),
              t(
                "Booking, queue and payment updates appear here.",
                "முன்பதிவு, வரிசை மற்றும் பண அறிவிப்புகள் இங்கு தோன்றும்.",
              ),
            )}
      </>
    );
  } else if (page === "capacity" && !isFarmer)
    content = (
      <>
        {heading(
          t("CENTRE OPERATIONS", "நிலைய செயல்பாடுகள்"),
          t("Capacity & availability", "கொள்ளளவு மற்றும் நேரங்கள்"),
        )}
        {(isAdmin
          ? centres
          : centres.filter((c) => c.id === operatorCentre)
        ).map((c) => (
          <section className="card" key={c.id}>
            <h2>{c.name[language]}</h2>
            <label className="check-label">
              <input
                type="checkbox"
                checked={data.settings[c.id]?.open !== false}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    settings: {
                      ...d.settings,
                      [c.id]: {
                        open: e.target.checked,
                        slots: d.settings[c.id]?.slots ?? 6,
                        capacity:
                          d.settings[c.id]?.capacity ??
                          (c.capacityTonnes - c.capacityUsedTonnes) * 1000,
                      },
                    },
                  }))
                }
              />
              {t("Accept bookings", "முன்பதிவுகளை ஏற்கவும்")}
            </label>
            <label>
              {t("Bookings per hourly slot", "ஒரு மணி நேர முன்பதிவுகள்")}
              <input
                type="number"
                min="1"
                max="100"
                value={data.settings[c.id]?.slots ?? 6}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isInteger(n) && n >= 1 && n <= 100)
                    setData((d) => ({
                      ...d,
                      settings: {
                        ...d.settings,
                        [c.id]: {
                          open: d.settings[c.id]?.open ?? true,
                          slots: n,
                          capacity:
                            d.settings[c.id]?.capacity ??
                            (c.capacityTonnes - c.capacityUsedTonnes) * 1000,
                        },
                      },
                    }));
                }}
              />
            </label>
            <label>
              {t(
                "Daily booking allowance (kg)",
                "தினசரி முன்பதிவு கொள்ளளவு (கிலோ)",
              )}
              <input
                type="number"
                min="0"
                max="1000000"
                value={
                  data.settings[c.id]?.capacity ??
                  (c.capacityTonnes - c.capacityUsedTonnes) * 1000
                }
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n >= 0 && n <= 1000000)
                    setData((d) => ({
                      ...d,
                      settings: {
                        ...d.settings,
                        [c.id]: {
                          open: d.settings[c.id]?.open ?? true,
                          slots: d.settings[c.id]?.slots ?? 6,
                          capacity: n,
                        },
                      },
                    }));
                }}
              />
            </label>
            <p className="small">
              {t(
                "Changes save automatically. Existing bookings remain valid.",
                "மாற்றங்கள் தானாக சேமிக்கப்படும். ஏற்கனவே உள்ள முன்பதிவுகள் செல்லுபடியாகும்.",
              )}
            </p>
          </section>
        ))}
      </>
    );
  else if (page === "farmers" && isAdmin)
    content = (
      <>
        {heading(
          t("ADMINISTRATION", "நிர்வாகம்"),
          t("Registered demo profiles", "பதிவுசெய்த மாதிரி சுயவிவரங்கள்"),
        )}
        <label>
          {t("Search farmers", "விவசாயிகளைத் தேடு")}
          <input value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        {Object.entries(data.profiles)
          .filter(([p, value]) =>
            `${p} ${value.name} ${value.village}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          )
          .map(([p, value]) => (
            <section className="card" key={p}>
              <h2>{value.name}</h2>
              <p>
                {value.village} · +91 {p}
              </p>
              <p>
                {data.bookings.filter((b) => b.farmerPhone === p).length}{" "}
                {t("bookings", "முன்பதிவுகள்")}
              </p>
            </section>
          ))}
      </>
    );
  else
    content = (
      <>
        {heading(
          t("YOUR KISH", "உங்கள் கிஷ்"),
          t("Profile & preferences", "சுயவிவரம் மற்றும் விருப்பங்கள்"),
        )}
        <section className="card">
          <div className="profile-heading">
            <span className="avatar">{profile?.name[0]?.toUpperCase()}</span>
            <div>
              <h2>{profile?.name}</h2>
              <p>
                +91 {session.phone} · {roleName(session.role)}
              </p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const values = new FormData(e.currentTarget);
              const n = String(values.get("name")).trim();
              const v = String(values.get("village")).trim();
              if (n && v) {
                setData((d) => ({
                  ...d,
                  profiles: {
                    ...d.profiles,
                    [session.phone]: { name: n, village: v },
                  },
                }));
                setNotice(t("Profile saved.", "சுயவிவரம் சேமிக்கப்பட்டது."));
              }
            }}
          >
            <label>
              {t("Name", "பெயர்")}
              <input
                name="name"
                defaultValue={profile?.name}
                required
                maxLength={80}
              />
            </label>
            <label>
              {t("Village", "கிராமம்")}
              <input
                name="village"
                defaultValue={profile?.village}
                required
                maxLength={100}
              />
            </label>
            <button className="button">
              {t("Save profile", "சுயவிவரத்தை சேமி")}
            </button>
          </form>
        </section>
        <section className="card">
          <h2>{t("Make it comfortable", "உங்களுக்கு ஏற்ற அமைப்புகள்")}</h2>
          <label>
            {t("Language", "மொழி")}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "ta")}
            >
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
            </select>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={large}
              onChange={(e) => setLarge(e.target.checked)}
            />
            {t("Larger text", "பெரிய எழுத்துகள்")}
          </label>
          <p className="small">
            {t(
              "To install: open your browser menu and choose “Install app” or “Add to Home Screen”.",
              "நிறுவ: உலாவி மெனுவில் “Install app” அல்லது “Add to Home Screen” தேர்வு செய்யவும்.",
            )}
          </p>
        </section>
        <section className="card">
          <h2>{t("Demo workspace", "மாதிரி பணியிடம்")}</h2>
          <p>
            {t(
              "Switch roles to demonstrate the full farmer → centre → payment journey. Data stays on this device.",
              "விவசாயி → நிலையம் → பணம் பயணத்தை முயற்சிக்க பணியை மாற்றவும். தரவு இந்த சாதனத்தில் இருக்கும்.",
            )}
          </p>
          <label>
            {t("Demo role", "மாதிரி பணி")}
            <select
              value={session.role}
              onChange={(e) => {
                setSession({ ...session, role: e.target.value as RoleKey });
                navigate("home");
              }}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {roleName(r)}
                </option>
              ))}
            </select>
          </label>
        </section>
        {button(
          t("Log out", "வெளியேறு"),
          () => {
            setSession(null);
            setStage("login");
            setPhone("");
            setOtp("");
            setName("");
            setVillage("");
            setError("");
            setNotice("");
          },
          true,
        )}
      </>
    );
  const nav: [Page, IconName, string][] = isFarmer
    ? [
        ["home", "home", t("Home", "முகப்பு")],
        ["book", "field", t("Book", "முன்பதிவு")],
        ["token", "ticket", t("Token", "டோக்கன்")],
        ["alerts", "bell", t("Alerts", "அறிவிப்பு")],
        ["profile", "profile", t("Profile", "சுயவிவரம்")],
      ]
    : [
        ["home", "home", t("Home", "முகப்பு")],
        ["queue", "queue", t("Queue", "வரிசை")],
        [
          isAdmin ? "farmers" : "capacity",
          isAdmin ? "profile" : "dashboard",
          isAdmin ? t("Farmers", "விவசாயிகள்") : t("Capacity", "கொள்ளளவு"),
        ],
        ["payments", "money", t("Payments", "பணம்")],
        ["profile", "profile", t("Profile", "சுயவிவரம்")],
      ];
  return (
    <div className={`app ${large ? "large-text" : ""}`}>
      <header className="app-header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (session) navigate("home");
            else setStage("intro");
          }}
        >
          <span className="brand-mark">
            <Icon name="field" size={27} />
          </span>
          <span>
            Kish<small>by dot</small>
          </span>
        </a>
        <div className="header-actions">
          <button
            className="language-button"
            onClick={() => setLanguage(language === "en" ? "ta" : "en")}
          >
            {language === "en" ? "தமிழ்" : "English"}
          </button>
          {session && (
            <button
              className="icon-button"
              aria-label={t("Alerts", "அறிவிப்புகள்")}
              onClick={() => navigate("alerts")}
            >
              <Icon name="bell" />
              {data.alerts.some(
                (a) => a.phone === session.phone && !a.read,
              ) && <span className="notification-dot" />}
            </button>
          )}
        </div>
      </header>
      <div className="demo-strip">
        <span /> {t("DEMO WORKSPACE", "மாதிரி பணியிடம்")}{" "}
        <span className="demo-description">
          {t(
            "Sample data · saved on this device",
            "மாதிரித் தரவு · இந்த சாதனத்தில் சேமிப்பு",
          )}
        </span>
      </div>
      {session && !isFarmer && (
        <div className="operator-select">
          <label>
            {t("Operating centre", "பணியாற்றும் நிலையம்")}
            <select
              value={operatorCentre}
              onChange={(e) => {
                setOperatorCentre(e.target.value);
                setRecord(null);
              }}
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name[language]}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <main id="main">
        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}
        {content}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <footer>
          Kish ·{" "}
          {t(
            "Built by dot for the people who grow.",
            "விவசாயிகளுக்காக dot உருவாக்கியது.",
          )}
        </footer>
      </main>
      {session && (
        <nav
          className="bottom-nav"
          aria-label={t("Main navigation", "முதன்மை வழிசெலுத்தல்")}
        >
          {nav.map(([p, icon, label]) => (
            <button
              key={p}
              className={page === p ? "active" : ""}
              aria-current={page === p ? "page" : undefined}
              onClick={() => {
                if (p === "book" && page !== "book") setStep(0);
                navigate(p);
              }}
            >
              <Icon name={icon} size={23} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
