/**
 * Every word rendered on the site lives here.
 *
 * Sourcing rules followed throughout:
 *   - Facts about the artwork itself (concept, materials, technique,
 *     dimensions, timeline, members) come from `INFO.md`.
 *   - Facts about the historical Tiger I come from the research INFO.md
 *     asked for; each part section carries its own `sources` list and the
 *     full bibliography is rendered in the closing section.
 *   - Anything INFO.md does not cover is marked with a visible
 *     `[ต้องการข้อมูลเพิ่ม: ...]` string rather than invented.
 */

import type { PartKey } from "@/lib/sections";

/** Thai is the primary language; English runs alongside it. */
export interface Bi {
  th: string;
  en: string;
}

export const MISSING = (what: string) => `[ต้องการข้อมูลเพิ่ม: ${what}]`;

/* ------------------------------ meta -------------------------------- */

export const META = {
  title: { th: "อสูรกายพยัคฆ์เหล็ก", en: "Iron Tiger" },
  subtitle: {
    th: "โมเดลจำลองรถถัง Tiger I จากกระดาษลัง",
    en: "A Tiger I scale model built from corrugated cardboard",
  },
  heroLine: {
    th: "รถถังหนักของเยอรมันในสงครามโลกครั้งที่สอง ย่อส่วนลงมาด้วยกระดาษลังและตะเกียบ",
    en: "A German WWII heavy tank, rebuilt at desk scale from cardboard and chopsticks.",
  },
  subject: { th: "รายวิชา ศิลปะ", en: "Subject: Art" },
  scaleNote: {
    th: "ประมาณ 1:32 (เทียบความยาวตัวถังของรถถังจริง 6.316 เมตร กับโมเดลยาว 20 ซม.)",
    en: "Approximately 1:32, derived from the real hull length of 6.316 m against the model's 20 cm.",
  },
} as const;

export const MEMBERS = [
  { name: "นาย ดรัสพงศ์ น้ำใส", no: "เลขที่ 4", id: "28934" },
  { name: "นาย ธนภัทร มีม่วง", no: "เลขที่ 6", id: "28936" },
  { name: "นาย ธนัทเทพ ชุ่มมงคล", no: "เลขที่ 9", id: "28939" },
  { name: "นาย ปิส่ง มินทู", no: "เลขที่ 13", id: "28943" },
  { name: "นาย พิริยกร แซ่ฟุ้ง", no: "เลขที่ 18", id: "28948" },
] as const;

/* --------------------------- hero & overview ------------------------ */

export const OVERVIEW = {
  eyebrow: { th: "ภาพรวมผลงาน", en: "Overview" },
  heading: {
    th: "หนึ่งชิ้นงาน สี่กลุ่มโครงสร้าง",
    en: "One model, four structural groups",
  },
  concept: {
    label: { th: "แนวคิด", en: "Concept" },
    body: {
      th: "นำเสนอความแข็งแกร่งและความสำคัญของรถถังในสงครามโลกครั้งที่สอง โดยใช้รถถัง Tiger I เป็นตัวหลักในการนำเสนอ เพื่อถ่ายทอดบรรยากาศของสนามรบ",
      en: "To present the strength and significance of the tank in the Second World War, using the Tiger I as the centrepiece in order to convey the atmosphere of a battlefield.",
    },
  },
  inspiration: {
    label: { th: "แรงบันดาลใจ", en: "Inspiration" },
    body: {
      th: "นำเสนอความแข็งแกร่งของรถถังที่เหมือนกับเสือเวลาล่าเหยื่อ",
      en: "The strength of the tank, likened to a tiger closing on its prey.",
    },
  },
  note: {
    th: "เลื่อนลงเพื่อดูทีละชิ้นส่วน — กล้องจะเคลื่อนตามการเลื่อนหน้าจอ",
    en: "Scroll to inspect each part. The camera follows your scroll position.",
  },
} as const;

/* --------------------------- part sections -------------------------- */

export interface PartAnswers {
  function: Bi;
  purpose: Bi;
  inspiration: Bi;
  engineering: Bi;
}

export interface PartContent {
  key: PartKey;
  index: string;
  name: Bi;
  /** Short line shown next to the leader line on the model. */
  tag: Bi;
  /**
   * The four questions every part section must answer, kept short enough
   * that the card never needs an internal scrollbar.
   */
  qa: PartAnswers;
  /** The same four answers in full, behind the card's disclosure. */
  deep: PartAnswers;
  /** How this part was made, from INFO.md and the photographs. */
  build: Bi;
  photo: { src: string; alt: Bi };
  sources: string[];
}

