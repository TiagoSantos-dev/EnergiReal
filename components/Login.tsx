import React, { useState } from 'react';
import { supabase, updateSupabaseConfig } from '../lib/supabase';
import { Zap, Mail, Lock, ArrowRight, Loader2, AlertCircle, Settings, X } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [configUrl, setConfigUrl] = useState(localStorage.getItem('supabase_project_url') || '');
  const [configKey, setConfigKey] = useState(localStorage.getItem('supabase_anon_key') || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Cadastro realizado! Se o login automático não ocorrer, tente entrar com suas credenciais.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error(error);
      if (error.message && (error.message.includes('Fetch') || error.message.includes('url'))) {
          setErrorMsg('Erro de conexão. Verifique as chaves do Supabase clicando na engrenagem no canto superior direito.');
      } else {
          setErrorMsg(error.message || 'Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
      e.preventDefault();
      if(configUrl && configKey) {
          updateSupabaseConfig(configUrl, configKey);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      
      {/* Config Button */}
      <button 
        onClick={() => setShowSettings(true)}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-20"
        title="Configurar Conexão"
      >
          <Settings size={20} />
      </button>

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                  <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                      <X size={20} />
                  </button>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" /> Configuração do Projeto
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                      Insira as chaves do seu projeto Supabase. Elas serão salvas no seu navegador.
                  </p>
                  <form onSubmit={handleSaveConfig} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project URL</label>
                          <input 
                            type="text" 
                            value={configUrl}
                            onChange={(e) => setConfigUrl(e.target.value)}
                            placeholder="https://xxx.supabase.co"
                            className="w-full p-2 border rounded text-sm bg-slate-50"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Anon Public Key</label>
                          <input 
                            type="password" 
                            value={configKey}
                            onChange={(e) => setConfigKey(e.target.value)}
                            placeholder="eyJh..."
                            className="w-full p-2 border rounded text-sm bg-slate-50"
                          />
                      </div>
                      <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                          Salvar e Recarregar
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white z-10 mx-4 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isSignUp ? 'Registre-se para começar a economizar.' : 'Acesse o EnergiReal para gerenciar seu consumo.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 ml-1">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 ml-1">Senha</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isSignUp ? 'Cadastrar' : 'Entrar'}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }} 
              className="font-medium text-indigo-600 hover:text-indigo-500 outline-none"
            >
              {isSignUp ? 'Faça Login' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};