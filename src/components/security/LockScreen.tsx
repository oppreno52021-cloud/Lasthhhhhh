import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Fingerprint, Delete, CheckCircle2, Lock, Clock, LogOut } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { isBiometricsSupported, authenticateWithBiometrics } from '../../utils/biometrics';
import { normalizeArabicNumerals } from '../../utils/calculations';
import { verifyPasscode } from '../../utils/security';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface LockScreenProps {
  onUnlock: () => void;
  savedPasscode?: string;
  biometricEnabled?: boolean;
  pinEnabled?: boolean;
  language?: 'en' | 'ar';
}

export const LockScreen: React.FC<LockScreenProps> = ({
  onUnlock,
  savedPasscode = '123456',
  biometricEnabled = true,
  pinEnabled = true,
  language = 'ar',
}) => {
  useBodyScrollLock(true);

  const [pin, setPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isBiometricChecking, setIsBiometricChecking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(() => {
    if (!pinEnabled && biometricEnabled) {
      return language === 'ar' ? 'المس مستشعر البصمة لفتح التطبيق' : 'Touch fingerprint sensor to unlock';
    }
    if (biometricEnabled) {
      return language === 'ar' ? 'أدخل رمز المرور (6 أرقام) أو استخدم البصمة' : 'Enter 6-digit passcode or use biometrics';
    }
    return language === 'ar' ? 'أدخل رمز المرور (6 أرقام) لفتح التطبيق' : 'Enter 6-digit passcode to unlock';
  });

  const hasAutoPromptedRef = useRef(false);
  const targetPasscode = savedPasscode || '123456';

  const handleExitApp = useCallback(() => {
    try {
      if (Capacitor.isNativePlatform()) {
        CapacitorApp.exitApp();
      } else {
        window.close();
      }
    } catch {
      // ignore
    }
  }, []);

  // Countdown timer for brute-force rate-limiting
  useEffect(() => {
    if (lockoutSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setLockoutSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setStatusMessage(
            biometricEnabled
              ? (language === 'ar' ? 'يمكنك الآن إدخال رمز المرور أو استخدام البصمة' : 'You can now enter passcode or use biometrics')
              : (language === 'ar' ? 'يمكنك الآن إدخال رمز المرور' : 'You can now enter passcode')
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSecondsLeft, biometricEnabled, language]);

  const handleUnlockSuccess = useCallback(() => {
    setIsSuccess(true);
    triggerHaptic('success');
    setFailedAttempts(0);
    setLockoutSecondsLeft(0);
    setStatusMessage(language === 'ar' ? 'تم تأكيد الهوية بنجاح' : 'Authenticated successfully');
    setTimeout(() => {
      onUnlock();
    }, 300);
  }, [language, onUnlock]);

  const [showPinFallback, setShowPinFallback] = useState(false);

  const handleBiometricAuth = useCallback(async () => {
    if (isSuccess) return;
    triggerHaptic('medium');
    setIsBiometricChecking(true);
    setStatusMessage(language === 'ar' ? 'جارٍ المسح بالبصمة...' : 'Scanning biometrics...');

    try {
      const res = await authenticateWithBiometrics();
      setIsBiometricChecking(false);

      if (res.success) {
        handleUnlockSuccess();
      } else if (res.error === 'cancelled_or_denied') {
        // User cancelled or dismissed biometric prompt -> stay on screen, fall back to PIN
        triggerHaptic('light');
        setStatusMessage(
          pinEnabled
            ? (language === 'ar' ? 'أدخل رمز المرور (6 أرقام) للمتابعة' : 'Enter 6-digit passcode to unlock')
            : (language === 'ar' ? 'المس مستشعر البصمة لفتح التطبيق' : 'Touch fingerprint sensor to unlock')
        );
      } else if (res.error === 'lockout') {
        triggerHaptic('error');
        setStatusMessage(
          language === 'ar'
            ? 'تم قفل مستشعر البصمة مؤقتاً بواسطة النظام، استخدم رمز المرور'
            : 'Biometrics temporarily locked by system, use passcode'
        );
      } else {
        // Biometric failed or not matched -> stay on screen, inform user
        triggerHaptic('error');
        setStatusMessage(
          language === 'ar'
            ? 'لم تتطابق البصمة، حاول مرة أخرى' + (pinEnabled ? ' أو استخدم الرمز' : '')
            : 'Biometric not recognized, try again' + (pinEnabled ? ' or use passcode' : '')
        );
      }
    } catch {
      setIsBiometricChecking(false);
      setStatusMessage(
        language === 'ar' 
          ? 'تعذر استخدام البصمة' + (pinEnabled ? '، يرجى إدخال رمز المرور' : '') 
          : 'Biometrics unavailable' + (pinEnabled ? ', enter passcode' : '')
      );
    }
  }, [handleUnlockSuccess, isSuccess, language, pinEnabled]);

  // Auto-prompt biometrics once on mount if enabled
  useEffect(() => {
    if (!biometricEnabled || hasAutoPromptedRef.current) return;
    hasAutoPromptedRef.current = true;

    const timer = setTimeout(() => {
      isBiometricsSupported().then(supported => {
        if (supported) {
          handleBiometricAuth();
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [biometricEnabled, handleBiometricAuth]);

  const handleKeyPress = (digit: string) => {
    if (lockoutSecondsLeft > 0) {
      triggerHaptic('error');
      return;
    }
    if (pin.length >= 6 || isSuccess) return;
    triggerHaptic('light');
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 6) {
      verifyPasscode(newPin, targetPasscode).then(matches => {
        if (matches) {
          handleUnlockSuccess();
        } else {
          triggerHaptic('error');
          setErrorShake(true);
          const nextFails = failedAttempts + 1;
          setFailedAttempts(nextFails);

          if (nextFails >= 5) {
            const lockoutTime = nextFails >= 10 ? 300 : 60;
            setLockoutSecondsLeft(lockoutTime);
            setStatusMessage(
              language === 'ar'
                ? `يرجى الانتظار ${lockoutTime} ثانية`
                : `Please wait ${lockoutTime}s`
            );
          } else {
            setStatusMessage(
              language === 'ar'
                ? 'رمز المرور غير صحيح'
                : 'Incorrect passcode'
            );
          }

          setTimeout(() => {
            setPin('');
            setErrorShake(false);
          }, 500);
        }
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSuccess || lockoutSecondsLeft > 0) return;
      const normalizedKey = normalizeArabicNumerals(e.key);
      if (/^[0-9]$/.test(normalizedKey)) {
        handleKeyPress(normalizedKey);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isSuccess, targetPasscode, lockoutSecondsLeft]);

  const handleDelete = () => {
    if (lockoutSecondsLeft > 0) return;
    if (pin.length === 0 || isSuccess) return;
    triggerHaptic('light');
    setPin(prev => prev.slice(0, -1));
  };

  const isKeypadDisabled = lockoutSecondsLeft > 0 || isSuccess;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-black text-white select-none animate-in fade-in duration-200 overscroll-none touch-none">
      {/* Top Header & Lock Badge */}
      <div className="w-full pt-6 sm:pt-8 flex flex-col items-center text-center space-y-3">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl ${
          isSuccess 
            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 scale-105' 
            : lockoutSecondsLeft > 0
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 animate-pulse'
              : 'bg-zinc-900 border border-zinc-800 text-blue-400'
        }`}>
          {isSuccess ? (
            <CheckCircle2 size={32} className="text-emerald-400" />
          ) : lockoutSecondsLeft > 0 ? (
            <Clock size={30} className="text-amber-400" />
          ) : (
            <Lock size={30} />
          )}
        </div>

        <div>
          <p className="text-xs text-zinc-400 mt-1 min-h-[1.25rem] px-2 font-medium">
            {statusMessage}
          </p>
        </div>

        {/* 6-digit PIN Dots or Lockout Badge (Only when PIN lock is enabled) */}
        {pinEnabled && (
          lockoutSecondsLeft > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold animate-in fade-in">
              <Clock size={14} />
              <span>
                {language === 'ar' ? `متبقي ${lockoutSecondsLeft} ثانية` : `${lockoutSecondsLeft}s remaining`}
              </span>
            </div>
          ) : (
            <div className={`flex items-center gap-3 pt-2 ${errorShake ? 'animate-shake' : ''}`}>
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                    pin.length > idx
                      ? (isSuccess 
                          ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-sm shadow-emerald-400/50' 
                          : errorShake 
                            ? 'bg-rose-500 border-rose-500' 
                            : 'bg-blue-500 border-blue-500 scale-110 shadow-sm shadow-blue-500/50')
                      : 'border-zinc-800 bg-zinc-900/60'
                  }`}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Biometric-only central touch button (When PIN is disabled) */}
      {!pinEnabled && biometricEnabled && (
        <div className="flex flex-col items-center justify-center my-auto space-y-4">
          <button
            type="button"
            onClick={handleBiometricAuth}
            disabled={isBiometricChecking || isSuccess}
            className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-blue-500/50 hover:border-blue-500 active:scale-95 flex items-center justify-center text-blue-400 transition-all cursor-pointer shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20"
          >
            <Fingerprint size={48} className={isBiometricChecking ? 'animate-pulse text-blue-400' : ''} />
          </button>
          <p className="text-xs text-zinc-400 font-medium">
            {language === 'ar' ? 'اضغط للمسح بالبصمة' : 'Tap to scan fingerprint'}
          </p>
        </div>
      )}

      {/* Numeric Keypad (Only when PIN is enabled) */}
      {pinEnabled && (
        <div className="w-full max-w-xs pb-2 space-y-2.5" dir="ltr">
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
            <button
              key={digit}
              type="button"
              disabled={isKeypadDisabled}
              onClick={() => handleKeyPress(digit)}
              className={`h-13 rounded-2xl text-xl font-mono font-bold flex items-center justify-center transition-all select-none border shadow-2xs ${
                isKeypadDisabled
                  ? 'bg-zinc-900/40 text-zinc-600 border-zinc-900 cursor-not-allowed opacity-50'
                  : 'bg-zinc-900 hover:bg-zinc-850 active:bg-blue-600/30 text-white cursor-pointer border-zinc-800 active:scale-95'
              }`}
            >
              {digit}
            </button>
          ))}
          
          {/* Bottom Row: Return to Biometric Icon if available, 0, Backspace */}
          <button
            type="button"
            onClick={() => {
              if (biometricEnabled) {
                handleBiometricAuth();
              }
            }}
            disabled={!biometricEnabled || isSuccess || isBiometricChecking}
            className={`h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer border select-none active:scale-95 ${
              biometricEnabled 
                ? 'bg-zinc-900 hover:bg-zinc-850 text-blue-400 border-zinc-800' 
                : 'opacity-20 cursor-not-allowed border-transparent'
            }`}
            title="Biometrics"
          >
            <Fingerprint size={22} className={isBiometricChecking ? 'animate-pulse' : ''} />
          </button>

          <button
            type="button"
            disabled={isKeypadDisabled}
            onClick={() => handleKeyPress('0')}
            className={`h-13 rounded-2xl text-xl font-mono font-bold flex items-center justify-center transition-all select-none border shadow-2xs ${
              isKeypadDisabled
                ? 'bg-zinc-900/40 text-zinc-600 border-zinc-900 cursor-not-allowed opacity-50'
                : 'bg-zinc-900 hover:bg-zinc-850 active:bg-blue-600/30 text-white cursor-pointer border-zinc-800 active:scale-95'
            }`}
          >
            0
          </button>

          <button
            type="button"
            disabled={isKeypadDisabled}
            onClick={handleDelete}
            className={`h-13 rounded-2xl flex items-center justify-center transition-all select-none border ${
              isKeypadDisabled
                ? 'bg-zinc-900/40 text-zinc-600 border-zinc-900 cursor-not-allowed opacity-50'
                : 'bg-zinc-900 hover:bg-zinc-850 active:scale-95 text-zinc-300 cursor-pointer border-zinc-800'
            }`}
            title="Delete"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
      )}

      {/* Bottom Exit Button */}
      <div className="w-full flex justify-center pb-2">
        <button
          type="button"
          onClick={handleExitApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 text-xs font-semibold border border-zinc-800/80 transition-all cursor-pointer"
        >
          <LogOut size={13} />
          <span>{language === 'ar' ? 'الخروج من التطبيق' : 'Exit App'}</span>
        </button>
      </div>
    </div>
  );
};
