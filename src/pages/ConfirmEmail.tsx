import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const ConfirmEmail = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="flex flex-col items-center mb-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <img src={logo} alt="FITPRO AGENDA" className="h-16 w-16 rounded-2xl mb-4 shadow-lg shadow-primary/25" />
          <h1 className="text-3xl font-bold tracking-tight">
            FITPRO <span className="text-gradient">AGENDA</span>
          </h1>
        </motion.div>

        <motion.div
          className="glass rounded-2xl p-8 shadow-xl text-center space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
            className="flex justify-center"
          >
            <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              E-mail Confirmado!
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Sua conta foi verificada com sucesso. Agora você tem acesso completo a todas as ferramentas do FITPRO AGENDA.
            </p>
          </div>

          <Link to="/" className="block pt-4">
            <Button className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300">
              Acessar Plataforma
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ConfirmEmail;
