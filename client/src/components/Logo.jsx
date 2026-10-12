// FixMate logo: the green house mark + "FM" in Leckerli One (as in the Figma footer).
// If you export the real logo image from Figma, save it as client/public/logo.png and it replaces this drawing automatically.
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function LogoMark({ size = 44 }) {
  const [useImage, setUseImage] = useState(true);
  if (useImage) {
    return <img src="/logo.png" width={size * 1.6} height={size} alt="" style={{ objectFit: 'contain' }} onError={() => setUseImage(false)} />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M4 24 24 7l20 17" fill="none" stroke="#2c4b38" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22v17h30V22" fill="#2c4b38" />
      <rect x="14" y="26" width="5" height="5" rx="1" fill="#fbf7f1" />
      <rect x="29" y="26" width="5" height="5" rx="1" fill="#fbf7f1" />
      <path d="M21 39v-9h6v9z" fill="#fbf7f1" />
      <path d="M2 40c3-1 5-4 5-8M46 40c-3-1-5-4-5-8" fill="none" stroke="#6f915b" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ to = '/', showText = true }) {
  return (
    <Link to={to} className="logo" aria-label="FixMate home">
      <LogoMark />
      {showText && (
        <span className="logo__text">
          <span className="logo__fm">FM</span>
          <span className="logo__name">FixMate</span>
        </span>
      )}
    </Link>
  );
}