export const PARTS: PartContent[] = [
  {
    key: "turret",
    index: "01",
    name: { th: "ป้อมปืน", en: "Turret" },
    tag: { th: "เกราะหน้า 100 มม.", en: "100 mm front plate" },
    qa: {
      function: {
        th: "เกราะหุ้มที่หมุนได้รอบตัว 360 องศา บรรจุปืนใหญ่ อุปกรณ์เล็ง และพลประจำรถ 3 ใน 5 คน",
        en: "A rotating armoured housing for the gun, the sights and three of the five crew.",
      },
      purpose: {
        th: "รวมเกราะหนาที่สุดไว้รอบช่องปืน และให้ผู้บังคับการรถมองเห็นรอบตัวจากป้อมสังเกตการณ์",
        en: "Concentrates the thickest armour around the gun, and gives the commander all-round vision.",
      },
      inspiration: {
        th: "Krupp ออกแบบไว้ให้ตัวรถของ Porsche แต่แบบของ Henschel ชนะการประกวดปี 1942 จึงย้ายมาติดบนตัวรถ Henschel",
        en: "Krupp designed it for the rival Porsche chassis; it moved to the Henschel hull when that design won in 1942.",
      },
      engineering: {
        th: "โครงสร้างเชื่อม หนัก 11 ตัน เกราะหน้า 100 มม. ข้างและหลัง 80 มม. หมุนด้วยไฮดรอลิก 0.1 ถึง 36 องศาต่อวินาที",
        en: "Welded, 11 tonnes. 100 mm front, 80 mm sides and rear. Hydraulic traverse, 0.1 to 36 degrees per second.",
      },
    },
    deep: {
      function: {
        th: "เป็นเกราะหุ้มที่หมุนได้รอบตัว บรรจุปืนใหญ่ อุปกรณ์เล็ง และพลประจำรถ 3 ใน 5 คน คือ ผู้บังคับการรถ พลยิง และพลบรรจุ ทำให้หันปืนได้ 360 องศาโดยไม่ต้องหันตัวรถ",
        en: "A fully rotating armoured housing for the main gun, the sighting equipment and three of the five crew — commander, gunner and loader — allowing 360° traverse independent of the hull.",
      },
      purpose: {
        th: "ออกแบบให้มีเกราะหนาที่สุดรอบช่องปืน พร้อมระบบหมุนด้วยกำลังไฮดรอลิกเพื่อจับเป้าที่กำลังเคลื่อนที่ และมีป้อมสังเกตการณ์ (cupola) ให้ผู้บังคับการรถมองเห็นรอบตัว",
        en: "Built to concentrate the thickest armour around the gun opening, with powered traverse for engaging moving targets and a commander's cupola giving all-round observation.",
      },
      inspiration: {
        th: "ป้อมปืนนี้ออกแบบโดยบริษัท Krupp สำหรับตัวรถของ Porsche ที่แข่งขันกันอยู่ แต่เมื่อแบบของ Henschel ชนะการประกวดในปี 1942 ป้อมของ Krupp จึงถูกนำมาติดตั้งบนตัวรถ Henschel แทน",
        en: "Krupp designed this turret for the competing Porsche chassis. When Henschel's design won the 1942 competition, the Krupp turret was adapted onto the Henschel hull instead.",
      },
      engineering: {
        th: "โครงสร้างเชื่อม น้ำหนักราว 11 ตัน เกราะหน้าหนา 100 มม. ด้านข้างและด้านหลัง 80 มม. แผ่นหน้าประกอบด้วยแท่งเหล็กแนวนอนสองแท่งสอดเข้าร่องบนแผ่นข้าง เอียงจากแนวดิ่ง 5 องศา ยึดด้วยลิ่มเหล็กตอกเข้าร่องแล้วเชื่อมทั้งด้านในและด้านนอก ระบบหมุนป้อมใช้กำลังไฮดรอลิก ปรับได้ตั้งแต่ 0.1 ถึง 36 องศาต่อวินาที ขึ้นกับรอบเครื่องยนต์",
        en: "Welded construction weighing about 11 tonnes: 100 mm front, 80 mm sides and rear. The front plate used two horizontal steel bars slotted into the side plates at 5° from vertical, locked with hammered steel shims and welded inside and out. Traverse was hydraulically powered, variable from 0.1° to 36° per second depending on engine rpm.",
      },
    },
    build: {
      th: "ในโมเดลใช้กระดาษลังตัดเป็นแผ่นแล้วพับขึ้นรูปเป็นกล่องเหลี่ยม ต่อแผ่นแก้มเอียงด้านหน้าแยกชิ้นแล้วติดกาว ป้อมสังเกตการณ์ม้วนจากกระดาษเป็นทรงกระบอก ฝาเปิดค้างไว้",
      en: "In the model the turret is cut from cardboard sheet and folded into a faceted box, with the angled front cheeks cut as separate pieces and glued on. The cupola is a rolled cardboard cylinder with its hatch left standing open.",
    },
    photo: {
      src: "/photos/turret-cupola-detail.jpg",
      alt: {
        th: "ภาพระยะใกล้ของป้อมปืนกระดาษลัง เห็นป้อมสังเกตการณ์ทรงกระบอก ฝาช่องบนหลังคา และลอนกระดาษที่ขอบตัด",
        en: "Close-up of the cardboard turret showing the cylindrical cupola, the roof hatches and the corrugation visible along every cut edge.",
      },
    },
    sources: [
      "https://en.wikipedia.org/wiki/Tiger_I",
      "https://tiger1.info/EN/Turret-front-plates.html",
      "https://www.historyofwar.org/articles/weapons_tiger_I.html",
    ],
  },
  {
    key: "gun",
    index: "02",
    name: { th: "ปืนใหญ่ 8.8 ซม. KwK 36 L/56", en: "8.8 cm KwK 36 L/56" },
    tag: { th: "ลำกล้องยาว 4.93 ม.", en: "4.93 m barrel" },
    qa: {
      function: {
        th: "อาวุธหลักต่อต้านรถถัง รหัส L/56 คือลำกล้องยาว 56 เท่าของขนาดลำกล้อง ราว 4.93 เมตร",
        en: "The main anti-tank weapon. L/56 means a barrel 56 calibres long, about 4.93 metres.",
      },
      purpose: {
        th: "ความเร็วต้นสูง วิถีกระสุนราบ เจาะเกราะรถถังฝ่ายสัมพันธมิตรได้ทุกแบบในยุคนั้นจากระยะไกล",
        en: "High velocity and a flat trajectory, to defeat any Allied tank of the era at long range.",
      },
      inspiration: {
        th: "พัฒนาจากปืนต่อสู้อากาศยาน 8.8 ซม. Flak 36 ซึ่งเคยพิสูจน์ตัวในบทบาทต่อต้านรถถังมาก่อน",
        en: "Developed from the 8.8 cm Flak 36 anti-aircraft gun, already proven against tanks.",
      },
      engineering: {
        th: "ผลิตโดย Krupp มีเบรกปากลำกล้อง ความเร็วต้น 780 ถึง 930 เมตรต่อวินาที เจาะเกราะ 99 ถึง 138 มม. ที่ 1,000 เมตร บรรจุ 92 นัด",
        en: "Krupp-built with a muzzle brake. 780 to 930 m/s, piercing 99 to 138 mm at 1,000 m. 92 rounds carried.",
      },
    },
    deep: {
      function: {
        th: "อาวุธหลักสำหรับยิงต่อต้านรถถังและที่มั่น รหัส L/56 หมายถึงความยาวลำกล้องเท่ากับ 56 เท่าของขนาดลำกล้อง คือประมาณ 4.93 เมตร",
        en: "The primary anti-tank and anti-fortification weapon. The designation L/56 means a barrel 56 calibres long — roughly 4.93 metres.",
      },
      purpose: {
        th: "ต้องการปืนความเร็วต้นสูงที่วิถีกระสุนราบ เพื่อเจาะเกราะรถถังฝ่ายสัมพันธมิตรทุกแบบในยุคนั้นได้จากระยะไกล",
        en: "A high-velocity, flat-trajectory gun able to defeat any contemporary Allied tank armour at long range.",
      },
      inspiration: {
        th: "พัฒนาโดยตรงจากปืนต่อสู้อากาศยาน 8.8 ซม. Flak 36 ซึ่งสืบทอดจาก Flak 18 ที่เคยพิสูจน์ตัวเองในบทบาทปืนต่อต้านรถถังแบบเฉพาะหน้ามาก่อน Krupp นำวิถีกระสุนของปืน ต.อ. มาปรับให้อยู่ในพื้นที่จำกัดของป้อมปืนรถถัง",
        en: "Derived directly from the 8.8 cm Flak 36 anti-aircraft gun — itself descended from the Flak 18, which had already proved effective as an improvised anti-tank weapon. Krupp adapted the AA gun's ballistics to the confined space of a tank turret.",
      },
      engineering: {
        th: "ผลิตโดย Krupp ติดเบรกปากลำกล้อง ความเร็วต้นราว 780 เมตรต่อวินาทีด้วยกระสุน PzGr.39 และ 930 เมตรต่อวินาทีด้วยกระสุนแกนทังสเตน PzGr.40 เจาะเกราะได้ราว 99 มม. ที่ระยะ 1,000 เมตร และราว 138 มม. ด้วยกระสุนแกนทังสเตน บรรจุกระสุนได้ 92 นัด ใช้เวลาบรรจุใหม่ 6 ถึง 16 วินาทีขึ้นกับมุมป้อมปืน โล่ปืนเป็นชิ้นหล่อโค้ง หนา 110 ถึง 200 มม. แล้วแต่มุมกระทบ",
        en: "Built by Krupp with a muzzle brake. Muzzle velocity was about 780 m/s with the PzGr.39 round and 930 m/s with the tungsten-cored PzGr.40, penetrating roughly 99 mm of armour at 1,000 m — about 138 mm with the tungsten round. The tank carried 92 rounds, with a reload of 6 to 16 seconds depending on turret angle. The mantlet was a curved casting 110 to 200 mm thick depending on the angle of impact.",
      },
    },
    build: {
      th: "ลำกล้องม้วนกระดาษลังเป็นท่อกลมแล้วทากาวทับหลายชั้นให้แข็ง เจาะปลายให้กลวงเห็นรูลำกล้อง เบรกปากลำกล้องเป็นท่อสั้นอีกชิ้นสวมทับ",
      en: "The barrel is corrugated card rolled into a tube and glued in overlapping layers for rigidity, with the muzzle opened up so the bore reads as hollow. The muzzle brake is a second, shorter tube slipped over the end.",
    },
    photo: {
      src: "/photos/front-left-low.jpg",
      alt: {
        th: "โมเดลรถถังมองจากมุมหน้าซ้ายระดับต่ำ เห็นลำกล้องปืนยาวยื่นออกจากป้อมปืนและปลายลำกล้องที่เจาะกลวง",
        en: "Low front-left view of the model, showing the long gun barrel projecting from the turret and its hollowed muzzle.",
      },
    },
    sources: [
      "https://en.wikipedia.org/wiki/8.8_cm_KwK_36",
      "https://tanks-encyclopedia.com/ww2/germany/panzer-vi_tiger.php",
    ],
  },
  {
    key: "runningGear",
    index: "03",
    name: { th: "ตีนตะขาบและชุดล้อ", en: "Running gear" },
    tag: { th: "ล้อซ้อนสลับ Schachtellaufwerk", en: "Interleaved road wheels" },
    qa: {
      function: {
        th: "รับน้ำหนักทั้งคัน กระจายแรงกดลงพื้น ดูดซับแรงกระแทก และส่งกำลังขับเคลื่อนผ่านสายพาน",
        en: "Carries the mass of the vehicle, spreads its load, absorbs shock and drives the tracks.",
      },
      purpose: {
        th: "กระจายน้ำหนัก 54 ถึง 57 ตัน ลงล้อให้มากที่สุด เพื่อลดแรงกดต่อพื้นและให้ทรงตัวนุ่มขึ้น",
        en: "Spreads 54 to 57 tonnes over as many wheels as possible, lowering ground pressure.",
      },
      inspiration: {
        th: "ล้อซ้อนสลับสืบมาจากรถต้นแบบ VK36.01 ของ Henschel เพราะน้ำหนักระดับนี้ต้องการการกระจายแรงกดที่ดีกว่าชุดล้อธรรมดา",
        en: "The interleaved layout came from the Henschel VK36.01 prototype; this weight class demanded it.",
      },
      engineering: {
        th: "ทอร์ชันบาร์ 16 ท่อน ล้อเหล็ก 800 มม. หุ้มยางตัน สายพานแบบรบกว้าง 725 มม. สลับกับแบบขนส่งทางรถไฟ 520 มม.",
        en: "Sixteen torsion bars, 800 mm rubber-tyred steel wheels, 725 mm combat tracks, 520 mm for rail transport.",
      },
    },
    deep: {
      function: {
        th: "รับน้ำหนักตัวรถทั้งคัน กระจายแรงกดลงพื้น ดูดซับแรงกระแทก และส่งกำลังขับเคลื่อนผ่านสายพานตีนตะขาบ",
        en: "Carries the entire mass of the vehicle, spreads its load on the ground, absorbs shock, and drives the tracks.",
      },
      purpose: {
        th: "กระจายน้ำหนักของรถถังหนัก 54 ถึง 57 ตัน ลงบนล้อให้มากที่สุดเพื่อลดแรงกดต่อพื้นที่ ขณะเดียวกันก็ให้การทรงตัวนุ่มนวลกว่าระบบกันสะเทือนแบบแหนบหรือแบบโบกี้ทั่วไป",
        en: "To spread the weight of a 54 to 57 tonne vehicle across as many wheels as possible, lowering ground pressure while giving a smoother ride than a leaf-spring or bogie system.",
      },
      inspiration: {
        th: "รูปแบบล้อซ้อนสลับสืบทอดมาจากรถต้นแบบ VK36.01 ของ Henschel ที่เบากว่า และถูกเลือกใช้เพราะน้ำหนักระดับนี้ต้องการการกระจายแรงกดที่ดีกว่าชุดล้อแบบธรรมดา",
        en: "The interleaved layout carried over from Henschel's lighter VK36.01 prototype, adopted because a vehicle in this weight class needed better ground-pressure distribution than a conventional wheel train could give.",
      },
      engineering: {
        th: "ใช้ทอร์ชันบาร์ 16 ท่อน แขนกันสะเทือนข้างละ 8 แขนสลับหน้าหลัง ล้อเดิมเป็นจานเหล็กเส้นผ่านศูนย์กลาง 800 มม. หุ้มยางตัน ข้างละ 24 ล้อ ต่อมาปี 1944 ลดเหลือข้างละ 16 ล้อแบบเหล็กล้วนที่มีวงยางอยู่ภายในเพื่อประหยัดยางที่ขาดแคลน สายพานมีสองขนาด แบบกว้าง 725 มม. สำหรับการรบ และแบบแคบ 520 มม. สำหรับขนส่งทางรถไฟให้อยู่ในเขตความกว้างที่รถไฟยุโรปรับได้ ข้อเสียคือถ้าล้อชั้นในเสียหาย อาจต้องถอดล้ออื่นออกถึง 9 ล้อก่อน และในฤดูหนาวแนวรบตะวันออก โคลนที่อัดอยู่ระหว่างล้ออาจแข็งตัวข้ามคืนจนชุดล้อติดขัด",
        en: "Sixteen torsion bars with eight alternating leading and trailing arms per side. The original wheels were 800 mm steel discs with solid rubber tyres, 24 per side; from 1944 this dropped to 16 all-steel wheels per side with internal rubber rings, to save scarce rubber. Two track widths existed: 725 mm combat tracks and narrower 520 mm transport tracks fitted for rail movement within the European loading gauge. The penalty was maintenance — reaching a damaged inner wheel could mean removing up to nine others — and on the Eastern Front mud packed between the wheels could freeze solid overnight and jam the running gear.",
      },
    },
    build: {
      th: "โมเดลลดรูปเหลือล้อจานกลมข้างละ 5 ล้อ ตัดจากกระดาษลังซ้อนหลายชั้นให้ได้ความหนา แล้วทาสีหน้าล้อให้อ่อนกว่าตัวรถ สายพานตีนตะขาบเป็นแถบกระดาษยาวดัดโค้งพันรอบล้อ ติดลอนกระดาษขวางเป็นข้อสายพาน",
      en: "The model simplifies this to five disc wheels per side, cut from stacked cardboard to build up thickness and painted lighter than the hull. The tracks are long cardboard strips bent around the wheels, with cross-pieces glued on to read as track links.",
    },
    photo: {
      src: "/photos/running-gear-low.jpg",
      alt: {
        th: "มุมต่ำด้านข้างโมเดล เห็นล้อจานกลม 5 ล้อเรียงกัน แถบตีนตะขาบพันรอบ และแผ่นบังโคลนแบนอยู่เหนือสายพาน",
        en: "Low side view of the model showing the five disc road wheels, the track band wrapped around them and the flat fender plate above.",
      },
    },
    sources: [
      "https://tankmuseum.org/article/tiger-wheels",
      "https://en.wikipedia.org/wiki/Tiger_I",
      "https://tanks-encyclopedia.com/ww2/germany/panzer-vi_tiger.php",
    ],
  },
  {
    key: "hull",
    index: "04",
    name: { th: "ตัวถังและเกราะหน้า", en: "Hull and frontal armour" },
    tag: { th: "รอยต่อแบบสลักประสาน", en: "Interlocking welded joints" },
    qa: {
      function: {
        th: "ป้องกันพลประจำรถ เครื่องยนต์ และกระสุนจากการยิงของข้าศึก และเป็นโครงรับน้ำหนักทั้งคัน",
        en: "Protects the crew, engine and ammunition from enemy fire, and carries the whole structure.",
      },
      purpose: {
        th: "ให้ด้านหน้าทนปืนต่อต้านรถถังของฝ่ายสัมพันธมิตร พร้อมกับผลิตได้ง่ายกว่าการใช้เกราะลาดเอียง",
        en: "Frontal immunity to Allied anti-tank guns, while staying simpler to build than sloped armour.",
      },
      inspiration: {
        th: "ตอบโต้รถถัง T-34 และ KV-1 ของโซเวียตที่เยอรมนีเผชิญในปี 1941 ซึ่งเกราะและปืนเหนือกว่ารถถังเยอรมันในตอนนั้น",
        en: "A response to the Soviet T-34 and KV-1 met in 1941, which outclassed every German tank then in service.",
      },
      engineering: {
        th: "เหล็กกล้าผสมนิกเกิลรีดแผ่น หน้า 100 มม. ข้าง 60 ถึง 80 มม. ต่อกันด้วยรอยเชื่อมแบบสลักประสาน แผ่นตั้งตรง ไม่ลาดเอียง",
        en: "Rolled nickel steel: 100 mm front, 60 to 80 mm sides, joined by stepped interlocking welds. Vertical, not sloped.",
      },
    },
    deep: {
      function: {
        th: "ป้องกันพลประจำรถ เครื่องยนต์ และกระสุนจากการยิงของข้าศึก และเป็นโครงรับน้ำหนักของทั้งคัน",
        en: "Protects the crew, the engine and the ammunition from enemy fire, and carries the structure of the whole vehicle.",
      },
      purpose: {
        th: "ต้องการให้ด้านหน้าทนการยิงของปืนต่อต้านรถถังฝ่ายสัมพันธมิตรในยุคนั้นได้ พร้อมกับทำให้การผลิตง่ายกว่าการใช้เกราะลาดเอียง",
        en: "To make the frontal aspect immune to contemporary Allied anti-tank guns, while keeping the vehicle simpler to manufacture than a sloped-plate design.",
      },
      inspiration: {
        th: "เป็นผลโดยตรงจากการที่เยอรมนีเผชิญรถถัง T-34 และ KV-1 ของโซเวียตในปี 1941 ซึ่งแสดงให้เห็นว่ารถถังเยอรมันที่มีอยู่เกราะบางและปืนเล็กเกินไป คณะทำงานจึงเลือกใช้แผ่นเกราะหนาตั้งตรงที่ผลิตและเชื่อมได้เร็วกว่าด้วยเครื่องมือที่มีอยู่ ต่างจากรถถัง Panther รุ่นหลังที่หันไปใช้เกราะลาดเอียงตามแนวคิดของ T-34",
        en: "A direct response to the 1941 encounter with the Soviet T-34 and KV-1, which showed existing German tanks to be under-armoured and under-gunned. The team chose thick, near-vertical plates that were faster to fabricate and weld with the tooling on hand — unlike the later Panther, which followed the T-34's sloped-armour philosophy.",
      },
      engineering: {
        th: "ใช้เหล็กกล้าผสมนิกเกิลรีดแผ่น ความแข็งราว 255 ถึง 280 Brinell ความหนาด้านหน้า 100 มม. ข้างล่าง 60 มม. ข้างบน 80 มม. ท้าย 82 มม. หลังคาและพื้น 25 มม. จุดเด่นคือรอยต่อแบบสลักประสาน แผ่นหนึ่งทำเป็นเดือยบางกว่าแผ่นแม่ 10 มม. สอดเข้าร่องปลายมนของอีกแผ่น แล้วอุดปลายร่องด้วยเหล็กครึ่งวงกลมก่อนเชื่อม รูปทรงนี้ช่วยทั้งจัดตำแหน่งแผ่นให้แม่นและเสริมรอยเชื่อมให้ทนแรงกระแทก แม้เกราะจะไม่ลาดเอียง แต่ผลทดสอบของอังกฤษในสงครามประเมินว่าเกราะข้างล่าง 60 มม. เทียบเท่าเกราะอังกฤษ 80 มม. และเกราะข้างบน 80 มม. เทียบเท่าราว 90 มม. สะท้อนคุณภาพเนื้อเหล็กที่ดี",
        en: "Rolled nickel-steel plate of roughly 255 to 280 Brinell hardness: 100 mm at the front, 60 mm lower side, 80 mm upper side, 82 mm rear, 25 mm roof and floor. The signature detail is the stepped interlocking joint — tabs 10 mm thinner than their parent plate slotted into round-ended recesses in the adjoining plate, the slot ends filled with steel half-rounds and welded. The shape both located the plates precisely and stiffened the weld against shock. Despite the lack of slope, British wartime tests rated the 60 mm lower side as equivalent to 80 mm of British plate and the 80 mm upper side to about 90 mm, reflecting good steel quality.",
      },
    },
    build: {
      th: "ตัวถังเป็นกล่องกระดาษลังตัดและพับขึ้นรูป แล้วติดแผ่นเกราะหน้าและแผ่นจมูกเป็นชิ้นแยกทับอีกที ปืนกลหน้าและช่องมองของพลขับทำจากเศษกระดาษม้วนและตัดติดเพิ่ม กากบาท Balkenkreuz วาดลงบนแผ่นข้างโดยตรง",
      en: "The hull is cardboard cut and folded into a box, with the glacis and nose plates added as separate overlaid pieces. The hull machine gun and the driver's visor are small rolled and cut scraps glued on, and the Balkenkreuz is painted straight onto the side plate.",
    },
    photo: {
      src: "/photos/side-profile.jpg",
      alt: {
        th: "โมเดลรถถังมองจากด้านข้างเต็มคัน เห็นแนวตัวถัง แผ่นเกราะหน้า และกากบาท Balkenkreuz สีขาวดำบนแผ่นข้าง",
        en: "Full side view of the model showing the hull line, the frontal plates and the black-and-white Balkenkreuz on the side.",
      },
    },
    sources: [
      "https://tiger1.info/EN/Welded-hull-plates.html",
      "https://tanks-encyclopedia.com/ww2/germany/panzer-vi_tiger.php",
      "https://en.wikipedia.org/wiki/Tiger_I",
    ],
  },
  {
    key: "deck",
    index: "05",
    name: { th: "ดาดฟ้าเครื่องยนต์และท้ายรถ", en: "Engine deck and rear" },
    tag: { th: "เครื่องยนต์ Maybach HL230", en: "Maybach HL230" },
    qa: {
      function: {
        th: "ครอบห้องเครื่องยนต์และระบบส่งกำลัง มีช่องเปิดสำหรับซ่อมบำรุงในสนาม ระบายความร้อน และเก็บอุปกรณ์",
        en: "Covers the engine and transmission, with hatches for field maintenance, cooling and stowage.",
      },
      purpose: {
        th: "ให้กำลังพอขับเคลื่อนรถหนัก 54 ถึง 57 ตัน และบังคับง่ายพอให้พลขับคนเดียวควบคุมรถถังหนักได้",
        en: "Enough power to move 54 to 57 tonnes, and simple enough for one driver to handle.",
      },
      inspiration: {
        th: "250 คันแรกใช้ Maybach HL210 650 แรงม้า ซึ่งกำลังไม่พอและร้อนจัด จึงเปลี่ยนเป็น HL230 699 แรงม้า",
        en: "The first 250 used the 650 hp Maybach HL210, underpowered and overheating, then the 699 hp HL230.",
      },
      engineering: {
        th: "เกียร์กึ่งอัตโนมัติ Maybach-Olvar 8 เกียร์เดินหน้า บังคับเลี้ยวด้วยพวงมาลัย เลือกรัศมีเลี้ยวได้ 16 ระดับ และหมุนรอบตัวเองได้",
        en: "A semi-automatic Maybach-Olvar gearbox with eight forward gears, steered by wheel with 16 turning radii.",
      },
    },
    deep: {
      function: {
        th: "ครอบห้องเครื่องยนต์และระบบส่งกำลัง พร้อมช่องเปิดสำหรับซ่อมบำรุงในสนาม ระบายความร้อน และเก็บอุปกรณ์",
        en: "Covers the engine and transmission bay, with hatches for field maintenance, cooling and stowage.",
      },
      purpose: {
        th: "ต้องให้กำลังพอที่จะขับเคลื่อนรถหนัก 54 ถึง 57 ตันด้วยความเร็วที่ใช้งานได้จริง และมีระบบส่งกำลังกับการบังคับเลี้ยวที่ง่ายพอให้พลขับคนเดียวควบคุมรถถังหนักได้",
        en: "To move a 54 to 57 tonne vehicle at usable speeds despite its armour, with a transmission and steering system simple enough for one driver to handle a heavy tank.",
      },
      inspiration: {
        th: "รถ 250 คันแรกใช้เครื่องยนต์ Maybach HL210 P45 ขนาด 21.35 ลิตร 650 แรงม้า ซึ่งพบว่ากำลังไม่พอและร้อนจัด ตั้งแต่คันที่ 251 เป็นต้นไปจึงเปลี่ยนไปใช้ HL230 P45 ขนาด 23.095 ลิตร 699 แรงม้า และในเดือนพฤศจิกายน 1943 ได้เพิ่มตัวจำกัดรอบเครื่องไว้ที่ 2,500 รอบต่อนาทีเพื่อลดความเค้นของเครื่อง",
        en: "The first 250 tanks used the 21.35-litre, 650 hp Maybach HL210 P45, which proved underpowered and prone to overheating. From the 251st vehicle Henschel switched to the 23.095-litre, 699 hp HL230 P45, and in November 1943 a governor was added capping engine speed at 2,500 rpm to reduce mechanical strain.",
      },
      engineering: {
        th: "ระบบส่งกำลังเป็น Maybach-Olvar แบบกึ่งอัตโนมัติควบคุมด้วยไฮดรอลิก 8 เกียร์เดินหน้า 4 เกียร์ถอยหลัง การบังคับเลี้ยวใช้ระบบเฟืองท้ายคู่แบบคืนกำลัง บังคับด้วยพวงมาลัยแทนคันโยก เลือกรัศมีเลี้ยวได้ 16 ระดับ และหมุนรอบตัวเองได้ ความจุเชื้อเพลิง 540 ลิตร ด้านท้ายเคยติดตั้งชุดกรองอากาศไซโคลน Feifel สำหรับพื้นที่ฝุ่นจัด เริ่มจากหน่วยที่ส่งไปตูนิเซีย แล้วเลิกติดตั้งจากโรงงานในเดือนตุลาคม 1943",
        en: "A hydraulically controlled, semi-automatic Maybach-Olvar pre-selector gearbox with eight forward and four reverse gears. Steering used a regenerative double-differential system worked through a wheel rather than levers, with 16 selectable turning radii and the ability to pivot in place. Fuel capacity was 540 litres. Feifel cyclone air pre-cleaners were mounted at the rear for dusty theatres, standard from the units sent to Tunisia and dropped from factory production in October 1943.",
      },
    },
    build: {
      th: "ดาดฟ้าเป็นแผ่นกระดาษปิดทับด้านบน แล้วติดฝาช่องทรงกลมและสี่เหลี่ยมตัดจากกระดาษเพิ่มเป็นชั้น ท้ายรถเรียงถังทรงกระบอก 5 ใบที่ม้วนจากกระดาษ และมีกล่องเก็บของกับสายลากพาดตามแนวบังโคลน",
      en: "The deck is a cardboard panel closing the top, with round and rectangular hatch covers cut and layered on. Five rolled cardboard drums are lined up across the rear plate, alongside a stowage box and a tow cable running along the fender.",
    },
    photo: {
      src: "/photos/rear-drums.jpg",
      alt: {
        th: "มุมมองด้านท้ายโมเดล เห็นถังทรงกระบอก 5 ใบเรียงขวางแผ่นท้าย และแผ่นดาดฟ้าเครื่องยนต์ด้านบน",
        en: "Rear view of the model showing five cylindrical drums across the rear plate and the engine deck panel above.",
      },
    },
    sources: [
      "https://en.wikipedia.org/wiki/Tiger_I",
      "https://tiger1.info/EN/Feifel-air-precleaners.html",
    ],
  },
  {
    key: "diorama",
    index: "06",
    name: { th: "ฐานจำลองสนามรบ", en: "Battlefield diorama base" },
    tag: { th: "บรรยากาศของสนามรบ", en: "The atmosphere of a battlefield" },
    qa: {
      function: {
        th: "รองรับและจัดวางโมเดล พร้อมสร้างฉากรอบตัวรถ ทั้งพื้นหญ้า ร่องโคลน แนวรั้วกันรถถัง และควันระเบิด",
        en: "Holds the model and builds the scene around it: grass, mud ruts, a barricade and a shell burst.",
      },
      purpose: {
        th: "ตามแนวคิดของกลุ่ม ฐานนี้มีไว้ถ่ายทอดบรรยากาศของสนามรบ ไม่ให้โมเดลเป็นเพียงตัวรถลอยอยู่เฉย ๆ",
        en: "Per the group's concept: to convey a battlefield, rather than leave the tank standing alone.",
      },
      inspiration: {
        th: "แนวรั้วไม้ตรงกับสิ่งกีดขวางที่ใช้จริงในสนามรบยุโรป และพื้นโคลนสะท้อนปัญหาโคลนอัดระหว่างล้อซ้อนของ Tiger I",
        en: "The timber barricade mirrors real European obstacles; the mud echoes a genuine Tiger I failing.",
      },
      engineering: {
        th: `แผ่นรองแบนปูหญ้าเทียม เว้นแถบกลางเป็นพื้นโคลน รั้วทำจากตะเกียบไขว้เป็นกากบาท ควันระเบิดเป็นปุยสีส้ม ${MISSING("วัสดุที่ใช้ทำฐาน diorama")}`,
        en: `A flat board under artificial grass, a mud strip left through the middle, chopstick X-frames and an orange burst. ${MISSING("วัสดุที่ใช้ทำฐาน diorama")}`,
      },
    },
    deep: {
      function: {
        th: "เป็นฐานรองรับและจัดวางโมเดล พร้อมสร้างฉากรอบตัวรถ ทั้งพื้นหญ้า ร่องโคลนที่ตีนตะขาบบดผ่าน แนวรั้วกันรถถัง และควันระเบิด",
        en: "Holds and frames the model while building the scene around it — grass, the churned mud rut the tracks have cut, an anti-tank barricade and a shell burst.",
      },
      purpose: {
        th: "ตามแนวคิดของกลุ่ม ฐานนี้มีไว้เพื่อถ่ายทอดบรรยากาศของสนามรบ ไม่ให้โมเดลเป็นเพียงตัวรถลอยอยู่เฉย ๆ",
        en: "Following the group's stated concept, the base exists to convey the atmosphere of a battlefield rather than leave the tank standing alone.",
      },
      inspiration: {
        th: "แนวรั้วกันรถถังไม้ที่จำลองไว้ตรงกับสิ่งกีดขวางที่ใช้จริงในสนามรบยุโรป และการที่ตัวรถกำลังบดผ่านพื้นโคลนสะท้อนปัญหาจริงของ Tiger I ที่โคลนอัดระหว่างล้อซ้อนแล้วแข็งตัวจนรถติดขัด",
        en: "The timber anti-tank barricade mirrors the obstacles used on European battlefields, and the tank crossing churned mud echoes a real Tiger I problem: mud packing between the interleaved wheels and freezing solid.",
      },
      engineering: {
        th: `พื้นฐานเป็นแผ่นรองแบน ปูหญ้าเทียมเป็นผืน เว้นแถบกลางเป็นพื้นดินโคลนที่ตัวรถวิ่งผ่าน แนวรั้วทำจากตะเกียบตัดสั้นไขว้กันเป็นกากบาทแล้วพาดคานขวาง ส่วนควันระเบิดเป็นปุยสีส้มวางบนเศษไม้ที่กระจายออก ${MISSING(
          "ชนิดของแผ่นรองฐาน หญ้าเทียม วัสดุทำพื้นโคลน และวัสดุที่ใช้ทำควันระเบิด ยังไม่ได้ระบุใน INFO.md"
        )}`,
        en: `A flat backing board carries a sheet of artificial grass, with a central strip left as the mud the tank is crossing. The barricade is made from chopsticks cut short, crossed into X-frames and spanned with rails; the burst is an orange puff sitting on scattered timber. ${MISSING(
          "ชนิดของแผ่นรองฐาน หญ้าเทียม วัสดุทำพื้นโคลน และวัสดุที่ใช้ทำควันระเบิด ยังไม่ได้ระบุใน INFO.md"
        )}`,
      },
    },
    build: {
      th: "ตะเกียบถูกตัดเป็นท่อนสั้นแล้วประกอบไขว้เป็นโครงกากบาท ยึดด้วยกาว ก่อนติดลงบนผืนหญ้า ส่วนร่องล้อบนพื้นโคลนทำโดยกดและลงสีให้เข้มกว่าพื้นโดยรอบ",
      en: "Chopsticks are cut into short lengths, crossed into frames, glued, and set into the grass. The wheel ruts in the mud are pressed in and painted darker than the ground around them.",
    },
    photo: {
      src: "/photos/diorama-barricade.jpg",
      alt: {
        th: "ฐาน diorama เต็มผืน เห็นหญ้าเทียมสีเขียว แถบพื้นโคลนสีน้ำตาล แนวรั้วกันรถถังทำจากตะเกียบ และปุยระเบิดสีส้ม",
        en: "The full diorama base with green artificial grass, the brown mud strip, the chopstick anti-tank barricade and the orange shell burst.",
      },
    },
    sources: [
      "https://tanks-encyclopedia.com/ww2/germany/panzer-vi_tiger.php",
      "https://tankmuseum.org/article/tiger-wheels",
    ],
  },
];

