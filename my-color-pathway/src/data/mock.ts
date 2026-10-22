import type {
  ConsentRecord, Experience, Mentor, MentorFeedback, Opportunity, PilotKPI, Portfolio,
  ProgramSuggestion, SkillArea, SkillSnapshot, Student, WellbeingCheckin,
} from '../types';

export const skillAreas: SkillArea[] = [
  { id: 'comm', name: 'การสื่อสาร', color: '#E4572E', description: 'เล่าเรื่อง อธิบาย และฟังคนอื่นได้ดี' },
  { id: 'team', name: 'การทำงานเป็นทีม', color: '#F2A541', description: 'ร่วมมือ แบ่งงาน และช่วยเหลือกัน' },
  { id: 'care', name: 'ความเข้าใจผู้อื่น', color: '#C76B98', description: 'ใส่ใจความรู้สึกและความต้องการของคน' },
  { id: 'create', name: 'ความคิดสร้างสรรค์', color: '#3A7CA5', description: 'คิดไอเดียใหม่ ออกแบบ และสร้างงาน' },
  { id: 'solve', name: 'การแก้ปัญหา', color: '#5B5F97', description: 'วิเคราะห์ ลองผิดลองถูก และหาทางออก' },
  { id: 'resp', name: 'ความรับผิดชอบ', color: '#7FB685', description: 'ทำตามที่ตกลง ดูแลงานจนจบ' },
];

export const interests = [
  'ศิลปะ', 'คน', 'ธรรมชาติ', 'เทคโนโลยี', 'สุขภาพ', 'ดนตรี', 'อาหาร', 'การเล่าเรื่อง', 'สัตว์', 'ธุรกิจ', 'กีฬา', 'วิทยาศาสตร์',
];

export const students: Student[] = [
  { id: 's1', nickname: 'มิว', grade: 9, stage: 'do', interests: ['ศิลปะ', 'คน', 'การเล่าเรื่อง'], consentStatus: 'granted', avatarColor: '#E4572E' },
  { id: 's2', nickname: 'ภูมิ', grade: 12, stage: 'choose', interests: ['เทคโนโลยี', 'ธรรมชาติ', 'สุขภาพ'], consentStatus: 'granted', avatarColor: '#3A7CA5' },
];

export const mentors: Mentor[] = [
  { id: 'm1', name: 'พี่เจน', role: 'นักออกแบบกราฟิก', organization: 'สตูดิโอบ้านสี' },
  { id: 'm2', name: 'คุณพยาบาลนิด', role: 'พยาบาลวิชาชีพ', organization: 'โรงพยาบาลชุมชนบางกรวย' },
  { id: 'm3', name: 'พี่ต้น', role: 'วิศวกรซอฟต์แวร์ (ศิษย์เก่า)', organization: 'ชมรม Code for Kids' },
  { id: 'm4', name: 'ป้าแดง', role: 'เจ้าของสวน', organization: 'สวนผักอินทรีย์ป้าแดง' },
  { id: 'm5', name: 'พี่ฝน', role: 'แอนิเมเตอร์', organization: 'Little Frame Animation' },
  { id: 'm6', name: 'ครูโอ๋', role: 'ผู้ประสานงานจิตอาสา', organization: 'มูลนิธิเพื่อนชุมชน' },
];

