import React from 'react';
import { Sprout } from '../icons';

export default function Brand({ light = false }) {
    return (
        <span className="inline-flex items-center gap-2.5" aria-label="Munda home">
            <Sprout size={29} weight="BoldDuotone" className={light ? 'text-lime-200' : 'text-forest-800'} />
            <span className="leading-none">
                <span className={`block font-display text-[1.05rem] font-extrabold tracking-[-0.04em] ${light ? 'text-white' : 'text-forest-950'}`}>Munda</span>
                <span className={`mt-1 block text-[0.58rem] font-bold uppercase tracking-[0.19em] ${light ? 'text-white/55' : 'text-forest-700/60'}`}>Crop intelligence</span>
            </span>
        </span>
    );
}
