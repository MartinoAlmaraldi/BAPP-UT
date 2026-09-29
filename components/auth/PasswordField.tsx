'use client';

import { useState } from 'react';
import { LockIcon, EyeIcon, EyeOffIcon } from './AuthIcons';
import '@/styles/components/auth/field.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function PasswordField({ value, onChange, placeholder = 'Password' }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <span className="field__icon">
        <LockIcon />
      </span>
      <input
        className="field__input"
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        minLength={6}
        autoComplete={placeholder === 'Password' ? 'current-password' : 'new-password'}
      />
      <button
        type="button"
        className="field__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
      >
        {visible ? <EyeIcon /> : <EyeOffIcon />}
      </button>
    </div>
  );
}