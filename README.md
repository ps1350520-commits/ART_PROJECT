# อสูรกายพยัคฆ์เหล็ก — Iron Tiger

เว็บนำเสนอผลงานโมเดล Tiger I จากกระดาษลัง แบบ scroll-driven 3D showcase
(Next.js 14 · React Three Fiber · Tailwind · Lenis)

## รัน

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # ต้องผ่านก่อน deploy
```

## Deploy ขึ้น Vercel

1. push โปรเจกต์ขึ้น GitHub
2. ที่ Vercel กด **Add New → Project** แล้วเลือก repo — Vercel ตรวจเจอ Next.js เอง ไม่ต้องตั้งค่าเพิ่ม
3. กด Deploy

## แก้เนื้อหา (ไม่ต้องแตะโค้ด scene)

| อยากแก้ | ไฟล์ |
|---|---|
| ข้อความทุกส่วน (ชื่อ, แนวคิด, 4 คำถามต่อชิ้นส่วน, timeline, specs, สมาชิก) | `content/site.ts` |
| เส้น callout: ตำแหน่งบนโมเดล + ข้อความ | `content/callouts.ts` |
| ลำดับ/ความยาว section, มุมกล้องแต่ละช่วง | `lib/sections.ts` |
| รูปภาพ | `public/photos/` |

ข้อความที่ INFO.md ยังไม่มีจะขึ้นเป็น `[ต้องการข้อมูลเพิ่ม: …]` สีส้มบนหน้าเว็บ — ค้นคำนี้ใน `content/site.ts` แล้วเติมได้เลย

## สลับเป็นโมเดล GLTF

โมเดลปัจจุบันปั้นจาก primitive ใน `components/ArtworkModel.tsx` ถ้ามีไฟล์ `.glb/.gltf`:

1. วางไฟล์ไว้ใน `public/` เช่น `public/tiger.glb`
2. แก้บรรทัดเดียวในไฟล์นั้น:
   ```ts
   export const GLTF_MODEL_URL: string | null = "/tiger.glb";
   ```
3. ตั้งชื่อ group/mesh ในไฟล์ GLTF ให้ตรงกับ key: `turret`, `gun`, `runningGear`, `hull`, `deck`, `diorama`
   (ระบบหรี่ชิ้นส่วนและ callout จะทำงานต่อได้ทันที)
4. ถ้าสัดส่วนต่างจากเดิม ปรับพิกัด `anchor` ใน `content/callouts.ts` ให้ชี้ตรงจุด

หน่วยในฉาก = เมตรของรถถังจริง (ตัวถังยาว 6.3 หน่วย, ปืนชี้ทาง +X, พื้นที่ y = 0)

## ธงบนป้อมปืน

โมเดลจำลองธงตามผลงานจริง ถ้าต้องการตัดออก แก้ใน `components/ArtworkModel.tsx`:

```ts
export const SHOW_NATIONAL_FLAG = false;
```

## โครงสร้าง

```
app/            layout + page
components/     Scene (กล้อง/แสง), ArtworkModel (โมเดล), CalloutOverlay (เส้นชี้), Sections (เนื้อหา)
content/        ข้อความและ callout ทั้งหมด
lib/            scroll driver, section/camera keyframes, projection bridge
public/photos/  ภาพถ่ายผลงาน
```

`prefers-reduced-motion` เปิดอยู่ → หน้าเว็บกลายเป็น static ไม่มี canvas แต่เนื้อหาครบทุกส่วน
