import React, { useState } from 'react';
import { X } from 'lucide-react';

const CarConfigurator = ({ onPartSelect, parts }) => {
    const [selectedPart, setSelectedPart] = useState(null);

    const getZoneForPart = (partName) => {
        if (partName.includes('Front Wing')) return 'Front Wing';
        if (partName.includes('Monocoque') || partName.includes('Chassis')) return 'Monocoque';
        if (partName.includes('Sidepod') || partName.includes('Radiator') || partName.includes('Cooling')) return 'Sidepod';
        if (partName.includes('Floor') || partName.includes('Plank') || partName.includes('Diffuser')) return 'Floor';
        if (partName.includes('Gearbox') || partName.includes('Casing')) return 'Gearbox';
        if (partName.includes('Rear Wing') || partName.includes('DRS')) return 'Rear Wing';
        return null;
    };

    const getZoneStatus = (zoneName) => {
        if (!parts || parts.length === 0) return 'OK';

        // Filter for parts in this zone, EXCLUDING retired/scrapped
        const zoneParts = parts.filter(part =>
            getZoneForPart(part.name) === zoneName &&
            !['RETIRED', 'SCRAPPED'].includes(part.pitlaneStatus)
        );

        if (zoneParts.length === 0) return 'OK';

        // Separate by assignment: Car parts vs Spares
        const carParts = zoneParts.filter(p =>
            p.assignment?.includes('Car 1') || p.assignment?.includes('Car 2')
        );
        const spares = zoneParts.filter(p =>
            p.assignment?.includes('Spare') ||
            (!p.assignment?.includes('Car 1') && !p.assignment?.includes('Car 2'))
        );

        // Check if there are HEALTHY spares (trackside/manufactured, not damaged, life > 2)
        const healthySpares = spares.filter(p =>
            !p.pitlaneStatus?.includes('DAMAGED') &&
            p.predictiveStatus !== 'CRITICAL' &&
            p.lifeRemaining > 2
        );
        const hasHealthySpare = healthySpares.length > 0;

        // Check if any Car part is critical
        const criticalCarParts = carParts.filter(p =>
            p.pitlaneStatus?.includes('DAMAGED') ||
            p.lifeRemaining <= 1 ||
            p.predictiveStatus === 'CRITICAL'
        );

        // Check if any Car part is warning level
        const warningCarParts = carParts.filter(p =>
            p.pitlaneStatus?.includes('Transit') ||
            p.lifeRemaining === 2 ||
            p.predictiveStatus === 'WARNING'
        );

        // INTELLIGENT LOGIC:
        // 1. CRITICAL (Red): Car part is critical AND NO healthy spare available
        if (criticalCarParts.length > 0 && !hasHealthySpare) {
            return 'CRITICAL';
        }

        // 2. WARNING (Orange): Car part is critical BUT has spare OR car part is warning level
        if (criticalCarParts.length > 0 && hasHealthySpare) {
            return 'WARNING'; // Covered but needs attention
        }
        if (warningCarParts.length > 0) {
            return 'WARNING';
        }

        // 3. Also warn if ALL parts in zone are spares and one is critical (no car to swap to)
        if (carParts.length === 0 && spares.some(p =>
            p.pitlaneStatus?.includes('DAMAGED') || p.lifeRemaining <= 1
        )) {
            return 'WARNING';
        }

        // 4. OK (Green): Everything is fine
        return 'OK';
    };

    const handlePartClick = (partName) => {
        const newSelection = selectedPart === partName ? null : partName;
        setSelectedPart(newSelection);
        onPartSelect(newSelection);
    };

    const handleClearFilter = () => {
        setSelectedPart(null);
        onPartSelect(null);
    };

    const isSelected = (partName) => selectedPart === partName;

    const getZoneColor = (zoneName) => {
        const status = getZoneStatus(zoneName);
        const isActive = isSelected(zoneName);
        const activeStroke = '1.0';
        const inactiveStroke = '0.5';

        if (status === 'CRITICAL') {
            return {
                fill: isActive ? 'rgba(240, 68, 56, 0.7)' : 'rgba(240, 68, 56, 0.4)',
                stroke: isActive ? '#F04438' : '#F04438',
                strokeWidth: isActive ? activeStroke : inactiveStroke,
                glow: '0 0 20px rgba(240, 68, 56, 0.8)'
            };
        } else if (status === 'WARNING') {
            return {
                fill: isActive ? 'rgba(245, 158, 11, 0.6)' : 'rgba(245, 158, 11, 0.3)',
                stroke: isActive ? '#FFA500' : '#F59E0B',
                strokeWidth: isActive ? activeStroke : inactiveStroke,
                glow: '0 0 15px rgba(245, 158, 11, 0.6)'
            };
        } else {
            return {
                fill: isActive ? 'rgba(0, 208, 132, 0.5)' : 'rgba(0, 208, 132, 0.15)',
                stroke: isActive ? '#00FF88' : '#00D084',
                strokeWidth: isActive ? activeStroke : inactiveStroke,
                glow: '0 0 12px rgba(0, 208, 132, 0.5)'
            };
        }
    };

    const frontWingStyle = getZoneColor('Front Wing');
    const monocoqueStyle = getZoneColor('Monocoque');
    const sidepodStyle = getZoneColor('Sidepod');
    const floorStyle = getZoneColor('Floor');
    const gearboxStyle = getZoneColor('Gearbox');
    const rearWingStyle = getZoneColor('Rear Wing');

    return (
        <div style={{
            background: '#151B2E',
            borderRadius: '16px',
            border: '1px solid var(--color-border-subtle)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-soft)',
            height: '450px'
        }}>
            <div style={{
                padding: '20px',
                borderBottom: '1px solid var(--color-border-subtle)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Interactive Parts Selector
                </h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {selectedPart && (
                        <button
                            onClick={handleClearFilter}
                            style={{
                                background: 'rgba(0, 184, 217, 0.15)',
                                border: '1px solid rgba(0, 184, 217, 0.3)',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                color: '#00D9FF',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <X size={14} />
                            Clear Filter
                        </button>
                    )}
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        Click component to filter
                    </div>
                </div>
            </div>

            <div style={{ padding: '24px', textAlign: 'center' }}>
                <svg width="800" height="260" viewBox="0 0 800 260" style={{ maxWidth: '100%', cursor: 'pointer' }}>
                    <defs>
                        <radialGradient id="tireGradient" cx="50%" cy="50%" r="50%">
                            <stop offset="70%" stopColor="#1a1a1a" />
                            <stop offset="90%" stopColor="#333" />
                            <stop offset="100%" stopColor="#111" />
                        </radialGradient>
                        <linearGradient id="rimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#444" />
                            <stop offset="50%" stopColor="#222" />
                            <stop offset="100%" stopColor="#444" />
                        </linearGradient>
                        <path id="monocoqueCurve" d="M 160,132 Q 200,118 240,120" fill="none" />
                    </defs>

                    {/* Monocoque */}
                    <g onClick={() => handlePartClick('Monocoque')} style={{ transition: 'all 0.3s ease', filter: `drop-shadow(${monocoqueStyle.glow})` }}>
                        <path d="M 140,140 L 160,135 Q 200,125 240,122 L 320,120 L 320,160 L 240,162 Q 200,165 160,175 L 140,175 Z"
                            fill={monocoqueStyle.fill} stroke={monocoqueStyle.stroke} strokeWidth={monocoqueStyle.strokeWidth} strokeLinejoin="round" />
                        <path d="M 250,118 Q 280,50 310,118" fill="none" stroke={monocoqueStyle.stroke} strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="280" y1="52" x2="280" y2="118" stroke={monocoqueStyle.stroke} strokeWidth="2.5" />
                    </g>

                    {/* Sidepods */}
                    <g onClick={() => handlePartClick('Sidepod')} style={{ transition: 'all 0.3s ease', filter: `drop-shadow(${sidepodStyle.glow})` }}>
                        <path d="M 325,120 L 515,115 L 515,155 L 325,160 Z" fill={sidepodStyle.fill} stroke={sidepodStyle.stroke} strokeWidth={sidepodStyle.strokeWidth} strokeLinejoin="round" />
                        <ellipse cx="340" cy="140" rx="10" ry="15" fill="rgba(0,0,0,0.3)" stroke={sidepodStyle.stroke} strokeWidth="1" />
                    </g>

                    {/* Front Wing */}
                    <g onClick={() => handlePartClick('Front Wing')} style={{ transition: 'all 0.3s ease', filter: `drop-shadow(${frontWingStyle.glow})` }}>
                        <path d="M 50,155 L 130,150 L 130,145 L 120,142 L 85,140 L 55,142 L 50,145 Z" fill={frontWingStyle.fill} stroke={frontWingStyle.stroke} strokeWidth={frontWingStyle.strokeWidth} />
                        <path d="M 50,165 L 130,160 L 130,155 L 120,152 L 85,150 L 55,152 L 50,155 Z" fill={frontWingStyle.fill} stroke={frontWingStyle.stroke} strokeWidth={frontWingStyle.strokeWidth} />
                        <rect x="48" y="140" width="4" height="32" fill={frontWingStyle.fill} stroke={frontWingStyle.stroke} strokeWidth="1.5" />
                    </g>

                    {/* Gearbox */}
                    <g onClick={() => handlePartClick('Gearbox')} style={{ transition: 'all 0.3s ease', filter: `drop-shadow(${gearboxStyle.glow})` }}>
                        <path d="M 520,115 L 600,110 L 640,108 L 640,162 L 600,160 L 520,155 Z" fill={gearboxStyle.fill} stroke={gearboxStyle.stroke} strokeWidth={gearboxStyle.strokeWidth} />
                    </g>

                    {/* Rear Wing */}
                    <g onClick={() => handlePartClick('Rear Wing')} style={{ transition: 'all 0.3s ease', filter: `drop-shadow(${rearWingStyle.glow})` }}>
                        <path d="M 660,55 L 760,50 L 760,42 L 660,47 Z" fill={rearWingStyle.fill} stroke={rearWingStyle.stroke} strokeWidth={rearWingStyle.strokeWidth} />
                        <path d="M 660,68 L 760,63 L 760,55 L 660,60 Z" fill={rearWingStyle.fill} stroke={rearWingStyle.stroke} strokeWidth={rearWingStyle.strokeWidth} />
                        <line x1="680" y1="80" x2="680" y2="110" stroke={rearWingStyle.stroke} strokeWidth="3" />
                        <line x1="740" y1="75" x2="740" y2="108" stroke={rearWingStyle.stroke} strokeWidth="3" />
                    </g>

                    {/* Floor */}
                    <g onClick={() => handlePartClick('Floor')} style={{ transition: 'all 0.3s ease', filter: `drop-shadow(${floorStyle.glow})` }}>
                        <path d="M 180,175 L 540,175 L 560,173 L 600,170 L 600,177 L 560,180 L 540,182 L 180,182 Z"
                            fill={floorStyle.fill} stroke={floorStyle.stroke} strokeWidth={floorStyle.strokeWidth} />
                        <line x1="220" y1="177" x2="520" y2="177" stroke={floorStyle.stroke} strokeWidth="0.5" strokeDasharray="8,12" opacity="0.6" />
                        <line x1="220" y1="180" x2="520" y2="180" stroke={floorStyle.stroke} strokeWidth="0.5" strokeDasharray="8,12" opacity="0.6" />
                        <line x1="540" y1="175" x2="540" y2="182" stroke={floorStyle.stroke} strokeWidth="0.8" />
                    </g>

                    {/* Wheels */}
                    <g>
                        <circle cx="180" cy="180" r="34" fill="url(#tireGradient)" stroke="#111" strokeWidth="1" />
                        <circle cx="180" cy="180" r="20" fill="url(#rimGradient)" stroke="#555" strokeWidth="1" />
                        <circle cx="180" cy="180" r="4" fill="#111" stroke="#666" strokeWidth="2" />
                        <line x1="180" y1="160" x2="180" y2="200" stroke="#333" strokeWidth="2" />
                        <line x1="160" y1="180" x2="200" y2="180" stroke="#333" strokeWidth="2" />
                    </g>
                    <g>
                        <circle cx="580" cy="180" r="36" fill="url(#tireGradient)" stroke="#111" strokeWidth="1" />
                        <circle cx="580" cy="180" r="22" fill="url(#rimGradient)" stroke="#555" strokeWidth="1" />
                        <circle cx="580" cy="180" r="4" fill="#111" stroke="#666" strokeWidth="2" />
                        <line x1="580" y1="158" x2="580" y2="202" stroke="#333" strokeWidth="2" />
                        <line x1="558" y1="180" x2="602" y2="180" stroke="#333" strokeWidth="2" />
                    </g>

                    {/* Text Labels */}
                    <g style={{ pointerEvents: 'none' }}>
                        <text fontSize="11" fontWeight="700" letterSpacing="1px" fill={monocoqueStyle.stroke} dy="-2">
                            <textPath href="#monocoqueCurve" startOffset="50%" textAnchor="middle">
                                MONOCOQUE
                            </textPath>
                        </text>

                        <text x="580" y="98" fill={gearboxStyle.stroke} fontSize="11" fontWeight="700" textAnchor="middle" letterSpacing="1px">GEARBOX</text>
                        <text x="420" y="108" fill={sidepodStyle.stroke} fontSize="11" fontWeight="700" textAnchor="middle" letterSpacing="1px">SIDEPODS</text>
                        <text x="390" y="198" fill={floorStyle.stroke} fontSize="11" fontWeight="700" textAnchor="middle" letterSpacing="1px">FLOOR</text>
                        <text x="80" y="128" fill={frontWingStyle.stroke} fontSize="11" fontWeight="700" textAnchor="middle" letterSpacing="1px">FRONT WING</text>
                        <text x="710" y="20" fill={rearWingStyle.stroke} fontSize="11" fontWeight="700" textAnchor="middle" letterSpacing="1px">REAR WING</text>
                    </g>
                </svg>

                <div style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    background: selectedPart ? 'rgba(0, 208, 132, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px',
                    border: selectedPart ? '1px solid #00D084' : '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    {selectedPart ? (
                        <>
                            <span style={{ color: '#00D084', fontSize: '14px' }}>✓</span>
                            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>Filtering:</span>
                            <span style={{ color: '#00D084', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {selectedPart}
                            </span>
                        </>
                    ) : (
                        <span style={{ color: '#888', fontSize: '13px' }}>Select a component to filter parts inventory</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CarConfigurator;
