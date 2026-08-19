(() => {
  'use strict';

  const charts = document.querySelectorAll('[data-donut]');
  if (!charts.length) return;

  charts.forEach((chart) => {
    const svg = chart.querySelector('.donut-svg');
    const centre = chart.querySelector('.donut-centre');
    if (!svg) return;

    const bands = Array.from(svg.querySelectorAll('.donut-seg'));
    const callouts = Array.from(svg.querySelectorAll('.donut-callout'));
    if (!bands.length) return;

    const restingShare = centre ? centre.textContent : '';

    const clear = () => {
      chart.removeAttribute('data-hover');
      bands.forEach((b) => b.removeAttribute('data-hot'));
      callouts.forEach((c) => c.removeAttribute('data-hot'));
      if (centre) centre.textContent = restingShare;
    };

    const hold = (index) => {
      chart.setAttribute('data-hover', '');
      bands.forEach((b) => b.toggleAttribute('data-hot', b.dataset.seg === index));
      callouts.forEach((c) => c.toggleAttribute('data-hot', c.dataset.seg === index));
      if (centre) {
        const band = bands.find((b) => b.dataset.seg === index);
        if (band && band.dataset.display) centre.textContent = band.dataset.display;
      }
    };

    svg.addEventListener('pointerover', (event) => {
      const target = event.target.closest('.donut-seg, .donut-callout');
      if (target && target.dataset.seg != null) hold(target.dataset.seg);
      else clear();
    });

    svg.addEventListener('pointerleave', clear);

    document.addEventListener('pointerdown', (event) => {
      if (!svg.contains(event.target)) clear();
    });
  });
})();
