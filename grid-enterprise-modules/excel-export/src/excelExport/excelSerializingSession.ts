import {
    Column,
    ColumnGroup,
    ColumnWidthCallbackParams,
    ExcelCell,
    ExcelColumn,
    ExcelImage,
    ExcelHeaderFooterConfig,
    ExcelOOXMLDataType,
    ExcelRow,
    ExcelSheetPageSetup,
    ExcelSheetMargin,
    ExcelStyle,
    ExcelWorksheet,
    RowHeightCallbackParams,
    RowNode,
    _,
} from '@ag-grid-community/core';

import {
    BaseGridSerializingSession,
    GridSerializingParams,
    RowAccumulator,
    RowSpanningAccumulator,
    RowType
} from "@ag-grid-community/csv-export";

import { ExcelXlsxFactory } from './excelXlsxFactory';
import { getHeightFromProperty } from './assets/excelUtils';

export interface StyleLinkerInterface {
    rowType: RowType;
    rowIndex: number;
    value: string;
    column?: Column;
    columnGroup?: ColumnGroup;
    node?: RowNode;
}

interface ExcelMixedStyle {
    key: string;
    excelID: string;
    result: ExcelStyle;
}

export interface ExcelGridSerializingParams extends GridSerializingParams {
    autoConvertFormulas?: boolean;
    baseExcelStyles: ExcelStyle[];
    columnWidth?: number | ((params: ColumnWidthCallbackParams) => number);
    headerFooterConfig?: ExcelHeaderFooterConfig;
    headerRowHeight?: number | ((params: RowHeightCallbackParams) => number);
    rowHeight?: number | ((params: RowHeightCallbackParams) => number);
    margins?: ExcelSheetMargin;
    pageSetup?: ExcelSheetPageSetup;
    sheetName: string;
    suppressColumnOutline?: boolean;
    suppressRowOutline?: boolean;
    rowGroupExpandState?:  'expanded' | 'collapsed' | 'match';
    styleLinker: (params: StyleLinkerInterface) => string[];
    addImageToCell?: (rowIndex: number, column: Column, value: string) => { image: ExcelImage, value?: string } | undefined;
}

export class ExcelSerializingSession extends BaseGridSerializingSession<ExcelRow[]> {

    private readonly config: ExcelGridSerializingParams;
    private readonly stylesByIds: { [key: string]: ExcelStyle };

    private mixedStyles: { [key: string]: ExcelMixedStyle } = {};
    private mixedStyleCounter: number = 0;

    private readonly excelStyles: ExcelStyle[];

    private rows: ExcelRow[] = [];
    private cols: ExcelColumn[];
    private columnsToExport: Column[];

    constructor(config: ExcelGridSerializingParams) {
        super(config);
        this.config = Object.assign({}, config);
        this.stylesByIds = {};
        this.config.baseExcelStyles.forEach(style => {
            this.stylesByIds[style.id] = style;
        });
        this.excelStyles = [...this.config.baseExcelStyles];
    }

    public addCustomContent(customContent: ExcelRow[]): void {
        customContent.forEach(row => {
            const rowLen = this.rows.length + 1;
            let outlineLevel: number | undefined;

            if (!this.config.suppressRowOutline && row.outlineLevel != null) {
                outlineLevel = row.outlineLevel;
            }

            const rowObj: ExcelRow = {
                height: getHeightFromProperty(rowLen, row.height || this.config.rowHeight),
                cells: (row.cells || []).map((cell, idx) => {
                    const image = this.addImage(rowLen, this.columnsToExport[idx], cell.data?.value as string);

                    let excelStyles: string[] | null = null;
                    
                    if (cell.styleId) {
                        excelStyles = typeof cell.styleId === 'string' ? [cell.styleId] : cell.styleId;
                    }

                    const excelStyleId = this.getStyleId(excelStyles);

                    if (image) {
                        return this.createCell(excelStyleId, this.getDataTypeForValue(image.value), image.value == null ? '' : image.value);
                    }

                    const value = cell.data?.value ?? '';
                    const type = this.getDataTypeForValue(value);

                    if (cell.mergeAcross) {
                        return this.createMergedCell(excelStyleId, type, value, cell.mergeAcross)
                    }

                    return this.createCell(excelStyleId, type, value);
                }),
                outlineLevel
            };

            if (row.collapsed != null) { rowObj.collapsed = row.collapsed; }
            if (row.hidden != null) { rowObj.hidden = row.hidden; }

            this.rows.push(rowObj);
        });
    }

    public onNewHeaderGroupingRow(): RowSpanningAccumulator {
        const currentCells: ExcelCell[] = [];
        this.rows.push({
            cells: currentCells,
            height: getHeightFromProperty(this.rows.length + 1, this.config.headerRowHeight)
        });
        return {
            onColumn: (columnGroup: ColumnGroup, header: string, index: number, span: number, collapsibleRanges: number[][]) => {
                const styleIds: string[] = this.config.styleLinker({ rowType: RowType.HEADER_GROUPING, rowIndex: 1, value: `grouping-${header}`, columnGroup });
                currentCells.push({
                    ...this.createMergedCell(this.getStyleId(styleIds), this.getDataTypeForValue('string'), header, span),
                    collapsibleRanges
                });
            }
        };
    }

