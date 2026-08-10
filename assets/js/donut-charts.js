(() => {
  'use strict';

  /* Hover layer for the {{< donut >}} figures. The chart itself is drawn at
     build time by layouts/shortcodes/donut.html and needs none of this: every
     label and value is already on screen and the shortcode's sr-only line
     speaks the whole table. All this adds is the pairing — point at a band and
     its callout on the outside lifts while the other four drop back, and the
     hole swaps to that band's share.

     The pairing runs on the data-seg index the shortcode stamps on both the
     band and its callout, so the two stay matched no matter which side of the
     ring the callout was laid out on.

     Colour, dimming and the thickened band all live in single.css. This file
     only ever moves two attributes: data-hot on the pair, data-hover on the
     chart. Nothing here reads or writes geometry. */

  const charts = document.querySelectorAll('[data-donut]');
  if (!charts.length) return;

  charts.forEach((chart) => {
    const svg = chart.querySelector('.donut-svg');
    const centre = chart.querySelector('.donut-centre');
    if (!svg) return;

    const bands = Array.from(svg.querySelectorAll('.donut-seg'));
    const callouts = Array.from(svg.querySelectorAll('.donut-callout'));
    if (!bands.length) return;

    /* The share the hole rests on — the first authored row, which is also the
       one the shortcode draws first. Read from the DOM rather than re-derived,
       so the hole and the callout can never disagree. */
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

    /* One listener on the svg rather than one per band. A dashed stroke only
       takes pointer events where it is painted, so the gaps between segments
       and the hole both fall through to the svg and read as "nothing" — which
       is what clears the state. */
    svg.addEventListener('pointerover', (event) => {
      const band = event.target.closest('.donut-seg');
      if (band && band.dataset.seg != null) hold(band.dataset.seg);
      else clear();
    });

    /* pointerleave rather than pointerout: pointerout also fires crossing
       between two bands, which would flicker the figure back to rest between
       every pair of segments. */
    svg.addEventListener('pointerleave', clear);

    /* A touch that lands on a band leaves it held with no pointerleave to
       follow, so the next tap anywhere else lets it go. */
    document.addEventListener('pointerdown', (event) => {
      if (!svg.contains(event.target)) clear();
    });
  });
})();