const o = (x: Opportunity) => x;
export const opportunities: Opportunity[] = [
  o({ id: 'o1', title: 'จิตอาสาห้องสมุดชุมชน', organization: 'มูลนิธิเพื่อนชุมชน', type: 'volunteer', format: 'onsite', durationHours: 12, stage: 'try',
    skills: ['comm', 'resp'], interestTags: ['คน', 'การเล่าเรื่อง'], supervisionNote: 'ครูผู้ประสานงานอยู่ด้วยตลอดกิจกรรม', mentorId: 'm6', capacity: 10,
    description: 'ช่วยจัดหนังสือและอ่านนิทานให้น้อง ๆ ในชุมชนฟังทุกวันเสาร์', schedule: 'เสาร์ 9:00–12:00 · 4 สัปดาห์', location: 'ชุมชนวัดสุทธิ',
    expect: ['อ่านนิทานให้เด็กเล็กฟัง', 'จัดมุมหนังสือ', 'เขียนบันทึกสั้น ๆ หลังกิจกรรม'] }),
  o({ id: 'o2', title: 'ผู้ช่วยกิจกรรมบ้านพักผู้สูงอายุ', organization: 'บ้านสุขใจ', type: 'volunteer', format: 'onsite', durationHours: 8, stage: 'try',
    skills: ['care', 'comm'], interestTags: ['คน', 'สุขภาพ'], supervisionNote: 'เจ้าหน้าที่ดูแลตลอด ไม่มีงานดูแลทางการแพทย์', mentorId: 'm6', capacity: 8,
    description: 'ชวนผู้สูงอายุทำกิจกรรมศิลปะและพูดคุย', schedule: 'อาทิตย์ 13:00–15:00 · 4 สัปดาห์', location: 'บ้านสุขใจ นนทบุรี',
    expect: ['เตรียมกิจกรรมง่าย ๆ', 'ฟังเรื่องเล่าของคุณตาคุณยาย'] }),
  o({ id: 'o3', title: 'ปลูกผักกับป้าแดง', organization: 'สวนผักอินทรีย์ป้าแดง', type: 'volunteer', format: 'onsite', durationHours: 10, stage: 'try',
    skills: ['team', 'resp'], interestTags: ['ธรรมชาติ', 'อาหาร'], supervisionNote: 'ทำงานเป็นกลุ่ม มีครูและเจ้าของสวนดูแล', mentorId: 'm4', capacity: 15,
    description: 'เรียนรู้การปลูกผักอินทรีย์ ตั้งแต่เพาะเมล็ดจนเก็บเกี่ยว', schedule: 'เสาร์เว้นเสาร์ · 5 ครั้ง', location: 'ปทุมธานี',
    expect: ['เพาะเมล็ด', 'ดูแลแปลงผักกับเพื่อน', 'ขายผักที่ตลาดนัดโรงเรียน'] }),
  o({ id: 'o4', title: 'Job Shadowing นักออกแบบกราฟิก', organization: 'สตูดิโอบ้านสี', type: 'shadowing', format: 'onsite', durationHours: 16, stage: 'do',
    skills: ['create', 'comm'], interestTags: ['ศิลปะ', 'การเล่าเรื่อง'], supervisionNote: 'โรงเรียนอนุมัติสถานที่ มีพี่เลี้ยง 1:3', mentorId: 'm1', capacity: 3,
    description: 'ตามติดชีวิตนักออกแบบ ดูว่าโปสเตอร์หนึ่งชิ้นเกิดขึ้นอย่างไร', schedule: 'ปิดภาคเรียน 4 วัน · 9:00–13:00', location: 'สตูดิโอบ้านสี อารีย์',
    expect: ['นั่งฟังการคุยงานกับลูกค้า', 'ลองร่างโปสเตอร์ของตัวเอง', 'นำเสนองานสั้น ๆ วันสุดท้าย'] }),
  o({ id: 'o5', title: 'Online Workshop แอนิเมชันเบื้องต้น', organization: 'Little Frame Animation', type: 'shadowing', format: 'online', durationHours: 6, stage: 'do',
    skills: ['create', 'solve'], interestTags: ['ศิลปะ', 'การเล่าเรื่อง', 'เทคโนโลยี'], supervisionNote: 'ออนไลน์ผ่านระบบโรงเรียน มีครูร่วมห้อง', mentorId: 'm5', capacity: 30,
    description: 'ทำแอนิเมชันสั้น 5 วินาทีด้วยมือถือ เข้าร่วมได้จากทุกที่', schedule: 'พุธ 16:00–17:30 · 4 ครั้ง', location: 'ออนไลน์',
    expect: ['เรียนหลักการเคลื่อนไหว', 'ทำ stop-motion ของตัวเอง'] }),
  o({ id: 'o6', title: 'จิตอาสาโรงพยาบาล: ต้อนรับผู้ป่วย', organization: 'โรงพยาบาลชุมชนบางกรวย', type: 'volunteer', format: 'onsite', durationHours: 12, stage: 'do',
    skills: ['care', 'comm', 'resp'], interestTags: ['สุขภาพ', 'คน'], supervisionNote: 'อยู่จุดต้อนรับเท่านั้น มีพยาบาลพี่เลี้ยง', mentorId: 'm2', capacity: 4,
    description: 'ช่วยพาผู้ป่วยไปจุดบริการและเห็นการทำงานของทีมพยาบาล', schedule: 'เสาร์ 8:00–11:00 · 4 สัปดาห์', location: 'นนทบุรี',
    expect: ['ทักทายและพาผู้ป่วยไปแผนกต่าง ๆ', 'ฟังพยาบาลเล่างานในแต่ละวัน'] }),
  o({ id: 'o7', title: 'ชมรมโค้ดดิ้ง: สร้างเกมแรก', organization: 'ชมรม Code for Kids', type: 'shadowing', format: 'online', durationHours: 10, stage: 'do',
    skills: ['solve', 'create'], interestTags: ['เทคโนโลยี', 'วิทยาศาสตร์'], supervisionNote: 'ศิษย์เก่าเป็นพี่เลี้ยง มีครูคอมพิวเตอร์ดูแล', mentorId: 'm3', capacity: 20,
    description: 'สร้างเกมง่าย ๆ ด้วย Scratch และ Python ทีละขั้น', schedule: 'อังคาร 16:00–17:00 · 10 สัปดาห์', location: 'ออนไลน์',
    expect: ['เขียนโค้ดแรก', 'แก้บั๊กกับเพื่อน', 'โชว์เกมวันสุดท้าย'] }),
  o({ id: 'o8', title: 'Job Shadowing ร้านกาแฟชุมชน', organization: 'ร้านกาแฟบ้านไม้', type: 'shadowing', format: 'onsite', durationHours: 8, stage: 'do',
    skills: ['team', 'comm', 'solve'], interestTags: ['อาหาร', 'ธุรกิจ', 'คน'], supervisionNote: 'เรียนรู้ภาคสนาม ไม่ใช่การจ้างงาน ไม่ใช้เครื่องมือร้อน', mentorId: 'm6', capacity: 2,
    description: 'ดูว่าร้านเล็ก ๆ วางแผนเมนู ต้นทุน และดูแลลูกค้าอย่างไร', schedule: 'เสาร์ 2 ครั้ง · 9:00–13:00', location: 'บางพลัด',
    expect: ['สังเกตการบริการลูกค้า', 'ลองคิดเมนูใหม่หนึ่งเมนู'] }),
  o({ id: 'o9', title: 'Job Shadowing สถานีวิทยุชุมชน', organization: 'คลื่นชุมชน FM 99', type: 'shadowing', format: 'onsite', durationHours: 8, stage: 'do',
    skills: ['comm', 'create'], interestTags: ['การเล่าเรื่อง', 'ดนตรี'], supervisionNote: 'ผู้จัดรายการเป็นพี่เลี้ยง มีครูไปเยี่ยม', mentorId: 'm6', capacity: 2,
    description: 'ตามดูการจัดรายการวิทยุ และลองอัดเสียงสปอตสั้น ๆ', schedule: '2 วัน ช่วงปิดภาคเรียน', location: 'ตลิ่งชัน',
    expect: ['ดูหลังไมค์', 'เขียนบทสปอต 30 วินาที'] }),
  o({ id: 'o10', title: 'ฝึกงานระยะสั้น: ห้องแล็บมหาวิทยาลัย', organization: 'คณะวิทยาศาสตร์ มหาวิทยาลัยธรรมศาสตร์', type: 'internship', format: 'onsite', durationHours: 20, stage: 'choose',
    skills: ['solve', 'resp'], interestTags: ['วิทยาศาสตร์', 'ธรรมชาติ'], supervisionNote: 'นักศึกษาปริญญาโทดูแล อยู่ในพื้นที่ปลอดภัย', mentorId: 'm3', capacity: 5,
    description: 'ช่วยเก็บข้อมูลคุณภาพน้ำ และเห็นการทำงานวิจัยจริง', schedule: '5 วัน ช่วงปิดภาคเรียน', location: 'ศูนย์รังสิต',
    expect: ['เก็บตัวอย่างน้ำ', 'บันทึกข้อมูล', 'สรุปผลสั้น ๆ'] }),
  o({ id: 'o11', title: 'Online: คุยกับศิษย์เก่า 5 อาชีพ', organization: 'เครือข่ายศิษย์เก่า', type: 'shadowing', format: 'online', durationHours: 5, stage: 'choose',
    skills: ['comm'], interestTags: ['คน', 'ธุรกิจ', 'เทคโนโลยี', 'สุขภาพ'], supervisionNote: 'วงคุยออนไลน์ มีครูแนะแนวดำเนินรายการ', mentorId: 'm3', capacity: 50,
    description: 'ถามตรง ๆ กับรุ่นพี่ว่าวันจริงของอาชีพเขาเป็นอย่างไร', schedule: 'ศุกร์ 19:00–20:00 · 5 ครั้ง', location: 'ออนไลน์',
    expect: ['เตรียมคำถาม 3 ข้อ', 'บันทึกสิ่งที่ประหลาดใจ'] }),
  o({ id: 'o12', title: 'Job Shadowing คลินิกสัตว์', organization: 'คลินิกรักสัตว์', type: 'shadowing', format: 'onsite', durationHours: 8, stage: 'do',
    skills: ['care', 'resp'], interestTags: ['สัตว์', 'สุขภาพ'], supervisionNote: 'สังเกตการณ์เท่านั้น สัตวแพทย์ดูแล', mentorId: 'm2', capacity: 2,
    description: 'เห็นงานจริงของสัตวแพทย์และผู้ช่วย', schedule: '2 วัน · 9:00–13:00', location: 'ราชพฤกษ์',
    expect: ['สังเกตการตรวจ', 'ช่วยเตรียมอุปกรณ์ทำความสะอาด'] }),
];

