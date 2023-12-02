import { ColorMap } from "./excelInterfaces";

const getWeightName = (value?: number): string => {
    switch (value) {
        case 1: return 'thin';
        case 2: return 'medium';
        case 3: return 'thick';
        default: return 'hair';
    }
};

const mappedBorderNames: { [key: string]: string } = {
    None: 'None',
    Dot: 'Dotted',
    Dash: 'Dashed',
    Double: 'Double',
    DashDot: 'DashDot',
    DashDotDot: 'DashDotDot',
    SlantDashDot: 'SlantDashDot'
};

const mediumBorders = ['Dashed', 'DashDot', 'DashDotDot'];

const colorMap: ColorMap = {
    None: 'none',
    Solid: 'solid',
    Gray50: 'mediumGray',
    Gray75: 'darkGray',
    Gray25: 'lightGray',
    HorzStripe: 'darkHorizontal',
    VertStripe: 'darkVertical',
    ReverseDiagStripe: 'darkDown',
    DiagStripe: 'darkUp',
    DiagCross: 'darkGrid',
    ThickDiagCross: 'darkTrellis',
    ThinHorzStripe: 'lightHorizontal',
    ThinVertStripe: 'lightVertical',
    ThinReverseDiagStripe: 'lightDown',
    ThinDiagStripe: 'lightUp',
    ThinHorzCross: 'lightGrid',
    ThinDiagCross: 'lightTrellis',
    Gray125: 'gray125',
    Gray0625: 'gray0625'
};

const horizontalAlignmentMap: { [key: string]: string } = {
    Automatic: 'general',
    Left: 'left',
    Center: 'center',
    Right: 'right',
    Fill: 'fill',
    Justify: 'justify',
    CenterAcrossSelection: 'centerContinuous',
    Distributed: 'distributed',
    JustifyDistributed: 'justify'
};

const verticalAlignmentMap: { [key: string]: string | undefined } = {
    Automatic: undefined,
    Top: 'top',
    Bottom: 'bottom',
    Center: 'center',
    Justify: 'justify',
    Distributed: 'distributed',
    JustifyDistributed: 'justify'
};

export const convertLegacyPattern = (name: string | undefined): string => {
    if (!name) { return 'none'; }

    return colorMap[name] || name;
};

export const convertLegacyColor = (color?: string): string | undefined => {
    if (color == undefined) { return color; }

    if (color.charAt(0) === '#') {
        color = color.substring(1);
    }

    return color.length === 6 ? 'FF' + color : color;
};

export const convertLegacyBorder = (type?: string, weight?: number): string => {
    if (!type) { return 'thin'; }

    // Legacy Types are: None, Continuous, Dash, Dot, DashDot, DashDotDot, SlantDashDot, and Double
    // Weight represents: 0—Hairline, 1—Thin , 2—Medium, 3—Thick

    // New types: none, thin, medium, dashed, dotted, thick, double, hair, mediumDashed, dashDot, mediumDashDot,
    // dashDotDot, mediumDashDotDot, slantDashDot
    const namedWeight = getWeightName(weight);
    const mappedName = mappedBorderNames[type];

    if (type === 'Continuous') { return namedWeight; }
    if (namedWeight === 'medium' && mediumBorders.indexOf(mappedName) !== -1) { return `medium${mappedName}`; }

    return mappedName.charAt(0).toLowerCase() + mappedName.substring(1);
};

export const convertLegacyHorizontalAlignment = (alignment: string): string => {
    return horizontalAlignmentMap[alignment] || 'general';
};

export const convertLegacyVerticalAlignment = (alignment: string): string | undefined => {
    return verticalAlignmentMap[alignment] || undefined;
};