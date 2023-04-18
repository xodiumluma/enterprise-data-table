import { Group } from '@tweenjs/tween.js';
import { GridOptions } from 'ag-grid-community';
import { Mouse } from '../../lib/createMouse';
import { ScriptDebugger } from '../../lib/scriptDebugger';
import { createScriptRunner as createScriptRunnerCore, RunScriptState } from '../../lib/scriptRunner';
import { EasingFunction } from '../../lib/tween';
import { createScript } from './createScript';

interface Params {
    mouse: Mouse;
    containerEl: HTMLElement;
    onStateChange?: (state: RunScriptState) => void;
    tweenGroup: Group;
    gridOptions: GridOptions;
    loop?: boolean;
    scriptDebugger?: ScriptDebugger;
    defaultEasing?: EasingFunction;
}

export function createScriptRunner({
    containerEl,
    mouse,
    onStateChange,
    tweenGroup,
    gridOptions,
    loop,
    scriptDebugger,
    defaultEasing,
}: Params) {
    const script = createScript({
        containerEl,
        mouse,
        tweenGroup,
        scriptDebugger,
    });

    const scriptRunner = createScriptRunnerCore({
        containerEl,
        mouse,
        script,
        gridOptions,
        loop,
        tweenGroup,
        onStateChange: (state) => {
            if (state === 'stopping') {
                mouse.hide();
            } else if (state === 'inactive') {
                mouse.hide();
            }

            onStateChange && onStateChange(state);
        },
        scriptDebugger,
        defaultEasing,
    });
    scriptDebugger?.setScriptRunner(scriptRunner);

    return scriptRunner;
}
