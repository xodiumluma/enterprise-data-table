import React, { memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BeansContext } from '../beansContext';
import { CssClassManager, HeaderCellCtrl, IHeader, IHeaderCellComp, UserCompDetails, _ } from '@ag-grid-community/core';
import { isComponentStateless } from '../utils';
import { showJsComp } from '../jsComp';

const HeaderCellComp = (props: {ctrl: HeaderCellCtrl}) => {

    const { ctrl } = props;

    const { context } = useContext(BeansContext);
    const colId = ctrl.getColId();
    const [userCompDetails, setUserCompDetails] = useState<UserCompDetails>();

    const eGui = useRef<HTMLDivElement | null>(null);
    const eResize = useRef<HTMLDivElement>(null);
    const eHeaderCompWrapper = useRef<HTMLDivElement>(null);
    const userCompRef = useRef<IHeader>();

    let cssClassManager = useRef<CssClassManager>();
    if (!cssClassManager.current) {
        cssClassManager.current = new CssClassManager(() => eGui.current);
    }
    const setRef = useCallback((e: HTMLDivElement) => {
        eGui.current = e;
        if (!eGui.current) {
            // Any clean up required?
            return;
        }

        const compProxy: IHeaderCellComp = {
            setWidth: width => {
                if (eGui.current) {
                    eGui.current.style.width = width;
                }
            },
            addOrRemoveCssClass: (name, on) => cssClassManager.current!.addOrRemoveCssClass(name, on),
            setAriaDescription: label => {
                if (eGui.current) {
                    _.setAriaDescription(eGui.current, label)
                }
            },
            setAriaSort: sort => {
                if (eGui.current) {
                    sort ? _.setAriaSort(eGui.current, sort) : _.removeAriaSort(eGui.current)
                }
            },
            setUserCompDetails: compDetails => setUserCompDetails(compDetails),
            getUserCompInstance: () => userCompRef.current || undefined
        };

        ctrl.setComp(compProxy, eGui.current, eResize.current!, eHeaderCompWrapper.current!);

        const selectAllGui = ctrl.getSelectAllGui();
        eResize.current?.insertAdjacentElement('afterend', selectAllGui);
    }, []);

    // js comps
    useLayoutEffect(() => showJsComp(userCompDetails, context, eHeaderCompWrapper.current!, userCompRef), [userCompDetails]);

    // add drag handling, must be done after component is added to the dom
    useEffect(() => {
        ctrl.setDragSource(eGui.current!);
    }, [userCompDetails]);

    const userCompStateless = useMemo(() => {
        const res = userCompDetails?.componentFromFramework && isComponentStateless(userCompDetails.componentClass);
        return !!res;
    }, [userCompDetails]);

    const reactUserComp = userCompDetails && userCompDetails.componentFromFramework;
    const UserCompClass = userCompDetails && userCompDetails.componentClass;

    return (
        <div
            ref={setRef}
            className="ag-header-cell"
            col-id={colId}
            role="columnheader"
            tabIndex={-1}
        >
            <div ref={eResize} className="ag-header-cell-resize" role="presentation"></div>
            <div ref={eHeaderCompWrapper} className="ag-header-cell-comp-wrapper" role="presentation">
            { reactUserComp && userCompStateless && <UserCompClass { ...userCompDetails!.params } /> }
            { reactUserComp && !userCompStateless && <UserCompClass { ...userCompDetails!.params } ref={ userCompRef }/> }
            </div>
        </div>
    );
};

export default memo(HeaderCellComp);