export const mentorFeedback: MentorFeedback[] = [
  { id: 'f1', mentorId: 'm6', strengths: ['อ่านนิทานด้วยน้ำเสียงที่ดึงดูดเด็ก ๆ', 'มาตรงเวลาทุกครั้ง'], growthAreas: ['ลองชวนน้อง ๆ ถามคำถามมากขึ้น'], note: 'เด็ก ๆ ถามหาน้องมิวทุกเสาร์เลยนะ' },
  { id: 'f2', mentorId: 'm1', strengths: ['เลือกสีได้มีเหตุผล', 'กล้าถามลูกค้าว่าต้องการอะไรจริง ๆ'], growthAreas: ['ลองร่างหลาย ๆ แบบก่อนเลือกแบบเดียว'], note: 'โปสเตอร์ของมิวเล่าเรื่องได้ชัดมาก' },
  { id: 'f3', mentorId: 'm5', strengths: ['อดทนกับงานที่ต้องทำทีละเฟรม'], growthAreas: ['วางแผนเรื่องก่อนเริ่มถ่าย'], note: 'ตัวละครของมิวมีบุคลิกชัดเจน' },
  { id: 'f4', mentorId: 'm3', strengths: ['แก้บั๊กอย่างเป็นระบบ', 'ช่วยอธิบายให้เพื่อนในทีม'], growthAreas: ['ลองเขียนคอมเมนต์ในโค้ดให้คนอื่นอ่านง่าย'], note: 'ภูมิมีความอยากรู้ที่ดีมาก' },
  { id: 'f5', mentorId: 'm4', strengths: ['ทำงานกับเพื่อนได้ดี', 'สังเกตเห็นโรคใบได้เร็ว'], growthAreas: ['ลองจดบันทึกการทดลองให้ละเอียดขึ้น'], note: 'ป้าเห็นภูมิสนุกกับการทดลองปุ๋ยมาก' },
  { id: 'f6', mentorId: 'm3', strengths: ['เก็บข้อมูลแม่นยำ', 'ถามคำถามที่ดีเกี่ยวกับวิธีวิจัย'], growthAreas: ['ฝึกนำเสนอผลด้วยกราฟ'], note: 'เหมาะกับงานที่ต้องคิดเป็นระบบ' },
];

