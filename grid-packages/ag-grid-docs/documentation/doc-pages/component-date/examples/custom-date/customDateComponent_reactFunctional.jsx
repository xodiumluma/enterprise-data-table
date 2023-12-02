import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export default forwardRef((props, ref) => {

    const [date, setDate] = useState(null);
    const [picker, setPicker] = useState(null);
    const refFlatPickr = useRef(null);
    const refInput = useRef(null);

    // we use a ref as well as state, as state is async,
    // and after the grid calls setDate() (eg when setting filter model)
    // it then can call getDate() immediately (eg to execute the filter)
    // and we need to pass back the most recent value, not the old 'current state'.
    const dateRef = useRef(null);

    //*********************************************************************************
    //          LINKING THE UI, THE STATE AND AG-GRID
    //*********************************************************************************

    const onDateChanged = (selectedDates) => {
        const newDate = selectedDates[0];
        setDate(newDate);
        dateRef.current = newDate;
        props.onDateChanged();
    };

    useEffect(() => {
        setPicker(flatpickr(refFlatPickr.current, {
            onChange: onDateChanged,
            dateFormat: 'd/m/Y',
            wrap: true
        }));
    }, []);

    useEffect(() => {
        if (picker) {
            picker.calendarContainer.classList.add('ag-custom-component-popup');
        }
    }, [picker]);

    useEffect(() => {
        //Callback after the state is set. This is where we tell ag-grid that the date has changed so
        //it will proceed with the filtering and we can then expect AG Grid to call us back to getDate
        if (picker) {
            picker.setDate(date);
        }
    }, [date, picker]);

    useImperativeHandle(ref, () => ({
        //*********************************************************************************
        //          METHODS REQUIRED BY AG-GRID
        //*********************************************************************************
        getDate() {
            //ag-grid will call us here when in need to check what the current date value is hold by this
            //component.
            return dateRef.current;
        },

        setDate(date) {
            //ag-grid will call us here when it needs this component to update the date that it holds.
            dateRef.current = date;
            setDate(date);
        },

        //*********************************************************************************
        //          AG-GRID OPTIONAL METHODS
        //*********************************************************************************

        setInputPlaceholder(placeholder) {
            if (refInput.current) {
                refInput.current.setAttribute('placeholder', placeholder);
            }
        },

        setInputAriaLabel(label) {
            if (refInput.current) {
                refInput.current.setAttribute('aria-label', label);
            }
        }
    }));

    // inlining styles to make simpler the component
    return (
        <div className="ag-input-wrapper custom-date-filter" role="presentation" ref={refFlatPickr}>
            <input type="text" ref={refInput} data-input style={{ width: "100%" }} />
            <a className='input-button' title='clear' data-clear>
                <i className='fa fa-times'></i>
            </a>
        </div>
    );
});
