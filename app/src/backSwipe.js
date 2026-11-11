/** Swipe right from the left edge to return to the previous screen. */
export const shouldCommitBackSwipe = (distance, width) => distance > Math.min(105, width * .30);

export function installBackSwipe(root, {canStart, homeMarkup, homeScrollY, goBack}) {
  let gesture = null;
  let suppressClickUntil = 0;

  root.addEventListener('pointerdown', event => {
    if (!canStart() || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const shell = root.querySelector('.shell');
    if (!shell || shell.querySelector('.page-motion') || event.target.closest('.bottom-nav')) return;
    const left = shell.getBoundingClientRect().left;
    if (event.clientX < left || event.clientX - left > 32) return;
    const main = shell.querySelector(':scope > main');
    if (!main || !main.querySelector('.workout-screen')) return;
    gesture = {id: event.pointerId, shell, main, x: event.clientX, y: event.clientY,
      dx: 0, started: false, underlay: null};
  });

  root.addEventListener('pointermove', event => {
    const state = gesture;
    if (!state || state.id !== event.pointerId) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    if (!state.started) {
      if (dx < 12 || dx < Math.abs(dy) * 1.3) return;
      state.started = true;
      state.underlay = document.createElement('main');
      state.underlay.className = 'swipe-back-underlay';
      state.underlay.setAttribute('inert', '');
      state.underlay.setAttribute('aria-hidden', 'true');
      state.underlay.innerHTML = homeMarkup();
      state.underlay.style.top = `${window.scrollY - homeScrollY()}px`;
      state.shell.insertBefore(state.underlay, state.main);
      state.main.classList.add('swipe-back-front');
    }
    state.dx = Math.min(Math.max(0, dx), state.shell.clientWidth);
    state.main.style.transform = `translate3d(${state.dx}px,0,0)`;
    if (event.cancelable) event.preventDefault();
  });

  const release = (event, cancelled = false) => {
    const state = gesture;
    if (!state || state.id !== event.pointerId) return;
    gesture = null;
    if (!state.started) return;
    suppressClickUntil = Date.now() + 400;
    const commit = !cancelled && shouldCommitBackSwipe(state.dx, state.shell.clientWidth);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      clearTimeout(fallback);
      if (commit) { goBack(); return; }
      state.main.classList.remove('swipe-back-front');
      state.main.style.removeProperty('transform');
      state.main.style.removeProperty('transition');
      state.underlay?.remove();
    };
    state.main.style.transition = reducedMotion ? 'none' : 'transform .23s cubic-bezier(.2,.72,.22,1)';
    state.main.style.transform = `translate3d(${commit ? state.shell.clientWidth : 0}px,0,0)`;
    const fallback = setTimeout(cleanup, reducedMotion ? 0 : 300);
    state.main.addEventListener('transitionend', e => {if (e.target === state.main) cleanup();}, {once: true});
  };
  root.addEventListener('pointerup', event => release(event));
  root.addEventListener('pointercancel', event => release(event, true));
  return {shouldSuppressClick: () => Date.now() < suppressClickUntil};
}
