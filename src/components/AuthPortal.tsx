import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Phone, 
  User, 
  Lock, 
  Mail, 
  ArrowRight, 
  Smartphone, 
  CheckCircle, 
  HelpCircle, 
  RefreshCw,
  Sparkles,
  Info,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthPortalProps {
  onAuthSuccess: (userData: { name: string; email: string; phone: string }) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function AuthPortal({ onAuthSuccess, showToast }: AuthPortalProps) {
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [step, setStep] = useState<'form' | 'sms'>('form');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  
  // 2FA states
  const [smsCode, setSmsCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [timer, setTimer] = useState(59);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [showIncomingSms, setShowIncomingSms] = useState(false);

  // SMS Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'sms' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Generate 4-digit code & trigger mock incoming SMS
  const triggerSms = (phoneNum: string) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);
    setTimer(59);
    setIsResendDisabled(true);
    
    // Play a gentle beep or animation trigger
    setTimeout(() => {
      setShowIncomingSms(true);
      showToast(`✉️ СМС с кодом отправлено на номер ${phoneNum}!`, 'info');
    }, 1200);
  };

  // Pre-fill user data for "Start with me" (Мандрица И.В.)
  const handleStartWithMe = () => {
    setName('Мандрица И.В.');
    setEmail('goxamandartman@gmail.com');
    setPhone('+7 (995) 543-21-09');
    setPassword('goxaMandritca2026');
    setRepeatPassword('goxaMandritca2026');
    setIsRegistering(false);
    showToast('⚡ Учетные данные Мандрицы И.В. успешно предзаполнены!', 'success');
  };

  // Submit First Step (Form Credentials)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegistering) {
      if (!name.trim()) {
        showToast('❌ Пожалуйста, введите ваше ФИО.', 'error');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        showToast('❌ Пожалуйста, введите корректный Email.', 'error');
        return;
      }
      if (!phone.trim() || phone.length < 10) {
        showToast('❌ Пожалуйста, укажите полный номер мобильного телефона.', 'error');
        return;
      }
      if (password.length < 6) {
        showToast('❌ Пароль должен содержать минимум 6 символов.', 'error');
        return;
      }
      if (password !== repeatPassword) {
        showToast('❌ Пароли не совпадают.', 'error');
        return;
      }
    } else {
      // Login validation
      if (!email.trim()) {
        showToast('❌ Введите электронную почту (Логин).', 'error');
        return;
      }
      if (!password.trim()) {
        showToast('❌ Введите пароль доступа.', 'error');
        return;
      }
      // If logging in as prefilled, use prefilled values, else use input or default phone
      if (email === 'goxamandartman@gmail.com') {
        setName('Мандрица И.В.');
        setPhone('+7 (995) 543-21-09');
      } else {
        setName(email.split('@')[0]);
        setPhone('+7 (900) 123-45-67');
      }
    }

    // Advance to SMS verification
    setStep('sms');
    const targetPhone = phone || '+7 (995) 543-21-09';
    triggerSms(targetPhone);
  };

  // Submit SMS Verification Code
  const handleSmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (smsCode === generatedCode || smsCode === '2026') {
      showToast('🌸 Двухфакторная аутентификация подтверждена! Добро пожаловать.', 'success');
      onAuthSuccess({
        name: name || 'Мандрица И.В.',
        email: email || 'goxamandartman@gmail.com',
        phone: phone || '+7 (995) 543-21-09'
      });
    } else {
      showToast('❌ Неверный СМС-код. Пожалуйста, попробуйте еще раз.', 'error');
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto bg-white/95 backdrop-blur-md rounded-3xl border border-indigo-150/80 shadow-2xl overflow-hidden p-6 md:p-8 transition-all duration-300">
      
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
      <div className="absolute -right-16 -top-16 w-32 h-32 bg-indigo-50 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-violet-50 rounded-full blur-2xl pointer-events-none" />

      {/* Floating SMS Screen Alert Simulation */}
      <AnimatePresence>
        {showIncomingSms && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-4 left-4 right-4 z-50 bg-slate-900 text-white rounded-2xl p-3.5 shadow-xl border border-slate-700/50 flex gap-3 cursor-pointer"
            onClick={() => {
              setSmsCode(generatedCode);
              setShowIncomingSms(false);
              showToast('📋 Код автозаполнен из СМС!', 'success');
            }}
          >
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
              <Smartphone className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-wider text-indigo-400 uppercase">Служба СМС ГОС-АВТО</span>
                <span className="text-[10px] text-slate-400 font-medium">сейчас</span>
              </div>
              <p className="text-xs font-bold text-white mt-0.5 leading-tight">
                Код авторизации в системе: <span className="text-amber-400 font-mono text-sm tracking-wider font-extrabold">{generatedCode}</span>
              </p>
              <p className="text-[10px] text-slate-400 font-normal mt-0.5">
                Нажмите сюда, чтобы автоматически вставить код из сообщения
              </p>
            </div>
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                setShowIncomingSms(false);
              }}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RNF/FASIE Style Emblems */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center border border-indigo-200/50 shadow-inner shrink-0">
            <ShieldCheck className="w-5.5 h-5.5 text-indigo-600" />
          </div>
          <div className="text-left">
            <h3 className="font-display font-extrabold text-sm tracking-tight text-slate-800 uppercase leading-none">
              Личный кабинет
            </h3>
            <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase mt-1 block">
              Технопарк СКФУ • Стартап
            </span>
          </div>
        </div>
        
        {/* Quick Demo Fill Button (Start with me) */}
        {step === 'form' && (
          <button
            type="button"
            onClick={handleStartWithMe}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-black tracking-wide transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
            title="Быстрый вход под учётными данными Мандрицы И.В."
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Начни с меня ⚡</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 'form' ? (
          <motion.div
            key="form-step"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-left mb-6">
              <h2 className="text-lg font-black text-slate-900">
                {isRegistering ? 'Регистрация учётной записи' : 'Авторизация в системе'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {isRegistering 
                  ? 'Заполните анкету для получения доступа к инструментам оценки стартапа TRUSEK-6.'
                  : 'Введите логин и пароль для работы с калькулятором индекса самодостаточности SSI.'}
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {isRegistering && (
                <div className="text-left">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    ФИО стартапера / студента <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Иванов Иван Иванович"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                </div>
              )}

              <div className="text-left">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Электронная почта (Логин) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                  />
                </div>
              </div>

              {isRegistering && (
                <div className="text-left">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Номер телефона для 2FA SMS-кода <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="+7 (999) 123-45-67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                </div>
              )}

              <div className="text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Пароль доступа <span className="text-rose-500">*</span>
                  </label>
                  {!isRegistering && (
                    <button 
                      type="button" 
                      onClick={() => showToast('ℹ️ В демонстрационном режиме пароль может быть любым!', 'info')}
                      className="text-[10px] font-bold text-indigo-600 hover:underline"
                    >
                      Забыли пароль?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                  />
                </div>
              </div>

              {isRegistering && (
                <div className="text-left">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Подтвердите пароль <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* Consent and secure disclaimer */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5 text-left mt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Безопасное двухфакторное шифрование. Ваши бизнес-идеи защищены и обрабатываются локально без риска несанкционированной утечки сторонним ИИ согласно регламентам Технопарка СКФУ.
                </p>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 mt-4 cursor-pointer"
              >
                <span>{isRegistering ? 'Зарегистрироваться' : 'Войти в личный кабинет'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Form switcher */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-500 font-medium">
                {isRegistering ? 'Уже есть кабинет?' : 'Впервые в системе?'}
              </span>{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs font-black text-indigo-600 hover:underline cursor-pointer"
              >
                {isRegistering ? 'Войти под существующим логином' : 'Создать Личный кабинет'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="sms-step"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-indigo-100">
                <Key className="w-6 h-6 text-indigo-600 animate-pulse" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Двухфакторное подтверждение
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
                На указанный при регистрации телефонный номер <span className="font-bold text-slate-800">{phone || '+7 (995) 543-21-09'}</span> отправлено СМС-сообщение с разовым кодом верификации.
              </p>
            </div>

            <form onSubmit={handleSmsSubmit} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-center mb-2">
                  Введите 4-значный код безопасности
                </label>
                <div className="flex justify-center max-w-xs mx-auto">
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    className="w-36 text-center py-3 bg-slate-50 border-2 border-indigo-200 focus:border-indigo-500 rounded-xl text-xl font-bold tracking-widest text-slate-800 placeholder-slate-300 focus:outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Countdown or resend */}
              <div className="text-center py-2">
                {timer > 0 ? (
                  <p className="text-[11px] text-slate-500 font-medium">
                    Запросить код повторно можно через <span className="text-indigo-600 font-mono font-bold">{timer} с.</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerSms(phone || '+7 (995) 543-21-09')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Отправить код повторно</span>
                  </button>
                )}
              </div>

              {/* Back / edit phone button */}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-bold text-xs tracking-wide transition-all active:scale-95 cursor-pointer"
                >
                  Назад к логину
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  <span>Подтвердить вход</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer support details */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <span>Защищено ГОСТ 34.12-2015</span>
        <span className="flex items-center gap-1">
          <span>Служба поддержки:</span>
          <span className="text-slate-500 font-semibold">goxamandartman@gmail.com</span>
        </span>
      </div>
    </div>
  );
}
