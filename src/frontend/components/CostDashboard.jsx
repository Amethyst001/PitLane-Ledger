import React, { useState, useMemo } from 'react';
import { X, DollarSign, AlertTriangle, TrendingDown, TrendingUp, Calculator, Wrench, Zap } from 'lucide-react';

// Part cost estimates (USD) - Industry standard 2024-2025
const DEFAULT_PART_COSTS = {
    'Monocoque': 675000,
    'Gearbox': 500000,
    'Floor': 275000,
    'Front Wing': 200000,
    'Suspension': 150000,
    'Rear Wing': 150000,
    'Steering Wheel': 60000,
    'Sidepods': 50000,
    'Brake System': 40000,
    'Halo': 20000,
    'Default': 25000
};

// Parts Budget defaults - Realistic allocation for spare parts/components
// Teams typically allocate ~$12-18M for spare parts out of $135M+ total budget
const PARTS_BUDGET_BASE = 15000000; // $15M base for 21 races
const PARTS_PER_EXTRA_RACE = 500000; // $500K per extra race (more parts needed)
const PARTS_PER_SPRINT = 150000; // $150K per sprint (higher damage risk)
const FRONT_WING_UPGRADE_COST = 150000; // Cost of a single wing upgrade

const CostDashboard = ({ isOpen, onClose, parts, raceCount = 24, sprintCount = 6, appMode, customCosts, partsBudgetConfig }) => {
    // Calculate parts budget with breakdown (NOT full team cap)
    const partsBudgetBreakdown = useMemo(() => {
        // Use custom config if provided (PROD mode), otherwise defaults
        const baseBudget = partsBudgetConfig?.base || PARTS_BUDGET_BASE;
        const perRace = partsBudgetConfig?.perExtraRace || PARTS_PER_EXTRA_RACE;
        const perSprint = partsBudgetConfig?.perSprint || PARTS_PER_SPRINT;

        const extraRaces = Math.max(0, raceCount - 21);
        const raceAdjustment = extraRaces * perRace;
        const sprintAdjustment = sprintCount * perSprint;
        const totalBudget = baseBudget + raceAdjustment + sprintAdjustment;

        return {
            base: baseBudget,
            extraRaces,
            raceAdjustment,
            sprintCount,
            sprintAdjustment,
            totalBudget
        };
    }, [raceCount, sprintCount, partsBudgetConfig]);

    // Get part cost based on category
    const getPartCost = (part) => {
        const costs = customCosts || DEFAULT_PART_COSTS;
        const name = (part.name || '').toLowerCase();

        for (const [category, cost] of Object.entries(costs)) {
            if (name.includes(category.toLowerCase())) {
                return cost;
            }
        }
        return costs['Default'] || 25000;
    };

    // Get category for grouping
    const getCategory = (name) => {
        const n = (name || '').toLowerCase();
        if (n.includes('monocoque') || n.includes('chassis')) return 'Chassis';
        if (n.includes('gearbox') || n.includes('transmission')) return 'Gearbox';
        if (n.includes('front wing')) return 'Front Wing';
        if (n.includes('rear wing') || n.includes('drs')) return 'Rear Wing';
        if (n.includes('floor') || n.includes('diffuser')) return 'Floor';
        if (n.includes('suspension')) return 'Suspension';
        if (n.includes('brake')) return 'Brakes';
        // Note: Power Unit costs are EXEMPT from cap
        if (n.includes('power unit') || n.includes('ice') || n.includes('mgu')) return 'PU Ancillaries*';
        return 'Other';
    };

    // Calculate inventory value and damage costs
    const financials = useMemo(() => {
        if (!Array.isArray(parts) || parts.length === 0) {
            return { totalValue: 0, damageTotal: 0, byCategory: {}, scrappedParts: [] };
        }

        let totalValue = 0;
        let damageTotal = 0;
        const byCategory = {};
        const scrappedParts = [];

        parts.forEach(p => {
            const status = (p.pitlaneStatus || '').toLowerCase();
            const cost = getPartCost(p);

            // Skip retired/scrapped from total value
            if (!status.includes('retired') && !status.includes('scrapped')) {
                totalValue += cost;
            }

            // Count damage costs (scrapped/damaged parts)
            if (status.includes('scrapped') || status.includes('damaged')) {
                damageTotal += cost;
                scrappedParts.push({ name: p.name, cost, status: p.pitlaneStatus });
            }

            // Group by category
            const category = getCategory(p.name);
            if (!byCategory[category]) {
                byCategory[category] = { count: 0, value: 0 };
            }
            byCategory[category].count++;
            byCategory[category].value += cost;
        });

        return { totalValue, damageTotal, byCategory, scrappedParts };
    }, [parts, customCosts]);

    const formatCurrency = (val) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
        return `$${val.toLocaleString()}`;
    };

    // Calculate opportunity cost (how many upgrades lost to damage)
    const upgradesLost = Math.floor(financials.damageTotal / FRONT_WING_UPGRADE_COST);
    const totalSpent = financials.totalValue + financials.damageTotal; // Inventory + Damage
    const budgetPercentUsed = (totalSpent / partsBudgetBreakdown.totalBudget) * 100;
    const remainingBuffer = partsBudgetBreakdown.totalBudget - totalSpent;
    const isWarning = budgetPercentUsed > 70; // Over 70% of parts budget spent
    const isDanger = budgetPercentUsed > 90; // Over 90% is critical

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerTitle}>
                        <Calculator size={22} color="#00B8D9" />
                        <h2 style={styles.title}>Cost Cap Calculator</h2>
                    </div>
                    <button style={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div style={styles.content}>
                    {/* Parts Budget Calculator */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>Parts Budget Calculator</h3>
                        <div style={styles.formulaBox}>
                            <div style={styles.formulaRow}>
                                <span style={styles.formulaLabel}>Base Parts Budget (21 Races)</span>
                                <span style={styles.formulaValue}>{formatCurrency(partsBudgetBreakdown.base)}</span>
                            </div>
                            {partsBudgetBreakdown.extraRaces > 0 && (
                                <div style={styles.formulaRow}>
                                    <span style={styles.formulaLabel}>Extended Calendar (+{partsBudgetBreakdown.extraRaces} Races)</span>
                                    <span style={{ ...styles.formulaValue, color: '#22C55E' }}>+{formatCurrency(partsBudgetBreakdown.raceAdjustment)}</span>
                                </div>
                            )}
                            {partsBudgetBreakdown.sprintCount > 0 && (
                                <div style={styles.formulaRow}>
                                    <span style={styles.formulaLabel}>Sprint Risk Buffer ({partsBudgetBreakdown.sprintCount} Sprints)</span>
                                    <span style={{ ...styles.formulaValue, color: '#22C55E' }}>+{formatCurrency(partsBudgetBreakdown.sprintAdjustment)}</span>
                                </div>
                            )}
                            <div style={styles.totalRow}>
                                <span style={styles.totalLabel}>TOTAL PARTS BUDGET</span>
                                <span style={styles.totalValue}>{formatCurrency(partsBudgetBreakdown.totalBudget)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Inventory & Damage */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>Parts Inventory</h3>
                        <div style={styles.impactGrid}>
                            <div style={{ ...styles.impactCard, border: '1px solid rgba(0, 184, 217, 0.3)' }}>
                                <DollarSign size={24} color="#00B8D9" />
                                <div style={{ ...styles.impactValue, color: '#00B8D9' }}>{formatCurrency(financials.totalValue)}</div>
                                <div style={styles.impactLabel}>Inventory Value</div>
                            </div>
                            <div style={{ ...styles.impactCard, border: '1px solid rgba(240, 68, 56, 0.3)' }}>
                                <TrendingDown size={24} color="#F04438" />
                                <div style={{ ...styles.impactValue, color: '#F04438' }}>{formatCurrency(financials.damageTotal)}</div>
                                <div style={styles.impactLabel}>Damage Costs</div>
                            </div>
                        </div>

                        {/* Total Spending vs Budget Progress Bar */}
                        <div style={styles.progressSection}>
                            <div style={styles.progressBar}>
                                <div style={{
                                    ...styles.progressFill,
                                    width: `${Math.min(budgetPercentUsed, 100)}%`,
                                    backgroundColor: isDanger ? '#F04438' : budgetPercentUsed > 70 ? '#F59E0B' : '#22C55E'
                                }} />
                                <div style={{ ...styles.progressDanger, left: '90%' }} />
                            </div>
                            <div style={styles.progressLabels}>
                                <span>$0</span>
                                <span style={{ color: '#64748B' }}>Total Spent vs Parts Budget</span>
                                <span>{formatCurrency(partsBudgetBreakdown.totalBudget)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Asset Valuation */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>Asset Valuation (Audit)</h3>
                        <div style={styles.categoryList}>
                            {Object.entries(financials.byCategory)
                                .sort((a, b) => b[1].value - a[1].value)
                                .map(([cat, data]) => (
                                    <div key={cat} style={styles.categoryRow}>
                                        <span style={styles.categoryName}>
                                            {cat}
                                            {cat.includes('*') && <span style={styles.exemptTag}>Exempt</span>}
                                        </span>
                                        <span style={styles.categoryCount}>{data.count} units</span>
                                        <span style={styles.categoryValue}>{formatCurrency(data.value)}</span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* ESC Label & Info */}
                    <div style={styles.infoBox}>
                        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={styles.escBadge}>ESC</span>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>Estimated Standard Costs</span>
                        </div>
                        <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                            {appMode === 'DEMO' ? (
                                <span>Using industry estimates. In Production mode, managers can provide actual costs.</span>
                            ) : (
                                <span>Using {customCosts ? 'manager-provided' : 'default'} costs. Excludes: Driver salaries, top 3 staff, marketing, travel, heritage, PU lease.</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <button onClick={onClose} style={styles.doneBtn}>Done</button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
    },
    modal: {
        background: 'linear-gradient(135deg, #0A0E1A 0%, #151B2E 100%)',
        border: '1px solid var(--color-border-subtle, rgba(255,255,255,0.1))',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: '1px solid var(--color-border-subtle, rgba(255,255,255,0.1))'
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 600,
        color: '#fff'
    },
    closeBtn: {
        background: 'rgba(100, 116, 139, 0.15)',
        border: 'none',
        borderRadius: '8px',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#94A3B8'
    },
    content: {
        padding: '20px 24px',
        overflowY: 'auto',
        flex: 1
    },
    section: {
        marginBottom: '24px'
    },
    sectionTitle: {
        margin: '0 0 12px',
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#94A3B8'
    },
    formulaBox: {
        background: 'rgba(0, 184, 217, 0.05)',
        border: '1px solid rgba(0, 184, 217, 0.2)',
        borderRadius: '10px',
        padding: '16px'
    },
    formulaRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
    },
    formulaLabel: {
        fontSize: '13px',
        color: '#94A3B8'
    },
    formulaValue: {
        fontSize: '13px',
        fontWeight: 600,
        color: '#E2E8F0'
    },
    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid rgba(0, 184, 217, 0.3)',
        paddingTop: '12px',
        marginTop: '8px'
    },
    totalLabel: {
        fontSize: '14px',
        fontWeight: 700,
        color: '#fff'
    },
    totalValue: {
        fontSize: '22px',
        fontWeight: 700,
        color: '#00B8D9'
    },
    impactGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '12px'
    },
    impactCard: {
        background: 'rgba(100, 116, 139, 0.08)',
        borderRadius: '10px',
        padding: '16px',
        textAlign: 'center'
    },
    impactValue: {
        fontSize: '24px',
        fontWeight: 700,
        color: '#fff',
        margin: '8px 0 4px'
    },
    impactLabel: {
        fontSize: '11px',
        color: '#64748B',
        textTransform: 'uppercase'
    },
    opportunityCost: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '8px',
        color: '#F59E0B',
        fontSize: '12px',
        marginBottom: '12px'
    },
    categoryList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    categoryRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 12px',
        background: 'rgba(100, 116, 139, 0.08)',
        borderRadius: '6px'
    },
    categoryName: {
        flex: 1,
        fontSize: '13px',
        fontWeight: 500,
        color: '#E2E8F0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    exemptTag: {
        fontSize: '9px',
        padding: '2px 6px',
        background: 'rgba(139, 92, 246, 0.2)',
        color: '#A78BFA',
        borderRadius: '4px',
        fontWeight: 600
    },
    categoryCount: {
        fontSize: '11px',
        color: '#64748B',
        marginRight: '16px'
    },
    categoryValue: {
        fontSize: '13px',
        fontWeight: 600,
        color: '#00B8D9'
    },
    infoBox: {
        padding: '12px 16px',
        background: 'rgba(100, 116, 139, 0.1)',
        borderRadius: '8px',
        color: '#94A3B8'
    },
    escBadge: {
        background: 'rgba(0,184,217,0.2)',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        color: '#00B8D9'
    },
    footer: {
        padding: '16px 24px',
        borderTop: '1px solid var(--color-border-subtle, rgba(255,255,255,0.1))',
        display: 'flex',
        justifyContent: 'flex-end'
    },
    doneBtn: {
        padding: '10px 24px',
        background: 'linear-gradient(135deg, #00B8D9, #0066CA)',
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer'
    },
    progressSection: {
        marginTop: '16px'
    },
    progressBar: {
        position: 'relative',
        height: '8px',
        background: 'rgba(100, 116, 139, 0.2)',
        borderRadius: '4px',
        overflow: 'visible'
    },
    progressFill: {
        height: '100%',
        borderRadius: '4px',
        transition: 'width 0.3s ease'
    },
    progressDanger: {
        position: 'absolute',
        top: '-4px',
        width: '2px',
        height: '16px',
        background: '#F04438',
        borderRadius: '2px'
    },
    progressLabels: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '6px',
        fontSize: '11px',
        color: '#94A3B8'
    }
};

export default CostDashboard;
