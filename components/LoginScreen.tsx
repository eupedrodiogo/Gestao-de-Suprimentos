
import React, { useState } from 'react';
import { Layers, ArrowRight, Lock, Mail, Loader2, ShieldCheck, HeartPulse } from 'lucide-react';
import { User } from '../types';
import { login } from '../services/authService';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (email: string) => {
    setEmail(email);
    setPassword('123456');
  };

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-5xl z-10 flex flex-col lg:flex-row gap-12 lg:gap-20 animate-in zoom-in duration-500">
        
        {/* Left Side - Brand */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-brand-500 to-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-900/50 mb-6">
              <Layers size={32} className="text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4">
              SupriNexus <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-400">AI</span>
            </h1>
            <p className="text-brand-400 text-sm sm:text-base font-medium leading-relaxed max-w-sm">
              Plataforma de inteligência logística autônoma para gestão hospitalar e corporativa. 
              Auditoria em tempo real e controle de acesso RBAC.
            </p>
          </div>

          <div className="hidden lg:block space-y-4">
             <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <ShieldCheck className="text-brand-400" size={24} />
                <div>
                  <h3 className="text-white text-xs font-black uppercase tracking-widest">Acesso Seguro</h3>
                  <p className="text-brand-500 text-[10px]">Criptografia ponta a ponta</p>
                </div>
             </div>
             <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <HeartPulse className="text-brand-400" size={24} />
                <div>
                  <h3 className="text-white text-xs font-black uppercase tracking-widest">Conformidade Tasy</h3>
                  <p className="text-brand-500 text-[10px]">Integração Philips ERP Nativa</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 max-w-md w-full mx-auto">
          <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-xl">
            <h2 className="text-2xl font-black text-brand-900 mb-2">Acesso Restrito</h2>
            <p className="text-brand-400 text-xs font-bold uppercase tracking-widest mb-8">Identifique-se para continuar</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-500 uppercase tracking-widest ml-1">Email Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-brand-50 border border-brand-200 rounded-xl py-3.5 pl-12 pr-4 text-brand-900 font-bold text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    placeholder="usuario@nexus.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-brand-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-brand-50 border border-brand-200 rounded-xl py-3.5 pl-12 pr-4 text-brand-900 font-bold text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-brand-900 hover:bg-brand-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>Entrar no Sistema <ArrowRight size={16} /></>}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-brand-100">
               <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest text-center mb-4">Acesso Rápido (Demo)</p>
               <div className="grid grid-cols-2 gap-2">
                 <button type="button" onClick={() => handleQuickLogin('diretoria@nexus.com')} className="px-2 py-2 bg-brand-50 hover:bg-brand-100 rounded-lg text-[9px] font-bold text-brand-600 transition-colors truncate">Diretoria</button>
                 <button type="button" onClick={() => handleQuickLogin('gerencia@nexus.com')} className="px-2 py-2 bg-brand-50 hover:bg-brand-100 rounded-lg text-[9px] font-bold text-brand-600 transition-colors truncate">Ger. Suprimentos</button>
                 <button type="button" onClick={() => handleQuickLogin('compras@nexus.com')} className="px-2 py-2 bg-brand-50 hover:bg-brand-100 rounded-lg text-[9px] font-bold text-brand-600 transition-colors truncate">Compras</button>
                 <button type="button" onClick={() => handleQuickLogin('almoxarifado@nexus.com')} className="px-2 py-2 bg-brand-50 hover:bg-brand-100 rounded-lg text-[9px] font-bold text-brand-600 transition-colors truncate">Almoxarifado</button>
                 <button type="button" onClick={() => handleQuickLogin('financeiro@nexus.com')} className="px-2 py-2 bg-brand-50 hover:bg-brand-100 rounded-lg text-[9px] font-bold text-brand-600 transition-colors truncate">Financeiro</button>
                 <button type="button" onClick={() => handleQuickLogin('solicitante@nexus.com')} className="px-2 py-2 bg-brand-50 hover:bg-brand-100 rounded-lg text-[9px] font-bold text-brand-600 transition-colors truncate">Solicitante</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