/* ------------------------- story / timeline ------------------------- */

export const STORY = {
  eyebrow: { th: "ความเป็นมา", en: "Story" },
  heading: { th: "จากกล่องกระดาษถึงสนามรบ", en: "From a cardboard box to a battlefield" },
  lede: {
    th: "ผลงานชิ้นนี้ใช้เวลาทำราว 15 วัน โดยลงมือจริงสองวัน ที่เหลือเป็นช่วงที่งานหยุดนิ่ง ลำดับการประกอบเริ่มจากล้อ ตามด้วยตัวแกนรถถัง แล้วจึงเป็นตีนตะขาบ และปิดท้ายด้วยการตกแต่งและทาสี",
    en: "The model took about 15 days overall, of which two were spent actually building and the rest were downtime. The assembly order ran from the wheels, to the core of the hull, to the tracks, and finally to detailing and paint.",
  },
  totalDays: { th: "ราว 15 วัน", en: "About 15 days" },
  workingDays: { th: "ลงมือจริง 2 วัน", en: "2 days of actual work" },
  scrollHint: {
    th: "เลื่อนต่อเพื่อดูลำดับการประกอบ",
    en: "Keep scrolling to watch the model assemble",
  },
  steps: [
    {
      stage: "wheels" as const,
      no: "01",
      title: { th: "ทำล้อ", en: "The wheels" },
      body: {
        th: "เริ่มจากล้อก่อน ตัดกระดาษลังเป็นจานกลมแล้วซ้อนกันให้ได้ความหนา ข้างละ 5 ล้อ พร้อมเฟืองขับหน้าและล้อประคองท้าย",
        en: "Wheels first: cardboard cut into discs and stacked for thickness, five per side, plus the drive sprocket at the front and the idler at the rear.",
      },
    },
    {
      stage: "hull" as const,
      no: "02",
      title: { th: "ทำตัวแกนรถถัง", en: "The hull core" },
      body: {
        th: "ตัดและพับกระดาษลังขึ้นรูปเป็นตัวถัง ต่อด้วยป้อมปืนและลำกล้อง ยึดทุกชิ้นด้วยกาว นี่คือขั้นที่กำหนดสัดส่วนทั้งคัน",
        en: "Cardboard cut and folded into the hull, then the turret and the barrel, everything held with glue. This is the stage that sets the proportions of the whole vehicle.",
      },
    },
    {
      stage: "tracks" as const,
      no: "03",
      title: { th: "ทำตีนตะขาบ", en: "The tracks" },
      body: {
        th: "ดัดแถบกระดาษยาวพันรอบชุดล้อให้เป็นสายพานปิดวง ติดลอนขวางเป็นข้อสายพาน แล้วปิดด้วยแผ่นบังโคลนด้านบน",
        en: "Long cardboard strips bent around the wheels into a closed loop, cross-pieces glued on as links, and a fender plate closing the top of the run.",
      },
    },
    {
      stage: "finish" as const,
      no: "04",
      title: { th: "ตกแต่งและทาสี", en: "Detailing and paint" },
      body: {
        th: "ติดรายละเอียดที่เหลือ ทั้งฝาช่องบนดาดฟ้า ถังท้ายรถ ป้อมสังเกตการณ์ ธง และฐาน diorama จากนั้นทาสีทั้งคันเป็นขั้นสุดท้าย",
        en: "The remaining detail goes on — deck hatches, rear drums, cupola, flag and the diorama base — and the whole model is painted last.",
      },
    },
  ],
  gallery: [
    {
      src: "/photos/hero-front-quarter.jpg",
      alt: {
        th: "โมเดลรถถังเสร็จสมบูรณ์ตั้งบนฐาน diorama กลางแจ้ง มองจากมุมหน้าขวา",
        en: "The finished model on its diorama base outdoors, seen from the front right.",
      },
    },
    {
      src: "/photos/deck-overhead.jpg",
      alt: {
        th: "มุมสูงมองลงบนโมเดล เห็นดาดฟ้าเครื่องยนต์ ป้อมปืน และแนวตีนตะขาบทั้งสองข้าง",
        en: "High angle over the model showing the engine deck, the turret and both track runs.",
      },
    },
    {
      src: "/photos/rear-quarter.jpg",
      alt: {
        th: "โมเดลมองจากมุมท้ายซ้าย เห็นถังท้ายรถและธงที่พาดอยู่บนป้อมปืน",
        en: "Rear-left view of the model showing the rear drums and the flag draped over the turret.",
      },
    },
  ],
} as const;

