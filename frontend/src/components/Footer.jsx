export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '.04em' }}>
          MAJESTIC<span style={{ color: 'var(--accent)' }}>CORE</span>
        </span>
        <p>© {new Date().getFullYear()} Majestic Core. All rights reserved.</p>
      </div>
    </footer>
  );
}
