import { ICellRendererParams } from '@ag-grid-community/core';
import React from 'react';

export interface ImageCellRendererParams extends ICellRendererParams {
    rendererImage: string
}

export default (props: ImageCellRendererParams) => (
    <span>
        {
            new Array(props.value).fill('')
                .map((_, idx) =>
                    (<img key={idx} src={`https://www.ag-grid.com/example-assets/weather/${props.rendererImage}`} />)
                )
        }
    </span>
);