/* ------------------------------ specs ------------------------------- */

export interface SpecRow {
  label: Bi;
  value: Bi;
}

export const ARTWORK_SPECS: SpecRow[] = [
  {
    label: { th: "ชื่อผลงาน", en: "Title" },
    value: { th: "อสูรกายพยัคฆ์เหล็ก", en: "Iron Tiger" },
  },
  {
    label: { th: "ต้นแบบ", en: "Subject" },
    value: { th: "รถถัง Tiger I", en: "Tiger I tank" },
  },
  {
    label: { th: "ขนาด", en: "Dimensions" },
    value: {
      th: "กว้าง 10 × ยาว 20 × สูง 15 เซนติเมตร",
      en: "10 × 20 × 15 cm (W × L × H)",
    },
  },
  {
    label: { th: "อัตราส่วนโดยประมาณ", en: "Approximate scale" },
    value: META.scaleNote,
  },
  {
    label: { th: "วัสดุหลัก", en: "Primary materials" },
    value: { th: "กล่องกระดาษลัง, ตะเกียบ", en: "Corrugated cardboard, chopsticks" },
  },
  {
    label: { th: "เทคนิค", en: "Technique" },
    value: {
      th: "การตัด, การพับ, ติดกาว, การประกอบ",
      en: "Cutting, folding, gluing, assembly",
    },
  },
  {
    label: { th: "ระยะเวลา", en: "Duration" },
    value: { th: "ราว 15 วัน (ลงมือจริง 2 วัน)", en: "About 15 days (2 days of actual work)" },
  },
  {
    label: { th: "รายวิชา", en: "Subject area" },
    value: { th: "ศิลปะ", en: "Art" },
  },
];

