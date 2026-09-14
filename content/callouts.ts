/**
 * Every leader line on the site is defined here and nowhere else.
 *
 * `anchor` is a point in the artwork's own local space (metres, gun
 * pointing along +X, base at y = 0). The overlay projects it through the
 * live camera every frame, so a callout keeps pointing at the right spot
 * at any viewport size and any camera position — no screen coordinates
 * are ever hard-coded.
 *
 * To retarget a callout, move its `anchor`. To reword one, edit `label`
 * and `detail`. Neither requires touching the scene code.
 */

import type { SectionId } from "@/lib/sections";
import type { Bi } from "./site";

export interface Callout {
  id: string;
  /** The section during which this callout is visible. */
  section: SectionId;
  /** Point on the model, in artwork-local metres. */
  anchor: [number, number, number];
  label: Bi;
  detail: Bi;
  /**
   * Lower numbers survive on narrow screens, where only the two highest
   * priority callouts per section are drawn over the canvas.
   */
  priority: number;
}

export const CALLOUTS: Callout[] = [
  /* ----------------------------- overview ---------------------------- */
  {
    id: "ov-turret",
    section: "overview",
    anchor: [-0.35, 2.58, 0],
    label: { th: "ป้อมปืน", en: "Turret" },
    detail: { th: "หมุนได้รอบตัว 360°", en: "Full 360° traverse" },
    priority: 1,
  },
  {
    id: "ov-gun",
    section: "overview",
    anchor: [4.4, 2.14, 0],
    label: { th: "ปืนใหญ่ 8.8 ซม.", en: "8.8 cm main gun" },
    detail: { th: "ลำกล้องยาว 56 เท่าของขนาดลำกล้อง", en: "56 calibres long" },
    priority: 2,
  },
  {
    id: "ov-running",
    section: "overview",
    anchor: [-1.4, 0.52, 1.95],
    label: { th: "ตีนตะขาบและชุดล้อ", en: "Running gear" },
    detail: { th: "รับน้ำหนัก 54 ถึง 57 ตัน", en: "Carries 54 to 57 tonnes" },
    priority: 3,
  },
  {
    id: "ov-diorama",
    section: "overview",
    anchor: [-3.4, 0.12, 2.5],
    label: { th: "ฐานจำลองสนามรบ", en: "Diorama base" },
    detail: { th: "หญ้าเทียม พื้นโคลน และแนวรั้ว", en: "Grass, mud and barricade" },
    priority: 4,
  },

  /* ------------------------------ turret ----------------------------- */
  {
    id: "tu-cupola",
    section: "turret",
    anchor: [-1.15, 2.94, -0.52],
    label: { th: "ป้อมสังเกตการณ์", en: "Commander's cupola" },
    detail: { th: "ให้ผู้บังคับการรถมองเห็นรอบตัว", en: "All-round vision for the commander" },
    priority: 1,
  },
  {
    id: "tu-mantlet",
    section: "turret",
    anchor: [1.34, 2.3, 0.62],
    label: { th: "โล่ปืน", en: "Gun mantlet" },
    detail: { th: "ชิ้นหล่อโค้ง หนา 110 ถึง 200 มม.", en: "Curved casting, 110 to 200 mm" },
    priority: 2,
  },
  {
    id: "tu-smoke",
    section: "turret",
    anchor: [0.55, 2.6, 1.12],
    label: { th: "ชุดยิงลูกระเบิดควัน", en: "Smoke launchers" },
    detail: { th: "ติดที่แก้มป้อมทั้งสองข้าง", en: "One cluster per turret cheek" },
    priority: 3,
  },

  /* -------------------------------- gun ------------------------------ */
  {
    id: "gu-muzzle",
    section: "gun",
    anchor: [4.86, 2.14, 0],
    label: { th: "เบรกปากลำกล้อง", en: "Muzzle brake" },
    detail: { th: "ลดแรงถอยหลังการยิง", en: "Cuts recoil on firing" },
    priority: 1,
  },
  {
    id: "gu-barrel",
    section: "gun",
    anchor: [3.2, 2.26, 0],
    label: { th: "ลำกล้อง L/56", en: "L/56 barrel" },
    detail: { th: "ยาวประมาณ 4.93 เมตร", en: "About 4.93 metres" },
    priority: 2,
  },
  {
    id: "gu-origin",
    section: "gun",
    anchor: [1.34, 1.9, 0.5],
    label: { th: "ฐานปืนในป้อม", en: "Gun mounting" },
    detail: { th: "ดัดแปลงจากปืน ต.อ. Flak 36", en: "Adapted from the Flak 36 AA gun" },
    priority: 3,
  },

  /* --------------------------- running gear -------------------------- */
  {
    id: "rg-wheel",
    section: "runningGear",
    anchor: [0, 0.52, 1.95],
    label: { th: "ล้อรับน้ำหนัก", en: "Road wheel" },
    detail: { th: "ของจริงเป็นจานเหล็ก 800 มม. หุ้มยางตัน", en: "800 mm steel disc, rubber tyred" },
    priority: 1,
  },
  {
    id: "rg-track",
    section: "runningGear",
    anchor: [-1.9, 0.03, 1.95],
    label: { th: "สายพานตีนตะขาบ", en: "Track" },
    detail: { th: "แบบรบกว้าง 725 มม.", en: "725 mm combat track" },
    priority: 2,
  },
  {
    id: "rg-sprocket",
    section: "runningGear",
    anchor: [2.95, 0.52, 1.95],
    label: { th: "เฟืองขับ", en: "Drive sprocket" },
    detail: { th: "ส่งกำลังจากเครื่องยนต์ลงสายพาน", en: "Puts engine power into the track" },
    priority: 3,
  },

  /* -------------------------------- hull ----------------------------- */
  {
    id: "hu-glacis",
    section: "hull",
    anchor: [3.02, 1.55, 0.7],
    label: { th: "เกราะหน้า 100 มม.", en: "100 mm frontal armour" },
    detail: { th: "แผ่นตั้งตรง ไม่ลาดเอียง", en: "Near-vertical, not sloped" },
    priority: 1,
  },
  {
    id: "hu-mg",
    section: "hull",
    anchor: [3.4, 1.44, -0.78],
    label: { th: "ปืนกลหน้า MG34", en: "Hull machine gun" },
    detail: { th: "พลวิทยุเป็นผู้ควบคุม", en: "Worked by the radio operator" },
    priority: 2,
  },
  {
    id: "hu-cross",
    section: "hull",
    anchor: [0.9, 1.5, 1.76],
    label: { th: "กากบาท Balkenkreuz", en: "Balkenkreuz" },
    detail: { th: "เครื่องหมายประจำชาติบนยานรบ", en: "National vehicle insignia" },
    priority: 3,
  },

  /* -------------------------------- deck ----------------------------- */
  {
    id: "de-hatch",
    section: "deck",
    anchor: [-1.55, 1.85, 0.95],
    label: { th: "ช่องเปิดดาดฟ้า", en: "Deck hatches" },
    detail: { th: "เข้าถึงเครื่องยนต์เพื่อซ่อมบำรุงในสนาม", en: "Field access to the engine bay" },
    priority: 1,
  },
  {
    id: "de-drums",
    section: "deck",
    anchor: [-3.45, 1.06, 0],
    label: { th: "ถังท้ายรถ", en: "Rear drums" },
    detail: { th: "ตำแหน่งเดียวกับชุดกรองอากาศ Feifel", en: "Where the Feifel filters sat" },
    priority: 2,
  },
  {
    id: "de-stowage",
    section: "deck",
    anchor: [-2.1, 2.1, 1.62],
    label: { th: "กล่องเก็บอุปกรณ์", en: "Stowage box" },
    detail: { th: "วางตามแนวบังโคลน", en: "Carried along the fender" },
    priority: 3,
  },

  /* ------------------------------ diorama ---------------------------- */
  {
    id: "di-barricade",
    section: "diorama",
    anchor: [-3.3, 0.62, 2.5],
    label: { th: "แนวรั้วกันรถถัง", en: "Anti-tank barricade" },
    detail: { th: "ทำจากตะเกียบไขว้เป็นกากบาท", en: "Chopsticks crossed into frames" },
    priority: 1,
  },
  {
    id: "di-mud",
    section: "diorama",
    anchor: [-2.8, 0.1, -0.6],
    label: { th: "ร่องโคลน", en: "Mud rut" },
    detail: { th: "รอยที่ตีนตะขาบบดผ่าน", en: "Cut by the passing tracks" },
    priority: 2,
  },
  {
    id: "di-burst",
    section: "diorama",
    anchor: [-3.9, 1.0, -2.1],
    label: { th: "ควันระเบิด", en: "Shell burst" },
    detail: { th: "สร้างบรรยากาศของสนามรบ", en: "Sets the battlefield scene" },
    priority: 3,
  },
];

export const calloutsForSection = (section: SectionId) =>
  CALLOUTS.filter((c) => c.section === section).sort((a, b) => a.priority - b.priority);
