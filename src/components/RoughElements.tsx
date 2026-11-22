import React, { useEffect, useRef } from 'react';
import rough from 'roughjs';

interface RoughUnderlineProps {
  width?: number;
  color?: string;
}

/**
 * Hand-drawn rough.js underline beneath the wordmark "నిజమా? మోసమా?"
 * Renders client-side with a clean static hand-drawn SVG fallback.
 */
export function RoughUnderline({
  width = 270,
  color = '#16202A',
}: RoughUnderlineProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const rc = rough.svg(svg);
    const line = rc.line(2, 7, width - 4, 5, {
      stroke: color,
      strokeWidth: 2.5,
      roughness: 1.5,
      bowing: 1.4,
      seed: 19,
    });
    svg.appendChild(line);
  }, [width, color]);

  return (
    <svg
      ref={svgRef}
      height={14}
      viewBox={`0 0 ${width} 14`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '14px' }}
    >
      {/* Static fallback path */}
      <path
        d={`M 2 7 Q ${width / 2} 4 ${width - 4} 6`}
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface RoughStampBoxProps {
  color: string;
  bgColor: string;
  children: React.ReactNode;
}

/**
 * Angled (-4deg) rubber-stamp frame rendered with rough.js border
 * and 120ms scale-in animation respecting prefers-reduced-motion.
 */
export function RoughStampBox({ color, bgColor, children }: RoughStampBoxProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    if (!wrap || !svg) return;

    const draw = () => {
      // Measure unrotated layout dimensions so rotate(-4deg) never shrinks the SVG box
      const w = Math.max(140, Math.round(wrap.offsetWidth));
      const h = Math.max(64, Math.round(wrap.offsetHeight));
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const rc = rough.svg(svg);
      const outer = rc.rectangle(3, 3, w - 6, h - 6, {
        stroke: color,
        strokeWidth: 3,
        roughness: 1.6,
        bowing: 1.1,
        fill: bgColor,
        fillStyle: 'solid',
        seed: 42,
      });
      const inner = rc.rectangle(8, 8, w - 16, h - 16, {
        stroke: color,
        strokeWidth: 1.4,
        roughness: 1.2,
        seed: 43,
      });
      svg.appendChild(outer);
      svg.appendChild(inner);
    };

    draw();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(draw) : null;
    ro?.observe(wrap);
    let active = true;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (active) draw();
      });
    }
    return () => {
      active = false;
      ro?.disconnect();
    };
  }, [color, bgColor, children]);

  return (
    <div
      ref={wrapRef}
      className="stampAnimate"
      style={{
        position: 'relative',
        display: 'inline-block',
        maxWidth: '100%',
        transform: 'rotate(-4deg)',
        margin: '12px 0 18px',
      }}
    >
      <svg
        ref={svgRef}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '16px 26px',
          textAlign: 'center',
          color,
        }}
      >
        {children}
      </div>
    </div>
  );
}
