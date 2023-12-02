import { IAfterGuiAttachedParams, IDoesFilterPassParams, IFilterParams } from '@ag-grid-community/core';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

export default forwardRef((props: IFilterParams, ref) => {
    const [text, setText] = useState('');
    const refInput = useRef(null);

    useEffect(() => {
        props.filterChangedCallback()
    }, [text])

    useImperativeHandle(ref, () => {
        return {
            isFilterActive() {
                return text != null && text !== '';
            },

            doesFilterPass(params: IDoesFilterPassParams) {
                const { node } = params;
                const value = props.getValue(node).toString().toLowerCase();

                return text.toLowerCase()
                    .split(' ')
                    .every(filterWord => value.indexOf(filterWord) >= 0);
            },

            getModel() {
                if (!this.isFilterActive()) { return null; }

                return { value: text };
            },

            setModel(model: any) {
                setText(model ? model.value : '');
            },

            afterGuiAttached(params: IAfterGuiAttachedParams) {
                focus();
            },

            componentMethod(message: string) {
                alert(`Alert from PartialMatchFilterComponent: ${message}`);
            }
        }
    });

    const focus = () => {
        window.setTimeout(() => {
            const container = ReactDOM.findDOMNode(refInput.current) as any;
            if (container) {
                container.focus();
            }
        });
    }

    const onChange = (event: any) => {
        const newValue = event.target.value;
        if (text !== newValue) {
            setText(newValue);
        }
    }

    const style = {
        borderRadius: '5px',
        backgroundColor: '#33CC3344',
        width: '200px',
        height: '50px'
    };

    return (
        <div style={style}>Filter:
            <input style={{ height: '20px' }} ref={refInput}
                value={text}
                onChange={onChange}
                className="form-control" />
        </div>
    );

});
