# Lab Control System

ระบบควบคุมเครื่องคอมพิวเตอร์ห้องแลปแบบรวมศูนย์

**สถานะ**: Design approved scope — รอ Boss เลือกแนวทาง deploy
**อัปเดตล่าสุด**: 2026-07-13

## โจทย์

- ห้องแลป **10 ห้อง** × ~40 เครื่อง = **~400 เครื่อง**
- OS: **Windows ทั้งหมด**
- ต้องการควบคุม **2 ด้าน**:
  1. **IT Admin** — ดูแล ซ่อมบำรุง monitor สั่งงานจากส่วนกลาง
  2. **Classroom Control** — ครู/ผู้คุมห้องดูและควบคุมหน้าจอทุกเครื่องในห้อง
- Network: **หลายวง LAN** (แต่ละห้องอาจอยู่คนละ subnet/VLAN)

## การตัดสินใจทางสถาปัตยกรรม (Architecture Decisions)

### AD-1: ใช้ agent แบบ dial-out เพราะมีหลายวง LAN

เครื่องทุกตัวติดตั้ง agent ที่ **เชื่อมต่อออก** (outbound HTTPS/WebSocket) ไปหา
server กลาง — ไม่ใช่ server ยิงเข้าไปหาเครื่อง

เหตุผล: หลายวง LAN แปลว่า server กลางอาจ route เข้าไปหาเครื่องตรงๆ ไม่ได้
(firewall/NAT ระหว่าง VLAN) แต่ทุกวงมักออก internet/ไปหา server กลางได้เสมอ
→ agent dial-out ตัดปัญหานี้ทั้งหมด เปิด firewall แค่พอร์ตเดียวฝั่ง server

### AD-2: ประกอบจาก open source 3 ตัว แทนการเขียนเองทั้งหมด

| ชั้น | เครื่องมือ | ทำหน้าที่ |
|---|---|---|
| IT Admin กลาง | **MeshCentral** | inventory, monitoring, remote desktop, remote command, WoL, alert — ผ่านเว็บ dashboard เดียวเห็นครบ 400 เครื่อง |
| Classroom | **Veyon** | เครื่องครูในแต่ละห้องดูหน้าจอนักเรียนทั้ง 40 เครื่อง, ล็อกจอ, demo mode, remote control |
| Imaging | **FOG Project** | สร้าง image ต้นแบบ, restore เครื่องทั้งห้องกลับสภาพเดิม |

เหตุผล: ทั้งสามตัวฟรี, โตแล้ว (ใช้ในสถานศึกษาทั่วโลก), รองรับ Windows เต็มรูปแบบ
— เขียนเองใช้เวลาเป็นเดือนโดยได้ฟีเจอร์น้อยกว่า ค่อยสร้าง custom dashboard
ครอบทีหลังถ้าจำเป็น (ทางเลือก Hybrid)

### AD-3: แก้ปัญหา Wake-on-LAN ข้าม VLAN ด้วย peer agent

WoL magic packet เป็น broadcast — **ข้าม VLAN ไม่ได้** โดยธรรมชาติ

ทางแก้: MeshCentral ให้ agent ตัวที่ตื่นอยู่ในวงเดียวกันเป็นคนส่ง magic packet
แทน server → กำหนดให้ **เครื่องครูของแต่ละห้องเปิดทิ้งไว้** (หรือตั้ง BIOS
ให้เครื่องใดเครื่องหนึ่ง always-on) เป็น "ตัวปลุก" ประจำวง

### AD-4: FOG ต้องจัดการ PXE ต่อวง

PXE boot ก็ติดปัญหา VLAN เหมือน WoL → ตั้ง DHCP option 66/67 ชี้มา FOG server
ในทุกวง (ประสานกับคนดูแล network) หรือวาง dnsmasq proxy เล็กๆ ต่อวง

## Architecture

```
                        ┌──────────────────────────┐
                        │      Central Server       │
                        │  MeshCentral + FOG        │
                        │  (เว็บ dashboard, HTTPS)  │
                        └────────────┬─────────────┘
                                     │ agent dial-out (443)
              ┌──────────────┬───────┴───────┬──────────────┐
           VLAN ห้อง 1     VLAN ห้อง 2      ...          VLAN ห้อง 10
        ┌──────────────┐ ┌──────────────┐            ┌──────────────┐
        │ เครื่องครู     │ │ เครื่องครู     │            │ เครื่องครู     │
        │ (Veyon Master│ │ (Veyon Master│            │ (Veyon Master│
        │  + WoL relay)│ │  + WoL relay)│            │  + WoL relay)│
        │ นักเรียน ×40  │ │ นักเรียน ×40  │            │ นักเรียน ×40  │
        │ (Mesh agent  │ │ (Mesh agent  │            │ (Mesh agent  │
        │  + Veyon)    │ │  + Veyon)    │            │  + Veyon)    │
        └──────────────┘ └──────────────┘            └──────────────┘
```

