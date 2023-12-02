import { AbstractColDef } from "../entities/colDef";
import { IEventEmitter } from "./iEventEmitter";
import { ColumnGroup, ColumnGroupShowType } from "../entities/columnGroup";
import { ColumnPinnedType } from "../entities/column";

// Implemented by Column and ColumnGroup. Allows the groups to contain a list of this type for it's children.
// See the note at the top of Column class.
export interface IHeaderColumn<TValue = any> extends IEventEmitter {
    getUniqueId(): string;
    getActualWidth(): number;
    getMinWidth(): number | null | undefined;
    getLeft(): number | null;
    getOldLeft(): number | null;
    getDefinition(): AbstractColDef<TValue> | null;
    getColumnGroupShow(): ColumnGroupShowType | undefined;
    getParent(): IHeaderColumn;
    isResizable(): boolean;
    setParent(parent: ColumnGroup | null): void;
    isEmptyGroup(): boolean;
    isMoving(): boolean;
    getPinned(): ColumnPinnedType;
}