export const VEHICLE_SPECS: SpecRow[] = [
  {
    label: { th: "ชื่อทางการ", en: "Designation" },
    value: {
      th: "Panzerkampfwagen VI Ausf. E (Sd.Kfz. 181)",
      en: "Panzerkampfwagen VI Ausf. E (Sd.Kfz. 181)",
    },
  },
  {
    label: { th: "ผู้ผลิต", en: "Manufacturer" },
    value: {
      th: "ตัวถัง Henschel & Son, ป้อมปืนและปืนใหญ่ Krupp",
      en: "Hull by Henschel & Son; turret and gun by Krupp",
    },
  },
  {
    label: { th: "หัวหน้าออกแบบ", en: "Chief designer" },
    value: { th: "Erwin Aders (Henschel)", en: "Erwin Aders (Henschel)" },
  },
  {
    label: { th: "ช่วงการผลิต", en: "Production" },
    value: {
      th: "สิงหาคม 1942 ถึง สิงหาคม 1944 ผลิตราว 1,346 ถึง 1,354 คัน (ตัวเลขต่างกันตามแหล่งอ้างอิง)",
      en: "August 1942 to August 1944; about 1,346 to 1,354 built, depending on the source.",
    },
  },
  {
    label: { th: "น้ำหนักรบ", en: "Combat weight" },
    value: { th: "54 ถึง 57 ตัน", en: "54 to 57 tonnes" },
  },
  {
    label: { th: "พลประจำรถ", en: "Crew" },
    value: {
      th: "5 นาย (ผู้บังคับการรถ, พลยิง, พลบรรจุ, พลขับ, พลวิทยุ)",
      en: "5 (commander, gunner, loader, driver, radio operator)",
    },
  },
  {
    label: { th: "ขนาด", en: "Dimensions" },
    value: {
      th: "ตัวถังยาว 6.316 ม. รวมลำกล้อง 8.45 ม. กว้าง 3.56 ถึง 3.70 ม. สูง 3.00 ม.",
      en: "Hull 6.316 m; 8.45 m gun forward; 3.56 to 3.70 m wide; 3.00 m tall.",
    },
  },
  {
    label: { th: "เครื่องยนต์", en: "Engine" },
    value: {
      th: "Maybach HL210 P45 650 แรงม้า (250 คันแรก) ต่อมาเป็น HL230 P45 699 แรงม้า",
      en: "Maybach HL210 P45, 650 hp (first 250 vehicles); later HL230 P45, 699 hp.",
    },
  },
  {
    label: { th: "ความเร็ว", en: "Speed" },
    value: {
      th: "บนถนนสูงสุดตามแบบ 45.4 กม./ชม. ภายหลังจำกัดที่ 38 กม./ชม. นอกถนน 20 ถึง 25 กม./ชม.",
      en: "45.4 km/h by design on road, later governed to 38 km/h; 20 to 25 km/h off-road.",
    },
  },
  {
    label: { th: "ระยะปฏิบัติการ", en: "Range" },
    value: { th: "บนถนน 195 กม. นอกถนน 110 กม.", en: "195 km on road, 110 km cross-country." },
  },
  {
    label: { th: "เกราะ", en: "Armour" },
    value: {
      th: "25 มม. (หลังคาและพื้น) ถึง 100 ถึง 200 มม. (หน้าป้อมและโล่ปืน)",
      en: "25 mm (roof and floor) to 100–200 mm (turret front and mantlet).",
    },
  },
  {
    label: { th: "อาวุธหลัก", en: "Main armament" },
    value: {
      th: "ปืนใหญ่ 8.8 ซม. KwK 36 L/56 บรรจุ 92 นัด",
      en: "8.8 cm KwK 36 L/56, 92 rounds carried.",
    },
  },
  {
    label: { th: "ราคาต่อคัน", en: "Unit cost" },
    value: {
      th: "250,800 ไรชส์มาร์ก (ไม่รวมอาวุธและวิทยุ) หรือ 299,800 ไรชส์มาร์กเมื่อติดตั้งครบ",
      en: "RM 250,800 without weapon and radio; RM 299,800 fully equipped.",
    },
  },
];

