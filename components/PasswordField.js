"use client";

import { useState } from "react";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.7 10.7a3 3 0 0 0 4.2 4.2" />
      <path d="M7.5 7.5C5.7 8.8 4.2 10.6 3 12c1.8 3.5 5.4 7 9 7 1.2 0 2.3-.3 3.3-.8" />
      <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c3.6 0 7.2 3.5 9 7-.8 1.5-2 3-3.5 4.2" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  required = false,
  minLength,
  placeholder,
  disabled = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="form-field" htmlFor={id}>
      <span>{label}</span>
      <div className="password-field">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={onChange}
        />
        <button
          className="password-field__toggle"
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </label>
  );
}