export const experiences: Experience[] = [
  { id: 'e1', studentId: 's1', opportunityId: 'o1', date: '2024-07-13', enjoyment: 5, energy: 4, skillTags: ['comm', 'resp'], mentorFeedbackId: 'f1',
    reflection: 'ตอนที่น้อง ๆ หัวเราะกับเสียงตัวละครที่หนูทำ รู้สึกเป็นตัวเองมากที่สุด ยากสุดคือวันที่น้องไม่ยอมนั่งฟัง', evidence: [{ label: 'รูปมุมนิทาน', color: '#F2A541' }] },
  { id: 'e2', studentId: 's1', opportunityId: 'o2', date: '2024-11-17', enjoyment: 4, energy: 3, skillTags: ['care', 'comm'],
    reflection: 'คุณยายสอนพับดอกไม้ใบเตย หนูได้ฟังมากกว่าพูด และชอบแบบนั้น', evidence: [{ label: 'ดอกไม้ใบเตย', color: '#7FB685' }] },
  { id: 'e3', studentId: 's1', opportunityId: 'o4', date: '2025-04-08', enjoyment: 5, energy: 5, skillTags: ['create', 'comm'], mentorFeedbackId: 'f2',
    reflection: 'ไม่เคยรู้ว่าการออกแบบต้องคุยกับคนเยอะขนาดนี้ ตอนนำเสนอโปสเตอร์ตื่นเต้นแต่ภูมิใจ', evidence: [{ label: 'โปสเตอร์ตลาดนัด', color: '#E4572E' }, { label: 'ภาพร่าง 3 แบบ', color: '#3A7CA5' }] },
  { id: 'e4', studentId: 's1', opportunityId: 'o5', date: '2025-08-20', enjoyment: 4, energy: 2, skillTags: ['create', 'solve'], mentorFeedbackId: 'f3',
    reflection: 'สนุกแต่เหนื่อยมาก 5 วินาทีใช้เวลาเป็นชั่วโมง ได้รู้ว่าชอบส่วนคิดเรื่องมากกว่าส่วนขยับทีละเฟรม', evidence: [{ label: 'คลิป stop-motion', color: '#5B5F97' }] },
  { id: 'e5', studentId: 's2', opportunityId: 'o3', date: '2021-08-14', enjoyment: 4, energy: 4, skillTags: ['team', 'resp'], mentorFeedbackId: 'f5',
    reflection: 'ทดลองปุ๋ยสองแบบในแปลงข้าง ๆ กัน สนุกตอนดูผลว่าแบบไหนโตเร็วกว่า', evidence: [{ label: 'ตารางบันทึกต้นผัก', color: '#7FB685' }] },
  { id: 'e6', studentId: 's2', opportunityId: 'o1', date: '2022-02-05', enjoyment: 3, energy: 3, skillTags: ['comm'],
    reflection: 'พูดหน้าเด็ก ๆ ไม่ค่อยถนัด แต่ชอบช่วยจัดระบบหมวดหนังสือ', evidence: [{ label: 'ผังหมวดหนังสือ', color: '#F2A541' }] },
  { id: 'e7', studentId: 's2', opportunityId: 'o7', date: '2023-06-20', enjoyment: 5, energy: 5, skillTags: ['solve', 'create', 'team'], mentorFeedbackId: 'f4',
    reflection: 'เกมแรกพังตลอด แต่วันที่มันรันได้คือวันที่ดีที่สุดของเทอม', evidence: [{ label: 'เกมเก็บขยะ (Scratch)', color: '#3A7CA5' }] },
  { id: 'e8', studentId: 's2', opportunityId: 'o6', date: '2024-03-16', enjoyment: 3, energy: 2, skillTags: ['care', 'resp'],
    reflection: 'ได้รู้ว่าเคารพงานพยาบาลมาก แต่อาจไม่ใช่ทางของผม ชอบตอนดูระบบคิวมากกว่า', evidence: [{ label: 'ภาพร่างระบบคิว', color: '#C76B98' }] },
  { id: 'e9', studentId: 's2', opportunityId: 'o10', date: '2025-04-02', enjoyment: 5, energy: 4, skillTags: ['solve', 'resp'], mentorFeedbackId: 'f6',
    reflection: 'เก็บข้อมูลน้ำแล้วเขียนโค้ดทำกราฟเอง รู้สึกว่าเทคโนโลยีกับธรรมชาติมาเจอกันตรงนี้', evidence: [{ label: 'กราฟคุณภาพน้ำ', color: '#3A7CA5' }, { label: 'สคริปต์ Python', color: '#5B5F97' }] },
  { id: 'e10', studentId: 's2', opportunityId: 'o11', date: '2025-09-12', enjoyment: 4, energy: 4, skillTags: ['comm'],
    reflection: 'รุ่นพี่ด้าน environmental data บอกว่างานนี้ต้องใช้ทั้งโค้ดและการลงพื้นที่ ตรงกับที่ผมชอบเลย', evidence: [{ label: 'โน้ตคำถาม', color: '#F2A541' }] },
];

