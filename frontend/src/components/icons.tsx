/**
 * Íconos flat de línea del prototipo (24px grid, trazo 2px, puntas redondeadas).
 * Se definen una vez como <symbol> y se usan con <Ic name="cart" />.
 */

export function IconDefs() {
  return (
    <svg style={{ display: 'none' }} aria-hidden="true">
      <symbol id="i-home" viewBox="0 0 24 24"><path d="M3 11l9-8 9 8" /><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" /></symbol>
      <symbol id="i-heart" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M12 21s-7.5-4.6-9.8-9C.7 8.9 2.3 5 6 5c2.2 0 3.6 1.2 6 3.6C14.4 6.2 15.8 5 18 5c3.7 0 5.3 3.9 3.8 7-2.3 4.4-9.8 9-9.8 9z" /></symbol>
      <symbol id="i-plane" viewBox="0 0 24 24"><path d="M21 3L10 14" /><path d="M21 3l-6.5 18-3.5-7.5L3 10z" /></symbol>
      <symbol id="i-leaf" viewBox="0 0 24 24"><path d="M12 20v-7" /><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6z" /><path d="M12 13c0-3-2.5-5-6-5 0 3.5 2.5 5 6 5z" /></symbol>
      <symbol id="i-hand" viewBox="0 0 24 24"><path d="M9.4 12V6.4a1.4 1.4 0 0 1 2.8 0V11" /><path d="M12.2 11V5a1.4 1.4 0 0 1 2.8 0v6" /><path d="M15 11.2V6.2a1.4 1.4 0 0 1 2.8 0v7.2" /><path d="M17.8 12.7l.9-.9a1.35 1.35 0 0 1 1.9 1.9l-2.9 3.8a6 6 0 0 1-4.8 2.4c-2.7 0-4-1.3-5.2-3.5l-1.3-2.5a1.35 1.35 0 0 1 2.3-1.3l.8 1.3" /><path d="M4.4 4.6C3.5 5.6 3.3 7 3.8 8.2M7.2 2.8c-.6.9-.7 2-.4 3" /></symbol>
      <symbol id="i-bell" viewBox="0 0 24 24"><path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" /><path d="M10 20a2 2 0 0 0 4 0" /></symbol>
      <symbol id="i-coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v10M15 9.3c-.6-.9-1.7-1.4-3-1.4-1.7 0-3 .9-3 2.1 0 3 6 1.4 6 4.3 0 1.2-1.3 2.1-3 2.1-1.3 0-2.4-.5-3-1.4" /></symbol>
      <symbol id="i-cart" viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M3 4h2l2.4 11h10.2L20 8H6" /></symbol>
      <symbol id="i-coffee" viewBox="0 0 24 24"><path d="M4 9h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" /><path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2" /><path d="M7.5 5.5c0-1 .8-1 .8-2M11.5 5.5c0-1 .8-1 .8-2" /></symbol>
      <symbol id="i-drop" viewBox="0 0 24 24"><path d="M12 3s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11z" /></symbol>
      <symbol id="i-wifi" viewBox="0 0 24 24"><path d="M4 10a12 12 0 0 1 16 0" /><path d="M7.5 13.5a7 7 0 0 1 9 0" /><circle cx="12" cy="17.5" r="1.4" fill="currentColor" stroke="none" /></symbol>
      <symbol id="i-wrench" viewBox="0 0 24 24"><path d="M14.5 6.5a4.5 4.5 0 0 0-6 5.6L3 17.6 6.4 21l5.5-5.5a4.5 4.5 0 0 0 5.6-6l-3 3-2.5-.5-.5-2.5z" /></symbol>
      <symbol id="i-pizza" viewBox="0 0 24 24"><path d="M4 6c5-2.5 11-2.5 16 0L12 21z" /><circle cx="10" cy="9" r="1" fill="currentColor" stroke="none" /><circle cx="14" cy="10" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="13.5" r="1" fill="currentColor" stroke="none" /></symbol>
      <symbol id="i-sofa" viewBox="0 0 24 24"><path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" /><path d="M3 13a2 2 0 0 1 4 0v1h10v-1a2 2 0 0 1 4 0v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M6 18v2M18 18v2" /></symbol>
      <symbol id="i-car" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="6" rx="2" /><path d="M6 11l1.6-4h8.8L18 11" /><circle cx="7.5" cy="17" r="1.5" /><circle cx="16.5" cy="17" r="1.5" /></symbol>
      <symbol id="i-music" viewBox="0 0 24 24"><path d="M9 18V5l10-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></symbol>
      <symbol id="i-camera" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M9 7l1.2-2.4h3.6L15 7" /><circle cx="12" cy="13" r="3.5" /></symbol>
      <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></symbol>
      <symbol id="i-transfer" viewBox="0 0 24 24"><path d="M4 8h13l-3-3M20 16H7l3 3" /></symbol>
      <symbol id="i-cash" viewBox="0 0 24 24"><rect x="2.5" y="7" width="19" height="10" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 12h.01M18 12h.01" /></symbol>
      <symbol id="i-burst" viewBox="0 0 24 24"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></symbol>
      <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.2" /></symbol>
      <symbol id="i-wave" viewBox="0 0 24 24"><path d="M3 9c2.5-4 5-4 7.5 0s5 4 7.5 0M3 16c2.5-4 5-4 7.5 0s5 4 7.5 0" /></symbol>
      <symbol id="i-trend" viewBox="0 0 24 24"><path d="M3 7l6 6 4-4 8 8" /><path d="M21 12v5h-5" /></symbol>
      <symbol id="i-doc" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9.5 12h5M9.5 16h5" /></symbol>
      <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" /></symbol>
      <symbol id="i-moon" viewBox="0 0 24 24"><path d="M20 13.5A8 8 0 1 1 10.5 4 6.5 6.5 0 0 0 20 13.5z" /></symbol>
      <symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></symbol>
      <symbol id="i-repeat" viewBox="0 0 24 24"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></symbol>
    </svg>
  );
}

export function Ic({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={`ic ${className ?? ''}`} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}
