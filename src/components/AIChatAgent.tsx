import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, X, Loader2, Sparkles, User, Brain } from 'lucide-react';
import { aiosService } from '@/lib/aios';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AGENTS = [
  { id: 'math_agent', name: 'Calculadora IA', path: 'example/math_agent' },
  { id: 'academic_agent', name: 'Pesquisador Acadêmico', path: 'example/academic_agent' },
  { id: 'story_teller', name: 'Contador de Histórias', path: 'example/story_teller' },
  { id: 'code_executor', name: 'Executor de Código', path: 'example/code_executor' },
  { id: 'language_tutor', name: 'Tutor de Idiomas', path: 'example/language_tutor' },
  { id: 'tech_support_agent', name: 'Suporte Técnico', path: 'example/tech_support_agent' },
];

export const AIChatAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // 1. Iniciar execução do agente
      const { execution_id } = await aiosService.executeAgent(selectedAgent.path, userMessage);
      
      // 2. Polling do resultado
      let attempts = 0;
      const maxAttempts = 30; // 30 segundos
      
      const poll = async () => {
        const data = await aiosService.getStatus(execution_id);
        
        if (data.status === 'success') {
          const finalResult = typeof data.result === 'object' ? (data.result.result || JSON.stringify(data.result)) : data.result;
          setMessages(prev => [...prev, { role: 'assistant', content: finalResult }]);
          setIsLoading(false);
        } else if (data.status === 'error') {
          toast.error("Erro no agente: " + data.error);
          setIsLoading(false);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000); // Tentar novamente em 1 segundo
        } else {
          toast.error("Tempo de resposta do agente excedido.");
          setIsLoading(false);
        }
      };

      poll();

    } catch (error) {
      console.error(error);
      toast.error("Falha ao comunicar com o AIOS Kernel. Verifique se ele está rodando.");
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-blue-400 opacity-50" />
        <Bot className="h-6 w-6 relative" />
      </button>

      {/* Janela de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-[350px] h-[500px] glass rounded-3xl shadow-2xl flex flex-col z-50 border border-white/20 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-primary/10 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Assistente AIOS</h3>
                  <p className="text-[10px] text-muted-foreground">Kernel Local - Porta 8005</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="hover:bg-red-500/10 p-1 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Seletor de Agente */}
            <div className="px-4 py-2 bg-muted/30 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
              {AGENTS.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
                    selectedAgent.id === agent.id ? 'bg-primary text-white' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {agent.name}
                </button>
              ))}
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <Sparkles className="h-8 w-8 mb-2" />
                  <p className="text-xs">Escolha um agente e <br/> peça qualquer coisa!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs flex gap-2 ${
                    msg.role === 'user' ? 'bg-primary text-white' : 'glass border border-white/10'
                  }`}>
                    {msg.role === 'assistant' && <Brain className="h-3 w-3 mt-0.5 shrink-0" />}
                    <p>{msg.content}</p>
                    {msg.role === 'user' && <User className="h-3 w-3 mt-0.5 shrink-0" />}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass rounded-2xl px-3 py-2 text-xs flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <p>Processando no Kernel...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Como posso ajudar?"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="h-8 w-8 bg-primary rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