const L = (comm: string, team: string, care: string, create: string, solve: string, resp: string) =>
  ([['comm', comm], ['team', team], ['care', care], ['create', create], ['solve', solve], ['resp', resp]] as const)
    .map(([skillAreaId, c]) => ({ skillAreaId, level: ({ e: 'exploring', d: 'developing', c: 'confident' } as const)[c as 'e' | 'd' | 'c'] }));

export const skillSnapshots: SkillSnapshot[] = [
  { studentId: 's1', grade: 7, skills: L('e', 'e', 'e', 'd', 'e', 'e') },
  { studentId: 's1', grade: 8, skills: L('d', 'e', 'd', 'd', 'e', 'd') },
  { studentId: 's1', grade: 9, skills: L('c', 'd', 'd', 'c', 'd', 'd') },
  { studentId: 's2', grade: 7, skills: L('e', 'd', 'e', 'e', 'd', 'd') },
  { studentId: 's2', grade: 8, skills: L('e', 'd', 'e', 'e', 'd', 'd') },
  { studentId: 's2', grade: 9, skills: L('e', 'd', 'e', 'd', 'c', 'd') },
  { studentId: 's2', grade: 10, skills: L('d', 'c', 'd', 'd', 'c', 'd') },
  { studentId: 's2', grade: 11, skills: L('d', 'c', 'd', 'd', 'c', 'c') },
  { studentId: 's2', grade: 12, skills: L('d', 'c', 'd', 'c', 'c', 'c') },
];

