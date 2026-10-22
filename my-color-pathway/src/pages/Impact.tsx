import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cohort, pilotKPIs } from '../data/mock';
import { PageHeader } from '../components/ui';

export default function Impact() {
  const chart = [
    { name: 'Career Maturity', ก่อน: 52, หลัง: 64 },
    { name: 'บอกสาขาที่เหมาะได้ชัด (%)', ก่อน: 31, หลัง: 74 },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Pilot Impact" sub={`โครงการนำร่อง 1 ปี · ${cohort.name} (${cohort.size} คน) · วัดก่อนและหลัง`}>
        <span className="chip bg-amber/40 font-bold">ข้อมูลจำลอง (Mock data)</span>
      </PageHeader>
      <blockquote className="card border-l-8 border-orange text-lg font-semibold">“เราไม่ได้ช่วยให้เด็กเข้ามหาวิทยาลัยได้ แต่ช่วยให้เด็กรู้จักตัวเองก่อนต้องตัดสินใจครั้งใหญ่”</blockquote>
      <section className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="text-left"><th className="py-2">KPI</th><th>ก่อน</th><th>หลัง</th><th>เป้าหมาย</th><th>ผล</th></tr></thead>
          <tbody>
            {pilotKPIs.map((k) => {
              const ok = k.name.startsWith('ความเครียด') ? (k.after! < k.baseline!) : k.name.startsWith('Career') ? k.after! > k.baseline!
                : k.name.startsWith('ความพึงพอใจ') ? k.after! >= 4 : k.after! >= parseInt(k.target.replace(/\D/g, ''));
              return (
                <tr key={k.name} className="border-t border-navy/10">
                  <td className="py-3 pr-3 font-semibold">{k.name}</td>
                  <td>{k.baseline ?? '–'}{k.baseline !== null && k.unit}</td>
                  <td className="font-bold">{k.after}{k.unit}</td>
                  <td>{k.target}</td>
                  <td>{ok ? <span className="chip bg-leaf/25">✓ ถึงเป้า</span> : <span className="chip bg-amber/30">ยังไม่ถึง</span>}</td>
                </tr>
              );
            })}
            <tr className="border-t border-navy/10">
              <td className="py-3 pr-3 font-semibold">ระยะยาว</td>
              <td colSpan={4} className="text-ink">ติดตามจนถึง ม.6: ความสอดคล้องกับสาขาที่แนะนำ และอัตราการซิ่วหลังเข้ามหาวิทยาลัย</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section className="card">
        <h2 className="h2">ก่อน vs หลัง</h2>
        <div className="mt-3 h-64"><ResponsiveContainer>
          <BarChart data={chart} margin={{ left: -20 }}>
            <CartesianGrid stroke="#1C254112" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis domain={[0, 100]} /><Tooltip /><Legend />
            <Bar dataKey="ก่อน" fill="#1C2541" fillOpacity={0.35} radius={[6, 6, 0, 0]} />
            <Bar dataKey="หลัง" fill="#7FB685" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer></div>
      </section>
    </div>
  );
}
