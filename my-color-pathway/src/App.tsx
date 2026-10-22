import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useStore } from './lib/store';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Explore from './pages/Explore';
import OpportunityDetail from './pages/OpportunityDetail';
import ExperienceLog from './pages/ExperienceLog';
import Reflect from './pages/Reflect';
import SkillProfile from './pages/SkillProfile';
import Wellbeing from './pages/Wellbeing';
import Portfolio from './pages/Portfolio';
import Programs from './pages/Programs';
import Privacy from './pages/Privacy';
import Mentor from './pages/Mentor';
import Placements from './pages/Placements';
import Cohort from './pages/Cohort';
import Parent from './pages/Parent';
import Impact from './pages/Impact';
import About from './pages/About';

function StudentHome() {
  const { s } = useStore();
  return s.onboarded[s.studentId] ? <Home /> : <Navigate to="/onboarding" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<StudentHome />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/explore/:id" element={<OpportunityDetail />} />
        <Route path="/log" element={<ExperienceLog />} />
        <Route path="/reflect/:oppId?" element={<Reflect />} />
        <Route path="/profile" element={<SkillProfile />} />
        <Route path="/wellbeing" element={<Wellbeing />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/mentor" element={<Mentor />} />
        <Route path="/teacher/placements" element={<Placements />} />
        <Route path="/teacher/cohort" element={<Cohort />} />
        <Route path="/parent" element={<Parent />} />
        <Route path="/impact" element={<Impact />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
