import { Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import TokensPage from "@/pages/Tokens";
import LayoutPage from "@/pages/Layout";
import StatusCapsulePage from "@/pages/StatusCapsule";
import VoiceBarPage from "@/pages/VoiceBar";
import IntentBoardPage from "@/pages/IntentBoard";
import DraftPlanPage from "@/pages/DraftPlan";
import TaskPanelPage from "@/pages/TaskPanel";
import TimelinePage from "@/pages/Timeline";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        <h1 className="type-display-hero text-ink">BridgeOS</h1>
        <p className="mt-3 type-body-lg text-body-text">
          Speak naturally. Stay in command.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      >
        <Button className="cursor-pointer bg-brand text-white hover:bg-brand-hover">
          Initialize
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex flex-col items-center gap-2"
      >
        <span className="type-caption text-subtle">
          Foundation scaffold — TICKET-001
        </span>
        <Link to="/tokens" className="type-caption text-link hover:underline">
          View Design Tokens
        </Link>
        <Link to="/layout" className="type-caption text-link hover:underline">
          View Layout System
        </Link>
        <Link to="/components/status-capsule" className="type-caption text-link hover:underline">
          View StatusCapsule
        </Link>
        <Link to="/components/voice-bar" className="type-caption text-link hover:underline">
          View VoiceBar
        </Link>
        <Link to="/components/intent-board" className="type-caption text-link hover:underline">
          View IntentBoard
        </Link>
        <Link to="/components/draft-plan" className="type-caption text-link hover:underline">
          View DraftPlan
        </Link>
        <Link to="/components/task-panel" className="type-caption text-link hover:underline">
          View TaskPanel
        </Link>
        <Link to="/components/timeline" className="type-caption text-link hover:underline">
          View Timeline
        </Link>
      </motion.div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tokens" element={<TokensPage />} />
      <Route path="/layout" element={<LayoutPage />} />
      <Route path="/components/status-capsule" element={<StatusCapsulePage />} />
      <Route path="/components/voice-bar" element={<VoiceBarPage />} />
      <Route path="/components/intent-board" element={<IntentBoardPage />} />
      <Route path="/components/draft-plan" element={<DraftPlanPage />} />
      <Route path="/components/task-panel" element={<TaskPanelPage />} />
      <Route path="/components/timeline" element={<TimelinePage />} />
    </Routes>
  );
}

export default App;
