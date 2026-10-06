(() => {
  const root = document.querySelector('.hire-me');
  if (!root) return;

  const canAnimate = 'IntersectionObserver' in window
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const parseCount = (text) => {
    const match = text.trim().match(/^(\D*?)([\d,]*\.?\d+)(\D*)$/);
    if (!match) return null;
    const digits = match[2];
    return {
      prefix: match[1],
      value: parseFloat(digits.replace(/,/g, '')),
      decimals: (digits.split('.')[1] || '').length,
      grouped: digits.includes(','),
      suffix: match[3],
    };
  };

  const formatCount = (count, value) => {
    const [whole, fraction] = value.toFixed(count.decimals).split('.');
    const digits = count.grouped ? Number(whole).toLocaleString('en-US') : whole;
    return `${count.prefix}${digits}${fraction ? `.${fraction}` : ''}${count.suffix}`;
  };

  const countUp = (el, count) => {
    const duration = 1100;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatCount(count, count.value * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (canAnimate) {
    root.classList.add('hm-anim');

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    root.querySelectorAll('.hm-reveal').forEach((el) => {
      const siblings = [...el.parentElement.children].filter((child) => child.classList.contains('hm-reveal'));
      el.style.setProperty('--hm-delay', `${Math.min(siblings.indexOf(el), 5) * 70}ms`);
      revealObserver.observe(el);
    });

    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countObserver.unobserve(entry.target);
        countUp(entry.target, entry.target._count);
      });
    }, { threshold: 0.6 });

    root.querySelectorAll('[data-count]').forEach((el) => {
      const count = parseCount(el.textContent);
      if (!count) return;
      el._count = count;
      el.textContent = formatCount(count, 0);
      countObserver.observe(el);
    });
  }

  const pill = root.querySelector('[data-hm-pill]');
  const hero = root.querySelector('[data-hm-hero]');
  const cta = root.querySelector('[data-hm-cta]');
  if (pill && hero && cta && 'IntersectionObserver' in window) {
    let heroVisible = true;
    let ctaVisible = false;
    const updatePill = () => {
      const show = !heroVisible && !ctaVisible;
      pill.classList.toggle('is-visible', show);
      pill.toggleAttribute('inert', !show);
    };
    pill.hidden = false;
    updatePill();
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      updatePill();
    }).observe(hero);
    new IntersectionObserver(([entry]) => {
      ctaVisible = entry.isIntersecting;
      updatePill();
    }).observe(cta);
  }

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {}
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    if (!ok) throw new Error('copy failed');
  };

  const tip = document.createElement('div');
  tip.className = 'hm-tip';
  tip.id = 'hm-tip';
  tip.setAttribute('role', 'tooltip');
  root.appendChild(tip);

  const live = document.createElement('div');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  root.appendChild(live);

  const tipData = new WeakMap();
  const scrubs = new WeakMap();
  const rovers = new WeakMap();
  let shown = { host: null, data: null, kind: undefined };
  let anchor = null;
  let tipSize = { width: 0, height: 0 };

  const readTip = (el) => {
    if (!tipData.has(el)) {
      try {
        tipData.set(el, JSON.parse(el.dataset.tip));
      } catch {
        tipData.set(el, null);
      }
    }
    return tipData.get(el);
  };

  const summarize = (data) => {
    const rows = (data.rows || []).map((row) => `${row.l} ${row.v}${row.p ? ` (${row.p})` : ''}`).join(', ');
    return [data.title, data.sub, rows, data.note].filter(Boolean).join('. ');
  };

  const line = (cls, text) => {
    const node = document.createElement('p');
    node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const fillTip = (data, activeKind) => {
    tip.textContent = '';
    tip.appendChild(line('hm-tip__title', data.title));
    if (data.sub) tip.appendChild(line('hm-tip__sub', data.sub));
    (data.rows || []).forEach((row) => {
      const item = line('hm-tip__row');
      if (row.k) {
        const dot = document.createElement('i');
        dot.dataset.kind = row.k;
        item.appendChild(dot);
        if (row.k === activeKind) item.classList.add('is-active');
      }
      const label = document.createElement('span');
      label.className = 'hm-tip__label';
      label.textContent = row.l;
      const value = document.createElement('span');
      value.className = 'hm-tip__value';
      value.textContent = row.v;
      item.appendChild(label);
      item.appendChild(value);
      if (row.p) {
        const pct = document.createElement('span');
        pct.className = 'hm-tip__pct';
        pct.textContent = row.p;
        item.appendChild(pct);
      }
      tip.appendChild(item);
    });
    if (data.note) tip.appendChild(line('hm-tip__note', data.note));
    const box = tip.getBoundingClientRect();
    tipSize = { width: box.width, height: box.height };
  };

  const placeTip = (x, y) => {
    const gap = 14;
    const edge = 12;
    let left = x + gap;
    let top = y + gap + 4;
    if (left + tipSize.width > window.innerWidth - edge) left = x - tipSize.width - gap;
    if (top + tipSize.height > window.innerHeight - edge) top = y - tipSize.height - gap;
    left = Math.max(edge, left);
    top = Math.max(edge, top);
    tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  };

  const clearScrub = () => {
    if (shown.host && scrubs.has(shown.host)) shown.host.classList.remove('is-scrubbing');
  };

  const showTip = (host, data, x, y, activeKind) => {
    if (shown.host !== host) {
      clearScrub();
      if (shown.host) shown.host.removeAttribute('aria-describedby');
      host.setAttribute('aria-describedby', 'hm-tip');
    }
    if (shown.data !== data || shown.kind !== activeKind) fillTip(data, activeKind);
    shown = { host, data, kind: activeKind };
    tip.classList.add('is-on');
    placeTip(x, y);
  };

  const clearCurrent = () => {
    root.querySelectorAll('.hm-pair.is-current').forEach((row) => row.classList.remove('is-current'));
  };

  const hideTip = () => {
    if (!tip.classList.contains('is-on')) return;
    tip.classList.remove('is-on');
    if (shown.host) shown.host.removeAttribute('aria-describedby');
    clearScrub();
    anchor = null;
    shown = { host: null, data: null, kind: undefined };
  };

  const formatNumber = (value) => value.toLocaleString('en-US');

  const setupScrub = (chart) => {
    const weekly = chart.dataset.weekly.split(',').map(Number);
    const total = [];
    weekly.reduce((sum, value, index) => {
      total[index] = sum + value;
      return total[index];
    }, 0);
    const guide = document.createElement('div');
    guide.className = 'hm-chart__guide';
    const dot = document.createElement('div');
    dot.className = 'hm-chart__dot';
    chart.appendChild(guide);
    chart.appendChild(dot);
    chart.tabIndex = 0;
    scrubs.set(chart, {
      weekly,
      total,
      guide,
      dot,
      frames: [],
      drawn: -1,
      max: Math.max(...weekly),
      start: new Date(`${chart.dataset.start}T00:00:00Z`),
      index: weekly.length - 1,
    });
  };

  const frameFor = (state, index) => {
    if (!state.frames[index]) {
      const week = new Date(state.start.getTime() + index * 7 * 86400000);
      const label = week.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
      state.frames[index] = {
        title: `Week of ${label}`,
        rows: [
          { l: 'Downloads that week', v: formatNumber(state.weekly[index]) },
          { l: 'All time by then', v: formatNumber(state.total[index]) },
        ],
      };
    }
    return state.frames[index];
  };

  const scrubTo = (chart, index, pointer, spoken) => {
    const state = scrubs.get(chart);
    const last = state.weekly.length - 1;
    state.index = Math.min(last, Math.max(0, index));
    const left = (state.index / last) * 100;
    const top = 88 - (state.weekly[state.index] / state.max) * 78;
    if (state.drawn !== state.index) {
      state.guide.style.left = `${left}%`;
      state.dot.style.left = `${left}%`;
      state.dot.style.top = `${top}%`;
      state.drawn = state.index;
    }
    chart.classList.add('is-scrubbing');
    let point = pointer;
    if (!point) {
      anchor = () => {
        const box = chart.getBoundingClientRect();
        return { x: box.left + (left / 100) * box.width, y: box.top + (top / 100) * box.height };
      };
      point = anchor();
    } else {
      anchor = null;
    }
    const frame = frameFor(state, state.index);
    showTip(chart, frame, point.x, point.y);
    if (spoken) live.textContent = summarize(frame);
  };

  const scrubFromPointer = (chart, clientX, clientY) => {
    const box = chart.getBoundingClientRect();
    const state = scrubs.get(chart);
    const ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    scrubTo(chart, Math.round(ratio * (state.weekly.length - 1)), { x: clientX, y: clientY });
  };

  const groupLabel = (group) => {
    const owner = group.closest('.hm-reachgroup, .hm-figure');
    const heading = owner && owner.querySelector('.hm-reachgroup__label, .hm-h3, h3');
    return heading ? heading.textContent.trim().replace(/\s+/g, ' ') : 'Chart';
  };

  const setupRover = (group) => {
    group.dataset.tipGroup = '';
    group.tabIndex = 0;
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', `${groupLabel(group)}, use the arrow keys to move between items`);
    rovers.set(group, { rows: [...group.querySelectorAll('[data-tip]')], index: 0 });
  };

  const focusRow = (group, index) => {
    const rover = rovers.get(group);
    rover.index = Math.min(rover.rows.length - 1, Math.max(0, index));
    const row = rover.rows[rover.index];
    const data = readTip(row);
    clearCurrent();
    row.classList.add('is-current');
    if (!data) return;
    row.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    anchor = () => {
      const box = row.getBoundingClientRect();
      return { x: box.left + 24, y: box.bottom - 8 };
    };
    const point = anchor();
    showTip(row, data, point.x, point.y);
    live.textContent = summarize(data);
  };

  root.querySelectorAll('[data-hm-scrub]').forEach(setupScrub);
  root.querySelectorAll('.hm-pairs').forEach((group) => {
    if (group.querySelector('[data-tip]')) setupRover(group);
  });

  const handlePointer = (event) => {
    anchor = null;
    const chart = event.target.closest('[data-hm-scrub]');
    if (chart) {
      scrubFromPointer(chart, event.clientX, event.clientY);
      return;
    }
    const host = event.target.closest('[data-tip]');
    const data = host && readTip(host);
    if (!data) {
      hideTip();
      return;
    }
    const kind = event.target.closest('[data-kind]');
    showTip(host, data, event.clientX, event.clientY, kind ? kind.dataset.kind : undefined);
  };

  root.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'touch') handlePointer(event);
  });
  root.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') handlePointer(event);
  });
  root.addEventListener('pointerover', (event) => {
    if (event.target.tagName === 'IFRAME') hideTip();
  });
  root.addEventListener('pointerleave', hideTip);
  window.addEventListener('scroll', () => {
    if (!tip.classList.contains('is-on')) return;
    if (!anchor) {
      hideTip();
      return;
    }
    const point = anchor();
    placeTip(point.x, point.y);
  }, { passive: true });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    hideTip();
    clearCurrent();
  });

  root.addEventListener('focusin', (event) => {
    if (!event.target.matches(':focus-visible')) return;
    const chart = event.target.closest('[data-hm-scrub]');
    if (chart && event.target === chart) {
      scrubTo(chart, scrubs.get(chart).index, null, true);
      return;
    }
    const group = event.target.closest('[data-tip-group]');
    if (!group) return;
    const rover = rovers.get(group);
    const row = event.target === group ? rover.rows[rover.index] : event.target.closest('[data-tip]');
    if (row) focusRow(group, rover.rows.indexOf(row));
  });
  root.addEventListener('focusout', () => {
    hideTip();
    clearCurrent();
  });
  root.addEventListener('keydown', (event) => {
    const chart = event.target.closest('[data-hm-scrub]');
    if (chart && event.target === chart) {
      const state = scrubs.get(chart);
      const steps = { ArrowLeft: -1, ArrowRight: 1, PageDown: -13, PageUp: 13 };
      let next = null;
      if (event.key in steps) next = state.index + steps[event.key];
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = state.weekly.length - 1;
      if (next === null) return;
      event.preventDefault();
      scrubTo(chart, next, null, true);
      return;
    }
    const group = event.target.closest('[data-tip-group]');
    if (!group || event.target !== group) return;
    const rover = rovers.get(group);
    const moves = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let next = null;
    if (event.key in moves) next = rover.index + moves[event.key];
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = rover.rows.length - 1;
    if (next === null) return;
    event.preventDefault();
    focusRow(group, next);
  });

  const status = root.querySelector('[data-hm-copy-status]');
  root.querySelectorAll('[data-hm-copy]').forEach((button) => {
    const label = button.textContent;
    let timer = 0;
    button.addEventListener('click', async () => {
      try {
        await copyText(button.dataset.hmCopy);
      } catch {
        window.location.href = `mailto:${button.dataset.hmCopy}`;
        return;
      }
      button.textContent = button.dataset.copied;
      if (status) status.textContent = `${button.dataset.copied}: ${button.dataset.hmCopy}`;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        button.textContent = label;
      }, 1800);
    });
  });
})();