/* ----------------------------- closing ------------------------------ */

export const CLOSING = {
  eyebrow: { th: "ผู้จัดทำ", en: "Credits" },
  heading: { th: "สมาชิกในกลุ่ม", en: "Group members" },
  orbitHint: {
    th: "ลากบนโมเดลเพื่อหมุนดูได้รอบตัว",
    en: "Drag on the model to turn it.",
  },
  historicalNote: {
    th: "เครื่องหมายและธงบนโมเดลเป็นสัญลักษณ์ทางประวัติศาสตร์ของยานรบเยอรมันในสงครามโลกครั้งที่สอง แสดงไว้เพื่อบันทึกผลงานตามที่สร้างจริงและเพื่อการศึกษาเท่านั้น",
    en: "The markings and flag on this model are historical insignia carried by German vehicles in the Second World War. They are shown to document the artwork as it was built, and for educational purposes only.",
  },
  sourcesHeading: { th: "แหล่งอ้างอิงข้อมูลประวัติศาสตร์", en: "Historical sources" },
} as const;

/** De-duplicated bibliography across all part sections. */
export const ALL_SOURCES = Array.from(new Set(PARTS.flatMap((p) => p.sources))).sort();

/* ------------------------------ nav --------------------------------- */

export const NAV_LABELS: Record<string, Bi> = {
  hero: { th: "เปิดเรื่อง", en: "Intro" },
  overview: { th: "ภาพรวม", en: "Overview" },
  turret: { th: "ป้อมปืน", en: "Turret" },
  gun: { th: "ปืนใหญ่", en: "Gun" },
  runningGear: { th: "ตีนตะขาบ", en: "Running gear" },
  hull: { th: "ตัวถัง", en: "Hull" },
  deck: { th: "ดาดฟ้า", en: "Deck" },
  diorama: { th: "ฐานจำลอง", en: "Diorama" },
  assembly: { th: "การประกอบ", en: "Assembly" },
  specs: { th: "ข้อมูลจำเพาะ", en: "Specs" },
  closing: { th: "ผู้จัดทำ", en: "Credits" },
};