    public onNewHeaderRow(): RowAccumulator {
        return this.onNewRow(this.onNewHeaderColumn, this.config.headerRowHeight);
    }

    public onNewBodyRow(node?: RowNode): RowAccumulator {
        const rowAccumulator = this.onNewRow(this.onNewBodyColumn, this.config.rowHeight);

        if (node) {
            this.addRowOutlineIfNecessary(node);
        }

        return rowAccumulator;
    }

    public prepare(columnsToExport: Column[]): void {
        super.prepare(columnsToExport);
        this.columnsToExport = [...columnsToExport];
        this.cols = columnsToExport.map((col, i) => this.convertColumnToExcel(col, i));
    }

    public parse(): string {
        // adding custom content might have made some rows wider than the grid, so add new columns
        const longestRow = this.rows.reduce((a, b) => Math.max(a, b.cells.length), 0);
        while (this.cols.length < longestRow) {
            this.cols.push(this.convertColumnToExcel(null, this.cols.length + 1));
        }

        const data: ExcelWorksheet = {
            name: this.config.sheetName,
            table: {
                columns: this.cols,
                rows: this.rows
            }
        };

        return this.createExcel(data);
    }

    private addRowOutlineIfNecessary(node: RowNode): void {
        const { gridOptionsService, suppressRowOutline, rowGroupExpandState = 'expanded' } = this.config;
        const isGroupHideOpenParents = gridOptionsService.get('groupHideOpenParents');

        if (isGroupHideOpenParents || suppressRowOutline || node.level == null) { return; }

        const padding = node.footer ? 1 : 0;
        const currentRow = _.last(this.rows);

        currentRow.outlineLevel = node.level + padding;

        if (rowGroupExpandState === 'expanded') { return; }

        const collapseAll = rowGroupExpandState === 'collapsed';

        if (node.isExpandable()) {
            const isExpanded = !collapseAll && node.expanded;
            currentRow.collapsed = !isExpanded;
        }

        currentRow.hidden = 
            // always show the node if there is no parent to be expanded
            !!node.parent &&
            // or if it is a child of the root node
            node.parent.level !== -1 &&
            (collapseAll || this.isAnyParentCollapsed(node.parent));
    }

    private isAnyParentCollapsed(node?: RowNode | null): boolean {
        while (node && node.level !== -1) {
            if (!node.expanded) { return true; }

            node = node.parent;
        }

        return false;
    }

    private convertColumnToExcel(column: Column | null, index: number): ExcelColumn {
        const columnWidth = this.config.columnWidth;
        if (columnWidth) {
            if (typeof columnWidth === 'number') {
                return { width: columnWidth };
            }
            return { width: columnWidth({ column, index }) };
        }

        if (column) {
            const smallestUsefulWidth = 75;
            return { width: Math.max(column.getActualWidth(), smallestUsefulWidth) };
        }
        return {};
    }

    private onNewHeaderColumn(rowIndex: number, currentCells: ExcelCell[]): (column: Column, index: number, node: RowNode) => void {
        return (column, index) => {
            const nameForCol = this.extractHeaderValue(column);
            const styleIds: string[] = this.config.styleLinker({ rowType: RowType.HEADER, rowIndex, value: nameForCol, column });
            currentCells.push(this.createCell(this.getStyleId(styleIds), this.getDataTypeForValue('string'), nameForCol));
        };
    }

    private onNewBodyColumn(rowIndex: number, currentCells: ExcelCell[]): (column: Column, index: number, node: RowNode) => void {
        let skipCols = 0;

        return (column, index, node) => {
            if (skipCols > 0) {
                skipCols -= 1;
                return;
            }

            const { value: valueForCell, valueFormatted } = this.extractRowCellValue(column, index, rowIndex, 'excel', node);
            const styleIds: string[] = this.config.styleLinker({ rowType: RowType.BODY, rowIndex, value: valueForCell, column, node });
            const excelStyleId: string | null = this.getStyleId(styleIds);
            const colSpan = column.getColSpan(node);
            const addedImage = this.addImage(rowIndex, column, valueForCell);

            if (addedImage) {
                currentCells.push(this.createCell(excelStyleId, this.getDataTypeForValue(addedImage.value), addedImage.value == null ? '' : addedImage.value));
            } else if (colSpan > 1) {
                skipCols = colSpan - 1;
                currentCells.push(this.createMergedCell(excelStyleId, this.getDataTypeForValue(valueForCell), valueForCell, colSpan - 1));
            } else {
                currentCells.push(this.createCell(excelStyleId, this.getDataTypeForValue(valueForCell), valueForCell, valueFormatted));
            }
        };
    }

