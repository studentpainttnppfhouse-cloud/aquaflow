import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { interests, consentRecords } from '../data/mock';
import { useStore } from '../lib/store';
import { PrivacyNote, Scale } from '../components/ui';

const chipColors = ['#E4572E', '#F2A541', '#3A7CA5', '#7FB685', '#C76B98', '#5B5F97'];

export default function Onboarding() {
  const { student, update } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>(student.interests);
  const [stress, setStress] = useState(3);
  const [conf, setConf] = useState(3);
  const consent = consentRecords.find((c) => c.studentId === student.id);

  const finish = () => {
    update((s) => ({
      ...s,
      onboarded: { ...s.onboarded, [student.id]: true },
      extraCheckins: [...s.extraCheckins, { studentId: student.id, date: 'วันนี้', stress, confidence: conf, private: true }],
    }));
    nav('/');
  };

  const steps = [
    <div key="w" className="space-y-4 text-center">
      <div className="mx-auto grid h-28 w-28 grid-cols-3 overflow-hidden rounded-full" aria-hidden>
        {chipColors.concat(chipColors.slice(0, 3)).map((c, i) => <span key={i} style={{ background: c }} />)}
      </div>
      <h1 className="h1">สวัสดี น้อง{student.nickname} มาค้นหาสีของคุณกัน</h1>
      <p className="muted">ที่นี่ไม่มีการสอบ ไม่มีคะแนน และไม่มีการเปรียบเทียบกับใคร มีแค่การลองทำสิ่งต่าง ๆ แล้วค่อย ๆ รู้จักตัวเองมากขึ้น</p>
      <p className="font-semibold">ไม่มีคำตอบที่ผิด ค่อย ๆ ค้นหาไปด้วยกัน</p>
    </div>,
    <div key="i" className="space-y-4">
      <h2 className="h1">ช่วงนี้คุณสนใจอะไรบ้าง</h2>
      <p className="muted">เลือกได้หลายอย่าง และเปลี่ยนใจได้ทุกเมื่อ</p>
      <div className="flex flex-wrap gap-2">
        {interests.map((t, i) => {
          const on = picked.includes(t);
          return (
            <button key={t} type="button" aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== t) : [...picked, t])}
              className="chip border-2 px-4 py-2 text-base transition"
              style={{ borderColor: chipColors[i % 6], background: on ? chipColors[i % 6] : 'white', color: '#1C2541' }}>
              {on && <Check className="h-4 w-4" aria-hidden />}{t}
            </button>
          );
        })}
      </div>
    </div>,
    <div key="c" className="space-y-5">
      <h2 className="h1">ตอนนี้ใจคุณเป็นอย่างไร</h2>
      <p className="muted">แค่สำรวจความรู้สึกเบา ๆ ไม่ใช่แบบทดสอบ</p>
      <Scale label="กังวลเรื่องอนาคตแค่ไหน" value={stress} onChange={setStress} low="สบายใจ" high="กังวลมาก" />
      <Scale label="มั่นใจว่ารู้จักตัวเองแค่ไหน" value={conf} onChange={setConf} low="ยังไม่ค่อย" high="มั่นใจ" />
      <PrivacyNote>คำตอบนี้เป็นของคุณคนเดียว ไม่มีใครเห็นถ้าคุณไม่อนุญาต</PrivacyNote>
    </div>,
    <div key="p" className="space-y-4">
      <h2 className="h1">ความยินยอมจากผู้ปกครอง</h2>
      <p className="muted">เพราะคุณอายุต่ำกว่า 18 ปี การออกไปเรียนรู้ภาคสนามต้องมีผู้ปกครองยินยอม (ตาม PDPA)</p>
      {consent ? (
        <div className="card flex gap-3">
          <ShieldCheck className="h-6 w-6 shrink-0 text-leaf" aria-hidden />
          <div>
            <p className="font-semibold">{consent.parentName} ให้ความยินยอมแล้ว · {consent.date}</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-ink">{consent.scope.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </div>
      ) : <div className="card">รอผู้ปกครองยืนยัน</div>}
      <PrivacyNote>ข้อมูลเป็นของคุณ คุณเลือกเองว่าจะแชร์อะไรให้ใครในหน้า “ความเป็นส่วนตัว”</PrivacyNote>
    </div>,
  ];

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex gap-2" aria-label={`ขั้นที่ ${step + 1} จาก ${steps.length}`}>
        {steps.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-orange' : 'bg-navy/10'}`} />)}
      </div>
      <div className="card min-h-[22rem] p-6">{steps[step]}</div>
      <div className="mt-4 flex justify-between">
        <button className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft className="h-4 w-4" />ย้อนกลับ</button>
        {step < steps.length - 1
          ? <button className="btn-primary" onClick={() => setStep(step + 1)}>ต่อไป<ArrowRight className="h-4 w-4" /></button>
          : <button className="btn-accent" onClick={finish}>เริ่มเส้นทางของฉัน</button>}
      </div>
    </div>
  );
}
