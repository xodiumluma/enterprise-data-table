import React from 'react';
import { ICellRendererParams } from '@ag-grid-community/core';

export default (props: ICellRendererParams) => (
    props.value != null &&
    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <span style={{
            borderLeft: '10px solid ' + props.value,
            paddingRight: '5px'
        }}></span>{props.value}
    </div>
)
