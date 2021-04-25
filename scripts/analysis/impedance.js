function getImpedance(hertz, component) {
    const value = component.value;
    const freq = hertz * Math.PI * 2;
    switch (component.type) {
        case COMPONENT_TYPES.RESISTOR: return parseFloat(value);
        case COMPONENT_TYPES.CAPACITOR: return [0, -Math.pow(10, 6) / (value * freq)];
        case COMPONENT_TYPES.INDUCTOR: return [0, Math.pow(10, -3) * value * freq];
        case COMPONENT_TYPES.DIODE: return value ? 1e-100 : Infinity;
        default: return 0;
    }
}