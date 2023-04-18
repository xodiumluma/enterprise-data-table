import { Group } from '@tweenjs/tween.js';
import { AgElementFinder } from '../agElements';
import { Mouse } from '../createMouse';
import { findElementWithInnerText } from '../dom';
import { ScriptDebugger } from '../scriptDebugger';
import { EasingFunction } from '../tween';
import { createMoveMouse } from './createMoveMouse';
import { mouseClick } from './mouseClick';
import { waitFor } from './waitFor';

export interface ClickOnContextMenuItemParams {
    mouse: Mouse;
    cellColIndex: number;
    cellRowIndex: number;
    menuItemPath: string[];
    speed?: number;
    duration?: number;
    tweenGroup: Group;
    /**
     * Easing function
     *
     * @see https://createjs.com/docs/tweenjs/classes/Ease.html
     */
    easing?: EasingFunction;
    agElementFinder: AgElementFinder;
    scriptDebugger?: ScriptDebugger;
}

export async function clickOnContextMenuItem({
    mouse,
    cellColIndex,
    cellRowIndex,
    menuItemPath,
    speed,
    duration,
    tweenGroup,
    easing,
    agElementFinder,
    scriptDebugger,
}: ClickOnContextMenuItemParams): Promise<void> {
    await mouseClick({
        mouse,
        coords: agElementFinder
            .get('cell', {
                colIndex: cellColIndex,
                rowIndex: cellRowIndex,
            })
            ?.getPos()!,
        clickType: 'right',
        scriptDebugger,
    });
    await waitFor(200);

    for (let i = 0; i < menuItemPath.length; i++) {
        const menuItemName = menuItemPath[i];

        const coords = agElementFinder
            .get('contextMenuItem', {
                text: menuItemName,
            })
            ?.getPos();
        const menuItemTextEl = findElementWithInnerText({ selector: '.ag-menu-option-text', text: menuItemName });
        const menuItemEl = menuItemTextEl?.parentElement;
        const isLastMenuItem = i === menuItemPath.length - 1;
        if (!coords || !menuItemEl) {
            scriptDebugger?.errorLog(`Cannot find menu item: ${menuItemName}`);
            break;
        }

        await createMoveMouse({
            mouse,
            toPos: coords,
            speed,
            duration,
            tweenGroup,
            easing,
            scriptDebugger,
        });
        if (isLastMenuItem) {
            mouse.click();
            await waitFor(500);
        }

        // Use keyboard event to fake a click
        menuItemEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

        await waitFor(500);
    }
}
