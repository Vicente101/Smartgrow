import React from 'react';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from '../icons';

export default function WeatherGlyph({ code = 0, size = 24, className = '' }) {
    const props = { size, weight: 'LineDuotone', className };
    if (code === 0) return <Sun {...props} />;
    if ([1, 2].includes(code)) return <CloudSun {...props} />;
    if (code === 3) return <Cloud {...props} />;
    if ([45, 48].includes(code)) return <CloudFog {...props} />;
    if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow {...props} />;
    if ([95, 96, 99].includes(code)) return <CloudLightning {...props} />;
    return <CloudRain {...props} />;
}
