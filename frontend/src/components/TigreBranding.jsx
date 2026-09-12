const LOGO_PATH = '/images/logo.png';

export const TigreLogo = ({ size = 46, variant = 'default' }) => {
  if (variant === 'full') {
    return (
      <div className="d-flex align-items-center gap-3">
        <img
          src={LOGO_PATH}
          alt="Tigre Burger"
          style={{
            width: size,
            height: size,
            borderRadius: 'var(--radius-md)',
            objectFit: 'cover'
          }}
        />
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.5px', color: 'var(--text-primary)', lineHeight: 1.1 }}>
            TIGRE
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--accent)', marginTop: '1px' }}>
            BURGER
          </div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={LOGO_PATH}
      alt="Tigre Burger"
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-md)',
        objectFit: 'cover'
      }}
    />
  );
};

export const ClawMarks = ({ style = {}, className = '' }) => (
  <svg
    className={className}
    style={{ position: 'absolute', pointerEvents: 'none', ...style }}
    width="120"
    height="160"
    viewBox="0 0 120 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g opacity="0.07">
      <path d="M20,0 Q15,60 25,160" stroke="#FF5A00" strokeWidth="8" strokeLinecap="round" />
      <path d="M50,0 Q45,55 55,160" stroke="#FF5A00" strokeWidth="10" strokeLinecap="round" />
      <path d="M80,0 Q75,60 85,160" stroke="#FF5A00" strokeWidth="7" strokeLinecap="round" />
    </g>
  </svg>
);

export const TigerStripes = ({ style = {} }) => (
  <svg
    style={{ position: 'absolute', pointerEvents: 'none', ...style }}
    width="200"
    height="100%"
    viewBox="0 0 200 400"
    preserveAspectRatio="none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g opacity="0.035">
      <path d="M0,0 L60,80 L0,160" fill="#FF5A00" />
      <path d="M80,0 L140,80 L80,160" fill="#FF5A00" />
      <path d="M40,160 L100,240 L40,320" fill="#FF5A00" />
      <path d="M120,160 L180,240 L120,320" fill="#FF5A00" />
      <path d="M20,320 L80,400 L0,400 L0,320" fill="#FF5A00" />
      <path d="M100,320 L160,400 L80,400 L80,320" fill="#FF5A00" />
    </g>
  </svg>
);

export const ClawAccent = ({ direction = 'right', style = {} }) => (
  <svg
    style={{ pointerEvents: 'none', ...style }}
    width="60"
    height="40"
    viewBox="0 0 60 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g opacity="0.15" transform={direction === 'left' ? 'scale(-1,1) translate(-60,0)' : ''}>
      <line x1="0" y1="8" x2="55" y2="5" stroke="#FF5A00" strokeWidth="4" strokeLinecap="round" />
      <line x1="0" y1="20" x2="58" y2="18" stroke="#FF5A00" strokeWidth="5" strokeLinecap="round" />
      <line x1="0" y1="32" x2="52" y2="31" stroke="#FF5A00" strokeWidth="3.5" strokeLinecap="round" />
    </g>
  </svg>
);