export const fieldsThatMaySuit: Record<string, { name: string; why: string }[]> = {
  s1: [
    { name: 'การออกแบบสื่อสาร (Communication Design)', why: 'มีความสุขที่สุดตอนทำโปสเตอร์และนำเสนอ' },
    { name: 'การเล่าเรื่องและแอนิเมชัน', why: 'ชอบคิดเรื่องและตัวละคร' },
    { name: 'การศึกษา / งานกับเด็ก', why: 'พลังงานสูงทุกครั้งที่อยู่กับน้อง ๆ' },
  ],
  s2: [
    { name: 'วิทยาการข้อมูลสิ่งแวดล้อม', why: 'โค้ด + ธรรมชาติ คือช่วงที่สนุกที่สุด' },
    { name: 'วิศวกรรมคอมพิวเตอร์', why: 'ชอบแก้ปัญหาอย่างเป็นระบบ' },
    { name: 'เทคโนโลยีสุขภาพ', why: 'สนใจระบบคิวโรงพยาบาลมากกว่างานดูแลผู้ป่วย' },
  ],
};

export const wellbeing: WellbeingCheckin[] = [
  { studentId: 's1', date: 'มิ.ย. 67', stress: 4, confidence: 2, private: true },
  { studentId: 's1', date: 'ส.ค. 67', stress: 4, confidence: 2, private: true },
  { studentId: 's1', date: 'พ.ย. 67', stress: 3, confidence: 3, private: true },
  { studentId: 's1', date: 'ก.พ. 68', stress: 3, confidence: 3, private: true },
  { studentId: 's1', date: 'เม.ย. 68', stress: 2, confidence: 4, private: true },
  { studentId: 's1', date: 'ส.ค. 68', stress: 3, confidence: 4, private: true },
  { studentId: 's2', date: 'มิ.ย. 68', stress: 4, confidence: 3, private: true },
  { studentId: 's2', date: 'ส.ค. 68', stress: 3, confidence: 4, private: true },
  { studentId: 's2', date: 'ก.ย. 68', stress: 2, confidence: 4, private: true },
];

