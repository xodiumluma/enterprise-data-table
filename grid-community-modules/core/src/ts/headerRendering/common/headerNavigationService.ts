import { BeanStub } from "../../context/beanStub";
import { Autowired, Bean, PostConstruct } from "../../context/context";
import { CtrlsService } from "../../ctrlsService";
import { Column } from "../../entities/column";
import { ColumnGroup } from "../../entities/columnGroup";
import { FocusService } from "../../focusService";
import { GridBodyCtrl } from "../../gridBodyComp/gridBodyCtrl";
import { last } from "../../utils/array";
import { HeaderPosition, HeaderPositionUtils } from "./headerPosition";

export enum HeaderNavigationDirection {
    UP,
    DOWN,
    LEFT,
    RIGHT
}

@Bean('headerNavigationService')
export class HeaderNavigationService extends BeanStub {

    @Autowired('focusService') private focusService: FocusService;
    @Autowired('headerPositionUtils') private headerPositionUtils: HeaderPositionUtils;
    @Autowired('ctrlsService') private ctrlsService: CtrlsService;

    private gridBodyCon: GridBodyCtrl;

    @PostConstruct
    private postConstruct(): void {
        this.ctrlsService.whenReady(p => {
            this.gridBodyCon = p.gridBodyCtrl;
        });
    }

    public getHeaderRowCount(): number {
        const centerHeaderContainer = this.ctrlsService.getHeaderRowContainerCtrl();
        return centerHeaderContainer ? centerHeaderContainer.getRowCount() : 0;
    }

    /*
     * This method navigates grid header vertically
     * @return {boolean} true to preventDefault on the event that caused this navigation.
     */
    public navigateVertically(direction: HeaderNavigationDirection, fromHeader: HeaderPosition | null, event: KeyboardEvent): boolean {
        if (!fromHeader) {
            fromHeader = this.focusService.getFocusedHeader();
        }

        if (!fromHeader) { return false; }

        const { headerRowIndex, column } = fromHeader;
        const rowLen = this.getHeaderRowCount();
        const isUp = direction === HeaderNavigationDirection.UP;

        let { nextRow, nextFocusColumn } = isUp
            ? this.headerPositionUtils.getColumnVisibleParent(column, headerRowIndex)
            : this.headerPositionUtils.getColumnVisibleChild(column, headerRowIndex);

        let skipColumn = false;

        if (nextRow < 0) {
            nextRow = 0;
            nextFocusColumn = column;
            skipColumn = true;
        }

        if (nextRow >= rowLen) {
            nextRow = -1; // -1 indicates the focus should move to grid rows.
        }

        if (!skipColumn && !nextFocusColumn) {
            return false;
        }

        return this.focusService.focusHeaderPosition({
            headerPosition: { headerRowIndex: nextRow, column: nextFocusColumn! },
            allowUserOverride:  true,
            event
        });
    }

    /*
     * This method navigates grid header horizontally
     * @return {boolean} true to preventDefault on the event that caused this navigation.
     */
    public navigateHorizontally(direction: HeaderNavigationDirection, fromTab: boolean = false, event: KeyboardEvent): boolean {
        const focusedHeader = this.focusService.getFocusedHeader()!;
        const isLeft = direction === HeaderNavigationDirection.LEFT;
        const isRtl = this.gridOptionsService.get('enableRtl');
        let nextHeader: HeaderPosition;
        let normalisedDirection: 'Before' |  'After';

        // either navigating to the left or isRtl (cannot be both)
        if (isLeft !== isRtl) {
            normalisedDirection = 'Before';
            nextHeader = this.headerPositionUtils.findHeader(focusedHeader, normalisedDirection)!;
        } else {
            normalisedDirection = 'After';
            nextHeader = this.headerPositionUtils.findHeader(focusedHeader, normalisedDirection)!;
        }

        if (nextHeader || !fromTab) {
            return this.focusService.focusHeaderPosition({
                headerPosition: nextHeader,
                direction: normalisedDirection,
                fromTab,
                allowUserOverride: true,
                event
            });
        }

        return this.focusNextHeaderRow(focusedHeader, normalisedDirection, event);
    }

    private focusNextHeaderRow(focusedHeader: HeaderPosition, direction: 'Before' | 'After', event: KeyboardEvent): boolean {
        const currentIndex = focusedHeader.headerRowIndex;
        let nextPosition: HeaderPosition | null = null;
        let nextRowIndex: number;

        if (direction === 'Before') {
            if (currentIndex > 0) {
                nextRowIndex = currentIndex - 1;
                nextPosition = this.headerPositionUtils.findColAtEdgeForHeaderRow(nextRowIndex, 'end')!;
            }
        } else {
            nextRowIndex = currentIndex + 1;
            nextPosition = this.headerPositionUtils.findColAtEdgeForHeaderRow(nextRowIndex, 'start')!;
        }

        return this.focusService.focusHeaderPosition({
            headerPosition: nextPosition,
            direction,
            fromTab: true,
            allowUserOverride: true,
            event
        });
    }

    public scrollToColumn(column: Column | ColumnGroup, direction: 'Before' | 'After' | null = 'After'): void {
        if (column.getPinned()) { return; }

        let columnToScrollTo: Column;

        if (column instanceof ColumnGroup) {
            const columns = column.getDisplayedLeafColumns();
            columnToScrollTo = direction === 'Before' ? last(columns) : columns[0];
        } else {
            columnToScrollTo = column;
        }

        this.gridBodyCon.getScrollFeature().ensureColumnVisible(columnToScrollTo);
    }
}
