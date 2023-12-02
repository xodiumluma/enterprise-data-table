<framework-specific-section frameworks="vue">
<snippet transform={false} language="ts">
|loadingCellRendererSelector: (params) => {
|    const useCustomRenderer = ...some condition/check...
|    if (useCustomRenderer) {
|        return {
|            // the component to use - registered previously
|            component: 'customLoadingCellRenderer',
|            params: {
|                // parameters to supply to the custom loading cell renderer
|                loadingMessage: '--- CUSTOM LOADING MESSAGE ---',
|            },
|        };
|        } else {
|            // no loading cell renderer 
|            return undefined;
|        }
|    }
|}
</snippet>
</framework-specific-section>