export const programSuggestions: ProgramSuggestion[] = [
  { id: 'p1', university: 'มหาวิทยาลัยธรรมศาสตร์', faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี', program: 'วิทยาการคอมพิวเตอร์',
    fitTags: ['solve', 'create'], reasons: [{ text: 'สนุกที่สุดตอนเกมแรกรันได้ (พลังงาน 5/5 ของตัวเอง)', experienceId: 'e7' }, { text: 'พี่เลี้ยงสังเกตว่าแก้บั๊กอย่างเป็นระบบ', experienceId: 'e7' }] },
  { id: 'p2', university: 'มหาวิทยาลัยมหิดล', faculty: 'คณะสิ่งแวดล้อมและทรัพยากรศาสตร์', program: 'วิทยาศาสตร์สิ่งแวดล้อม',
    fitTags: ['solve', 'resp'], reasons: [{ text: 'ฝึกที่ห้องแล็บคุณภาพน้ำแล้วบอกว่า "เทคโนโลยีกับธรรมชาติมาเจอกัน"', experienceId: 'e9' }, { text: 'ชอบทดลองปุ๋ยตั้งแต่ ม.1', experienceId: 'e5' }] },
  { id: 'p3', university: 'จุฬาลงกรณ์มหาวิทยาลัย', faculty: 'คณะวิศวกรรมศาสตร์', program: 'วิศวกรรมคอมพิวเตอร์',
    fitTags: ['solve', 'team'], reasons: [{ text: 'ทักษะการทำงานเป็นทีมเติบโตต่อเนื่องจาก ม.1 ถึง ม.6' }, { text: 'ช่วยอธิบายโค้ดให้เพื่อนในชมรม', experienceId: 'e7' }] },
  { id: 'p4', university: 'มหาวิทยาลัยเชียงใหม่', faculty: 'คณะสาธารณสุขศาสตร์', program: 'สารสนเทศสุขภาพ (Health Informatics)', unexpected: true,
    fitTags: ['solve', 'care'], reasons: [{ text: 'ตอนจิตอาสาโรงพยาบาล สนใจระบบคิวมากกว่างานดูแลผู้ป่วย', experienceId: 'e8' }] },
  { id: 'p5', university: 'มหาวิทยาลัยเกษตรศาสตร์', faculty: 'คณะเกษตร', program: 'เกษตรอัจฉริยะ (Smart Farming)', unexpected: true,
    fitTags: ['solve', 'team'], reasons: [{ text: 'ประสบการณ์สวนผักป้าแดง + ความชอบเขียนโค้ดเก็บข้อมูล', experienceId: 'e5' }] },
];

export const portfolios: Portfolio[] = [
  { studentId: 's2', selectedExperienceIds: ['e9', 'e7', 'e5', 'e8'], order: ['e9', 'e7', 'e5', 'e8'], exportStatus: 'draft' },
];

