import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <img src={logo} alt="FITPRO AGENDA" className="h-12 w-12 rounded-xl" />
        </motion.div>
        <motion.div
          className="h-1 w-32 rounded-full bg-muted overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="h-full rounded-full gradient-primary"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "50%" }}
          />
        </motion.div>
        <p className="text-sm text-muted-foreground font-medium tracking-wide">AGENDA</p>
      </motion.div>
    </div>
  );
};
