// Phase 21 (cable robot build-along) widgets. "cablebot" embeds Lab 05 inline in a lesson; the 3D view loads on demand.
import { Plot, frame, slider, toggle, h, C } from './plot.js';
import { cableLab } from '../labs/cableLab.js';

const W = {};
let n = 0;
W.cablebot = (el, args) => { el.classList.add('widget'); cableLab(el, { embedded: true, id: `cable-w${++n}`, preset: args.preset || 'room' }); };
export default W;
void Plot; void frame; void slider; void toggle; void h; void C;
