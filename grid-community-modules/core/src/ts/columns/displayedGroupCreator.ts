import { Column, ColumnPinnedType } from "../entities/column";
import { GroupInstanceIdCreator } from "./groupInstanceIdCreator";
import { IHeaderColumn } from "../interfaces/iHeaderColumn";
import { ColumnGroup } from "../entities/columnGroup";
import { ProvidedColumnGroup } from "../entities/providedColumnGroup";
import { Bean } from "../context/context";
import { BeanStub } from "../context/beanStub";
import { exists } from "../utils/generic";

// takes in a list of columns, as specified by the column definitions, and returns column groups
@Bean('displayedGroupCreator')
export class DisplayedGroupCreator extends BeanStub {

    public createDisplayedGroups(
        // all displayed columns sorted - this is the columns the grid should show
        sortedVisibleColumns: Column[],
        // creates unique id's for the group
        groupInstanceIdCreator: GroupInstanceIdCreator,
        // whether it's left, right or center col
        pinned: ColumnPinnedType,
        // we try to reuse old groups if we can, to allow gui to do animation
        oldDisplayedGroups?: IHeaderColumn[]): IHeaderColumn[] {
        const oldColumnsMapped = this.mapOldGroupsById(oldDisplayedGroups!);

        /**
         * The following logic starts at the leaf level of columns, iterating through them to build their parent
         * groups when the parents match.
         * 
         * The created groups are then added to an array, and similarly iterated on until we reach the top level.
         * 
         * When row groups have no original parent, it's added to the result.
         */
        const topLevelResultCols: (Column | ColumnGroup)[] = [];
        
        // this is an array of cols or col groups at one level of depth, starting from leaf and ending at root
        let groupsOrColsAtCurrentLevel: (Column | ColumnGroup)[] = sortedVisibleColumns;
        while (groupsOrColsAtCurrentLevel.length) {
            // store what's currently iterating so the function can build the next level of col groups
            const currentlyIterating = groupsOrColsAtCurrentLevel;
            groupsOrColsAtCurrentLevel = [];

            // store the index of the last row which was different from the previous row, this is used as a slice
            // index for finding the children to group together
            let lastGroupedColIdx = 0;

            // create a group of children from lastGroupedColIdx to the provided `to` parameter
            const createGroupToIndex = (to: number) => {
                const from = lastGroupedColIdx;
                lastGroupedColIdx = to;

                const previousNode = currentlyIterating[from];
                const previousNodeProvided = previousNode instanceof ColumnGroup ? previousNode.getProvidedColumnGroup() : previousNode;
                const previousNodeParent = previousNodeProvided.getOriginalParent();

                if (previousNodeParent == null) {
                    // if the last node was different, and had a null parent, then we add all the nodes to the final
                    // results)
                    for (let i = from; i < to; i++) {
                        topLevelResultCols.push(currentlyIterating[i]);
                    }
                    return;
                }

                // the parent differs from the previous node, so we create a group from the previous node
                // and add all to the result array, except the current node.
                const newGroup = this.createColumnGroup(
                    previousNodeParent,
                    groupInstanceIdCreator,
                    oldColumnsMapped,
                    pinned
                );

                for (let i = from; i < to; i++) {
                    newGroup.addChild(currentlyIterating[i]);
                }
                groupsOrColsAtCurrentLevel.push(newGroup);
            };

            for (let i = 1; i < currentlyIterating.length; i++) {
                const thisNode = currentlyIterating[i];
                const thisNodeProvided = thisNode instanceof ColumnGroup ? thisNode.getProvidedColumnGroup() : thisNode;
                const thisNodeParent = thisNodeProvided.getOriginalParent();

                const previousNode = currentlyIterating[lastGroupedColIdx];
                const previousNodeProvided = previousNode instanceof ColumnGroup ? previousNode.getProvidedColumnGroup() : previousNode;
                const previousNodeParent = previousNodeProvided.getOriginalParent();

                if (thisNodeParent !== previousNodeParent) {
                    createGroupToIndex(i);
                }
            }

            if (lastGroupedColIdx < currentlyIterating.length) {
                createGroupToIndex(currentlyIterating.length);
            }
        }
        this.setupParentsIntoColumns(topLevelResultCols, null);
        return topLevelResultCols;
    }

    private createColumnGroup(
            providedGroup: ProvidedColumnGroup,
            groupInstanceIdCreator: GroupInstanceIdCreator,
            oldColumnsMapped: {[key: string]: ColumnGroup},
            pinned: ColumnPinnedType
        ): ColumnGroup {

        const groupId = providedGroup.getGroupId();
        const instanceId = groupInstanceIdCreator.getInstanceIdForKey(groupId);
        const uniqueId = ColumnGroup.createUniqueId(groupId, instanceId);

        let columnGroup: ColumnGroup | null = oldColumnsMapped[uniqueId];

        // if the user is setting new colDefs, it is possible that the id's overlap, and we
        // would have a false match from above. so we double check we are talking about the
        // same original column group.
        if (columnGroup && columnGroup.getProvidedColumnGroup() !== providedGroup) {
            columnGroup = null;
        }

        if (exists(columnGroup)) {
            // clean out the old column group here, as we will be adding children into it again
            columnGroup.reset();
        } else {
            columnGroup = new ColumnGroup(providedGroup, groupId, instanceId, pinned);
            this.context.createBean(columnGroup);
        }

        return columnGroup;
    }

    // returns back a 2d map of ColumnGroup as follows: groupId -> instanceId -> ColumnGroup
    private mapOldGroupsById(displayedGroups: IHeaderColumn[]): {[uniqueId: string]: ColumnGroup} {
        const result: {[uniqueId: string]: ColumnGroup} = {};

        const recursive = (columnsOrGroups: IHeaderColumn[] | null) => {
            columnsOrGroups!.forEach(columnOrGroup => {
                if (columnOrGroup instanceof ColumnGroup) {
                    const columnGroup = columnOrGroup;
                    result[columnOrGroup.getUniqueId()] = columnGroup;
                    recursive(columnGroup.getChildren());
                }
            });
        };

        if (displayedGroups) {
            recursive(displayedGroups);
        }

        return result;
    }

    private setupParentsIntoColumns(columnsOrGroups: IHeaderColumn[] | null, parent: ColumnGroup | null): void {
        columnsOrGroups!.forEach(columnsOrGroup => {
            columnsOrGroup.setParent(parent);
            if (columnsOrGroup instanceof ColumnGroup) {
                const columnGroup = columnsOrGroup;
                this.setupParentsIntoColumns(columnGroup.getChildren(), columnGroup);
            }
        });
    }
}
