import React from 'react';

interface SvgProps {
  size?: number;
  className?: string;
}

/**
 * All icons and illustrations are custom hand-drawn inline SVGs using
 * consistent 2.5px ink strokes, round caps, and slight irregularity (Section 7).
 * Zero external icon packs, zero emojis.
 */

export function CheckNavGlyph({ size = 24, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M4.5 5.2 L23.2 4.8 L22.8 23.1 L4.9 23.5 Z"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 14.3 L12.8 18.1 L19.4 10.2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RescueNavGlyph({ size = 24, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M14.2 3.8 C19.9 3.6 24.3 8.4 24.1 14.1 C23.9 19.8 19.6 24.2 13.8 24.1 C8.1 24.0 3.9 19.5 4.0 13.9 C4.1 8.2 8.4 4.0 14.2 3.8 Z"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M14 9.2 L14.2 14.6 L18.3 16.8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AlertsNavGlyph({ size = 24, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M14.1 4.2 L24.2 22.6 L3.8 22.9 Z"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 10.4 L14.1 16.2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="14.1" cy="19.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function MicGlyph({ size = 26, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="10.2"
        y="3.8"
        width="7.6"
        height="12.8"
        rx="3.6"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <path
        d="M6.8 13.5 C6.9 18.2 10.1 20.8 14 20.8 C17.9 20.8 21.2 18.1 21.3 13.4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M14 20.9 L14 24.5 M10.2 24.5 L17.9 24.4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CameraGlyph({ size = 22, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M4.2 9.4 L9.2 9.2 L10.8 6.2 L17.3 6.3 L18.9 9.2 L23.8 9.4 L23.6 21.8 L4.4 22.0 Z"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="15.3" r="3.8" stroke="currentColor" strokeWidth="2.3" />
    </svg>
  );
}

export function PasteGlyph({ size = 22, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M9.8 5.2 L18.2 5.1 L18.1 8.4 L9.9 8.5 Z"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.6 6.8 L6.2 7.0 L6.4 23.6 L21.7 23.4 L21.5 6.9 L18.4 6.8"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.1 13.4 L17.8 13.2 M10.2 17.6 L16.2 17.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SpeakerGlyph({ size = 22, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M5.2 11.2 L10.1 11.1 L15.8 6.4 L15.7 21.6 L10.1 16.9 L5.3 16.8 Z"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.3 10.6 C20.8 12.1 20.9 15.8 19.2 17.4"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M22.2 8.1 C24.6 10.8 24.5 17.2 22.1 19.9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ShareGlyph({ size = 22, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="20.2" cy="7.2" r="2.8" stroke="currentColor" strokeWidth="2.3" />
      <circle cx="7.8" cy="14.1" r="2.8" stroke="currentColor" strokeWidth="2.3" />
      <circle cx="20.1" cy="20.8" r="2.8" stroke="currentColor" strokeWidth="2.3" />
      <path
        d="M10.4 12.7 L17.6 8.6 M10.5 15.4 L17.5 19.4"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PhoneGlyph({ size = 22, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M7.2 5.4 L11.1 5.6 L12.4 10.3 L9.9 12.2 C11.2 14.9 13.2 16.9 15.9 18.2 L17.8 15.7 L22.6 17.1 L22.4 21.1 C22.2 22.4 20.8 23.2 19.2 23.0 C12.1 22.1 6.1 16.0 5.3 8.9 C5.1 7.2 5.9 5.6 7.2 5.4 Z"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GlobeGlyph({ size = 20, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="14"
        cy="14"
        r="9.8"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M4.6 14.1 L23.4 13.9"
        stroke="currentColor"
        strokeWidth="2.0"
        strokeLinecap="round"
      />
      <path
        d="M14.1 4.2 C17.4 7.4 17.5 20.6 14.0 23.8 C10.6 20.6 10.7 7.4 14.1 4.2 Z"
        stroke="currentColor"
        strokeWidth="2.0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlayGlyph({ size = 20, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8.2 5.8 L22.2 14.1 L8.0 22.3 Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PauseGlyph({ size = 20, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M9.4 6.2 L9.2 21.8 M18.6 6.4 L18.8 21.7"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StopGlyph({ size = 20, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M7.2 7.4 L20.8 7.1 L20.6 20.7 L7.4 20.9 Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReplayGlyph({ size = 20, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M7.6 10.6 C9.1 7.2 12.6 5.2 16.4 5.7 C20.8 6.3 23.8 10.4 23.1 14.9 C22.5 19.3 18.4 22.4 13.9 21.8 C10.4 21.3 7.6 18.6 6.9 15.2"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M6.4 5.8 L7.4 11.2 L12.6 9.8"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UploadGlyph({ size = 22, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M14.1 18.6 L14.0 6.2 M9.2 10.8 L14.0 5.9 L18.9 10.7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.4 17.6 L5.6 22.4 L22.5 22.2 L22.6 17.5"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TickMark({ size = 24, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M5.4 14.6 L11.2 20.6 L22.8 7.6"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrossMark({ size = 24, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M6.8 6.5 L21.4 21.2 M21.2 6.7 L6.6 21.4"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function QuestionMark({ size = 24, className }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M9.6 10.2 C9.8 6.8 12.1 5.2 14.7 5.3 C17.5 5.4 19.4 7.3 19.2 9.8 C19.0 12.4 16.5 13.4 14.7 14.8 C14.1 15.3 14.0 16.1 14.0 17.3"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <circle cx="14.1" cy="21.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

/**
 * Hand-drawn crossed-out link drawing next to "లింక్‌ను ఓపెన్ చేయకండి. కాపీ చేసి ఇక్కడ పేస్ట్ చేయండి."
 */
export function CrossedLinkDrawing({ className }: { className?: string }) {
  return (
    <svg
      width="58"
      height="36"
      viewBox="0 0 58 36"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M11 21 C7 21 5 18 5 15 C5 12 7.5 9.5 11.5 9.5 L23 9.7 C26.5 9.8 29 12 29 15"
        stroke="#16202A"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M47 15 C51 15 53 18 53 21 C53 24 50.5 26.5 46.5 26.5 L35 26.3 C31.5 26.2 29 24 29 21"
        stroke="#16202A"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M21 18 L37 17.8"
        stroke="#16202A"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Hand-drawn red cross-out diagonal stroke */}
      <path
        d="M8 31 L50 5"
        stroke="#B3261E"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Six hand-drawn ink illustrations for the Learn page scam pattern panels (Section 4 S5 & Section 7).
 */
export function PatternIllustration({
  kind,
}: {
  kind: 'apk' | 'otp' | 'fee' | 'lookalike' | 'forward' | 'cyclone';
}) {
  switch (kind) {
    case 'apk':
      return (
        <svg width="96" height="84" viewBox="0 0 96 84" fill="none" aria-hidden="true">
          <rect x="24" y="8" width="44" height="68" rx="3" stroke="#16202A" strokeWidth="2.5" />
          <line x1="34" y1="16" x2="58" y2="16" stroke="#4A5560" strokeWidth="2" strokeLinecap="round" />
          <rect x="31" y="25" width="30" height="22" fill="#F8DEDA" stroke="#B3261E" strokeWidth="2" />
          <text x="46" y="40" textAnchor="middle" fill="#B3261E" fontSize="11" fontFamily="IBM Plex Mono, monospace" fontWeight="500">.APK</text>
          <path d="M46 52 L46 64 M41 59 L46 64 L51 59" stroke="#16202A" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 70 L76 14" stroke="#B3261E" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );
    case 'otp':
      return (
        <svg width="96" height="84" viewBox="0 0 96 84" fill="none" aria-hidden="true">
          <path d="M16 24 L26 24 L29 36 L23 41 C26 48 31 53 38 56 L43 50 L55 53 L55 63 C54 67 49 69 44 68 C26 65 13 50 11 33 C11 28 13 24 16 24 Z" stroke="#16202A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="48" y="14" width="38" height="26" fill="#FBEBC8" stroke="#16202A" strokeWidth="2.3" />
          <text x="67" y="31" textAnchor="middle" fill="#16202A" fontSize="11" fontFamily="IBM Plex Mono, monospace" fontWeight="500">OTP?</text>
          <path d="M52 46 L82 10" stroke="#B3261E" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'fee':
      return (
        <svg width="96" height="84" viewBox="0 0 96 84" fill="none" aria-hidden="true">
          <rect x="14" y="14" width="36" height="36" stroke="#16202A" strokeWidth="2.4" />
          <rect x="20" y="20" width="9" height="9" fill="#16202A" />
          <rect x="35" y="20" width="9" height="9" fill="#16202A" />
          <rect x="20" y="35" width="9" height="9" fill="#16202A" />
          <path d="M56 32 L78 32 M71 25 L79 32 L71 39" stroke="#B3261E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="67" y="64" textAnchor="middle" fill="#16202A" fontSize="22" fontFamily="IBM Plex Mono, monospace" fontWeight="500">₹199</text>
        </svg>
      );
    case 'lookalike':
      return (
        <svg width="96" height="84" viewBox="0 0 96 84" fill="none" aria-hidden="true">
          <rect x="8" y="18" width="80" height="46" stroke="#16202A" strokeWidth="2.4" fill="#FBFBF8" />
          <line x1="8" y1="30" x2="88" y2="30" stroke="#C9CEC4" strokeWidth="2" />
          <rect x="52" y="38" width="30" height="16" fill="#FFD84D" />
          <text x="14" y="50" fill="#4A5560" fontSize="11" fontFamily="IBM Plex Mono, monospace">gov.in.</text>
          <text x="55" y="50" fill="#16202A" fontSize="11" fontFamily="IBM Plex Mono, monospace" fontWeight="500">xyz</text>
        </svg>
      );
    case 'forward':
      return (
        <svg width="96" height="84" viewBox="0 0 96 84" fill="none" aria-hidden="true">
          <circle cx="20" cy="42" r="9" stroke="#16202A" strokeWidth="2.4" />
          <circle cx="72" cy="18" r="8" stroke="#16202A" strokeWidth="2.4" />
          <circle cx="76" cy="42" r="8" stroke="#16202A" strokeWidth="2.4" />
          <circle cx="72" cy="66" r="8" stroke="#16202A" strokeWidth="2.4" />
          <path d="M29 38 L63 21 M30 42 L66 42 M29 46 L63 63" stroke="#16202A" strokeWidth="2.2" strokeLinecap="round" />
          <text x="45" y="16" fill="#B3261E" fontSize="12" fontFamily="IBM Plex Mono, monospace" fontWeight="500">x20</text>
        </svg>
      );
    case 'cyclone':
      return (
        <svg width="96" height="84" viewBox="0 0 96 84" fill="none" aria-hidden="true">
          <path d="M22 44 C15 44 12 37 16 32 C17 24 27 20 35 24 C40 16 55 16 60 25 C68 25 73 32 70 39 C69 43 65 44 60 44 Z" stroke="#16202A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M28 52 L24 64 M42 52 L38 64 M56 52 L52 64" stroke="#4A5560" strokeWidth="2.3" strokeLinecap="round" />
          <circle cx="74" cy="58" r="13" fill="#FBEBC8" stroke="#8A5300" strokeWidth="2.3" />
          <path d="M74 51 L74 58 L79 61" stroke="#8A5300" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      );
  }
}