    private onNewRow(onNewColumnAccumulator: (rowIndex: number, currentCells: ExcelCell[]) => (column: Column, index: number, node: RowNode) => void, height?: number | ((params: RowHeightCallbackParams) => number)): RowAccumulator {
        const currentCells: ExcelCell[] = [];
        this.rows.push({
            cells: currentCells,
            height: getHeightFromProperty(this.rows.length + 1, height)
        });
        return {
            onColumn: onNewColumnAccumulator.bind(this, this.rows.length, currentCells)()
        };
    }

    private createExcel(data: ExcelWorksheet): string {
        const { excelStyles, config } = this;

        return ExcelXlsxFactory.createExcel(
            excelStyles,
            data,
            config
        );
    }

    private getDataTypeForValue(valueForCell?: string): ExcelOOXMLDataType {
        if (valueForCell === undefined) { return 'empty'; }
        return this.isNumerical(valueForCell) ? 'n' : 's';
    }

    private getType(type: ExcelOOXMLDataType, style: ExcelStyle | null, value: string | null): ExcelOOXMLDataType | null {
        if (this.isFormula(value)) { return 'f'; }

        if (style && style.dataType) {
            switch (style.dataType.toLocaleLowerCase()) {
                case 'formula':
                    return 'f';
                case 'string':
                    return 's';
                case 'number':
                    return 'n';
                case 'datetime':
                    return 'd';
                case 'error':
                    return 'e';
                case 'boolean':
                    return 'b';
                default:
                    console.warn(`AG Grid: Unrecognized data type for excel export [${style.id}.dataType=${style.dataType}]`);
            }
        }

        return type;
    }

    private addImage(rowIndex: number, column: Column, value: string): { image: ExcelImage, value?: string } | undefined {
        if (!this.config.addImageToCell) { return; }

        const addedImage = this.config.addImageToCell(rowIndex, column, value);

        if (!addedImage) { return; }

        ExcelXlsxFactory.buildImageMap(addedImage.image, rowIndex, column, this.columnsToExport, this.config.rowHeight);

        return addedImage;
    }

    private createCell(styleId: string | null, type: ExcelOOXMLDataType, value: string, valueFormatted?: string | null): ExcelCell {
        const actualStyle: ExcelStyle | null = this.getStyleById(styleId);
        if (!actualStyle?.dataType && type === 's' && valueFormatted) {
            value = valueFormatted;
        }
        const typeTransformed = this.getType(type, actualStyle, value) || type;

        return {
            styleId: actualStyle ? styleId! : undefined,
            data: {
                type: typeTransformed,
                value: this.getCellValue(typeTransformed, value)
            }
        };
    }

    private createMergedCell(styleId: string | null, type: ExcelOOXMLDataType, value: string, numOfCells: number): ExcelCell {
        const valueToUse = value == null ? '' : value;
        return {
            styleId: !!this.getStyleById(styleId) ? styleId! : undefined,
            data: {
                type: type,
                value: type === 's' ? ExcelXlsxFactory.getStringPosition(valueToUse).toString() : value
            },
            mergeAcross: numOfCells
        };
    }

    private getCellValue(type: ExcelOOXMLDataType, value: string | null): string | null {
        if (value == null) { return ExcelXlsxFactory.getStringPosition('').toString(); }

        switch (type) {
            case 's':
                return value === '' ? '' : ExcelXlsxFactory.getStringPosition(value).toString();
            case 'f':
                return value.slice(1);
            case 'n':
                return Number(value).toString();
            default:
                return value;
        }
    }

    private getStyleId(styleIds?: string[] | null): string | null {
        if (!styleIds || !styleIds.length) { return null; }
        if (styleIds.length === 1) { return styleIds[0]; }

        const key: string = styleIds.join("-");
        if (!this.mixedStyles[key]) {
            this.addNewMixedStyle(styleIds);
        }
        return this.mixedStyles[key].excelID;
    }

    private addNewMixedStyle(styleIds: string[]): void {
        this.mixedStyleCounter += 1;
        const excelId = `mixedStyle${this.mixedStyleCounter}`;
        const resultantStyle: ExcelStyle = {} as ExcelStyle;

        styleIds.forEach((styleId: string) => {
            this.excelStyles.forEach((excelStyle: ExcelStyle) => {
                if (excelStyle.id === styleId) {
                    _.mergeDeep(resultantStyle, _.deepCloneObject(excelStyle));
                }
            });
        });

        resultantStyle.id = excelId;
        resultantStyle.name = excelId;
        const key: string = styleIds.join("-");
        this.mixedStyles[key] = {
            excelID: excelId,
            key: key,
            result: resultantStyle
        };
        this.excelStyles.push(resultantStyle);
        this.stylesByIds[excelId] = resultantStyle;
    }

    private isFormula(value: string | null) {
        if (value == null) { return false; }
        return this.config.autoConvertFormulas && value.toString().startsWith('=');
    }

    private isNumerical(value: any): boolean {
        if (typeof value === 'bigint') { return true; }
        return isFinite(value) && value !== '' && !isNaN(parseFloat(value));
    }

    private getStyleById(styleId?: string | null): ExcelStyle | null {
        if (styleId == null) { return null; }
        return this.stylesByIds[styleId] || null;
    }


}