- **Veyon** ทำงานภายในห้อง (ครู ↔ นักเรียน วงเดียวกัน) — ไม่ต้องข้าม VLAN
- **MeshCentral** ทำงานข้ามวง — ทุก agent dial-out หา server กลาง
- จัดกลุ่มใน MeshCentral เป็น 10 device groups ตามห้อง → สั่งงานเป็นห้องได้

## Spec เครื่อง Server กลาง

- 1 เครื่องพอ (VM หรือ PC): 4 cores / 8 GB RAM / SSD 500 GB+ (FOG เก็บ image)
- OS: Ubuntu Server LTS (MeshCentral + FOG ลงคู่กันได้)
- ทุกวง LAN ต้อง route ถึง server นี้ได้ทางพอร์ต 443 (+ พอร์ต FOG ช่วง imaging)

## Roadmap & Acceptance Criteria

### Phase 1 — Pilot: MeshCentral 1 ห้อง (สัปดาห์ 1)

ติดตั้ง server กลาง + deploy Mesh agent ห้องแรก 40 เครื่อง

**Acceptance criteria:**
- [ ] เปิด dashboard เห็นทั้ง 40 เครื่อง สถานะ online/offline ถูกต้อง
- [ ] Remote desktop เข้าเครื่องใดก็ได้จากหน้าเว็บ
- [ ] สั่ง restart/shutdown ทั้งห้องพร้อมกันได้ในคลิกเดียว
- [ ] Wake-on-LAN ปลุกทั้งห้องได้ (ผ่าน relay ในวง)
- [ ] Alert แจ้งเมื่อเครื่อง offline เกิน 10 นาทีในเวลาทำการ

### Phase 2 — Roll out 10 ห้อง + Veyon (สัปดาห์ 2-3)

Deploy agent ครบ 400 เครื่อง (ผ่าน GPO ถ้ามี AD, ไม่มีก็ใช้ script/MSI)
+ ติดตั้ง Veyon ทุกห้อง config ผ่าน `veyon-cli` (key file authentication)

**Acceptance criteria:**
- [ ] Dashboard เห็นครบ ~400 เครื่อง แยก 10 กลุ่มตามห้อง
- [ ] เครื่องครูทุกห้องเห็นหน้าจอนักเรียนครบ 40 เครื่องใน Veyon Master
- [ ] ครูล็อกจอทั้งห้อง / demo หน้าจอตัวเอง / remote เข้าเครื่องนักเรียนได้
- [ ] นักเรียนควบคุมย้อนกลับหาครูไม่ได้ (key แยก master/client)

### Phase 3 — FOG Imaging + Automation (สัปดาห์ 4)

**Acceptance criteria:**
- [ ] มี golden image ต้นแบบ 1 image (หรือแยกตามสเปคเครื่อง)
- [ ] Restore เครื่อง 1 เครื่องเสร็จใน ≤ 20 นาที, ทั้งห้อง (multicast) ใน ≤ 1 ชม.
- [ ] ตั้งเวลาเปิดเครื่องอัตโนมัติก่อนคาบแรก / ปิดหลังเลิกงานได้จริง
- [ ] มีเอกสารขั้นตอน restore ที่คนอื่นทำตามได้

### Phase 4 (ถ้าต้องการ) — Custom Dashboard

สร้างหน้าจอเดียวของ Boss ครอบ MeshCentral API — สรุปสถานะ 10 ห้อง,
ปุ่มลัดสั่งงานประจำ, รายงานการใช้งาน ให้ทีม Dev ประเมินหลัง Phase 3 จบ

## คำถามที่ยังเปิดอยู่ (Open Questions)

1. **มี Active Directory / Windows Domain ไหม?** → กำหนดวิธี deploy agent
   (GPO สบายสุด) และการจัดการ user
2. เครื่องครูประจำห้องมีครบทุกห้องหรือยัง? (จำเป็นสำหรับ Veyon Master + WoL relay)
3. ใครเป็นคนดูแล network/VLAN — ต้องประสานเรื่อง route ถึง server กลาง
   และ DHCP options สำหรับ FOG
4. งบสำหรับ server กลาง 1 เครื่อง (ถ้าไม่มีของเดิมให้ใช้)
