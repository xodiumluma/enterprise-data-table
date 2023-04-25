import { ICellEditorParams } from '@ag-grid-community/core';
import { ICellEditorReactComp } from '@ag-grid-community/react';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

// backspace starts the editor on Windows
const KEY_BACKSPACE = 'Backspace';

export interface MySimpleInterface extends ICellEditorReactComp {
    myCustomFunction(): { rowIndex: number, colId: string };
}

export default forwardRef((props: ICellEditorParams, ref) => {
    const getInitialValue = (props: ICellEditorParams) => {
        let startValue = props.value;

        const isBackspace = props.eventKey === KEY_BACKSPACE;
        if (isBackspace) {
            startValue = '';
        } else if (props.charPress) {
            startValue = props.charPress;
        }

        if (startValue !== null && startValue !== undefined) {
            return startValue;
        }

        return '';
    }

    const [value, setValue] = useState(getInitialValue(props));
    const refInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        refInput.current!.focus();
    }, []);


    useImperativeHandle(ref, () => {
        return {
            getValue() {
                return value;
            },

            myCustomFunction() {
                return {
                    rowIndex: props.rowIndex,
                    colId: props.column.getId()
                };
            }
        };
    });

    return (
        <input value={value}
            ref={refInput}
            onChange={event => setValue(event.target.value)}
            className="my-simple-editor" />
    );
})
