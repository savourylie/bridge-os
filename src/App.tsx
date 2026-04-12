import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function App() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{
        backgroundColor: "#f7f5f2",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        <h1
          className="text-4xl font-semibold tracking-tight"
          style={{ color: "#1a1d21" }}
        >
          BridgeOS
        </h1>
        <p className="mt-3 text-base" style={{ color: "#3d4550" }}>
          Speak naturally. Stay in command.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
      >
        <Button
          className="text-white cursor-pointer"
          style={{ backgroundColor: "#cc7a00" }}
        >
          Initialize
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="text-xs"
        style={{ color: "#7a8494" }}
      >
        Foundation scaffold — TICKET-001
      </motion.div>
    </div>
  );
}

export default App;
