import React, { useState, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

export function SupervisorAccessModal({ open, onClose, onSubmit }: Props) {
  const [pwd, setPwd] = useState('');
  useEffect(() => { if (!open) setPwd(''); }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-3">Введите пароль от почты научного руководителя</h3>
        <input
          type="password"
          className="w-full border rounded p-2 mb-4"
          placeholder="Пароль"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Отмена</button>
          <button className="px-4 py-2 rounded bg-indigo-600 text-white" onClick={() => onSubmit(pwd)}>Войти</button>
        </div>
      </div>
    </div>
  );
}

export default SupervisorAccessModal;