export const consentRecords: ConsentRecord[] = [
  { studentId: 's1', parentName: 'คุณแม่สุดา', scope: ['เข้าร่วมกิจกรรมนอกโรงเรียน', 'เข้าร่วมแบบออนไลน์', 'บันทึกรูปผลงาน'], date: '2 พ.ค. 2567' },
  { studentId: 's2', parentName: 'คุณพ่อวิชัย', scope: ['เข้าร่วมกิจกรรมนอกโรงเรียน', 'ฝึกงานระยะสั้นในมหาวิทยาลัย', 'ส่งออก Portfolio'], date: '15 พ.ค. 2563' },
];

export const pilotKPIs: PilotKPI[] = [
  { name: 'ความเครียดเกี่ยวกับอนาคต (รายงานตนเอง, 1–5)', baseline: 3.8, after: 3.1, target: 'ลดลง', unit: '', direction: 'down' },
  { name: 'Career Maturity (แบบวัดความพร้อมด้านอาชีพ, 0–100)', baseline: 52, after: 64, target: 'เพิ่มขึ้น', unit: '', direction: 'up' },
  { name: 'อัปเดต Skill Profile ประจำปีครบ', baseline: null, after: 86, target: '≥ 80%', unit: '%', direction: 'up' },
  { name: 'บอกสาขาที่เหมาะกับตัวเองได้ชัดเจนขึ้น', baseline: 31, after: 74, target: '≥ 70%', unit: '%', direction: 'up' },
  { name: 'ความพึงพอใจ นักเรียน/ผู้ปกครอง/พี่เลี้ยง (1–5)', baseline: null, after: 4.3, target: '“ดี” ขึ้นไป (≥ 4.0)', unit: '', direction: 'up' },
];

export const cohort = {
  name: 'ม.1 รุ่นนำร่อง 2569',
  size: 120,
  participation: [
    { month: 'มิ.ย.', pct: 42 }, { month: 'ก.ค.', pct: 61 }, { month: 'ส.ค.', pct: 70 }, { month: 'ก.ย.', pct: 74 },
    { month: 'พ.ย.', pct: 79 }, { month: 'ธ.ค.', pct: 83 }, { month: 'ม.ค.', pct: 85 }, { month: 'ก.พ.', pct: 88 },
  ],
  wellbeingAvg: [
    { month: 'มิ.ย.', stress: 3.8, confidence: 2.6 }, { month: 'ส.ค.', stress: 3.6, confidence: 2.9 }, { month: 'พ.ย.', stress: 3.4, confidence: 3.2 },
    { month: 'ม.ค.', stress: 3.2, confidence: 3.4 }, { month: 'มี.ค.', stress: 3.1, confidence: 3.6 },
  ],
  profileCompletion: 86,
  consentShared: 64,
};

export const levelLabel = { exploring: 'กำลังสำรวจ', developing: 'กำลังเติบโต', confident: 'มั่นใจ' } as const;
export const levelValue = { exploring: 1, developing: 2, confident: 3 } as const;
export const stageInfo = {
  try: { th: 'ลอง', en: 'Try', grades: 'ม.1–ม.2', color: '#F2A541', desc: 'จิตอาสาในชุมชนหลากหลายแบบ' },
  do: { th: 'ลงมือ', en: 'Do', grades: 'ม.3–ม.5', color: '#E4572E', desc: 'Job Shadowing และการเรียนรู้ภาคสนาม' },
  choose: { th: 'เลือก', en: 'Choose', grades: 'ม.6', color: '#3A7CA5', desc: 'Portfolio และสาขาที่อาจเหมาะกับคุณ' },
} as const;
export const typeLabel = { volunteer: 'จิตอาสา', shadowing: 'Job Shadowing', internship: 'ฝึกงานระยะสั้น (เรียนรู้ภาคสนาม)' } as const;
export const gradeLabel = (g: number) => `ม.${g - 6}`;
