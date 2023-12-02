import { HeaderGroupCellCtrl, IHeaderGroupCellComp, IHeaderGroupComp, UserCompDetails } from 'ag-grid-community';
import React, { memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BeansContext } from '../beansContext';
import { showJsComp } from '../jsComp';
import { CssClasses } from '../utils';

const HeaderGroupCellComp = (props: {ctrl: HeaderGroupCellCtrl}) => {

    const {context} = useContext(BeansContext);
    const { ctrl } = props;

    const [cssClasses, setCssClasses] = useState<CssClasses>(() => new CssClasses());
    const [cssResizableClasses, setResizableCssClasses] = useState<CssClasses>(() => new CssClasses());
    const [resizableAriaHidden, setResizableAriaHidden] = useState<"true" | "false">("false");
    const [ariaExpanded, setAriaExpanded] = useState<'true'|'false'|undefined>();
    const [userCompDetails, setUserCompDetails] = useState<UserCompDetails>();
    const colId = useMemo(() => ctrl.getColId(), []);

    const eGui = useRef<HTMLDivElement | null>(null);
    const eResize = useRef<HTMLDivElement>(null);
    const userCompRef = useRef<IHeaderGroupComp>();


    const setRef = useCallback((e: HTMLDivElement) => {
        eGui.current = e;
        if (!eGui.current) {
            return;
        }
        const compProxy: IHeaderGroupCellComp = {
            setWidth: width => {
                if (eGui.current) {
                    eGui.current.style.width = width;
                }
            },
            addOrRemoveCssClass: (name, on) => setCssClasses(prev => prev.setClass(name, on)),
            setUserCompDetails: compDetails => setUserCompDetails(compDetails),
            setResizableDisplayed: (displayed) => {
                setResizableCssClasses(prev => prev.setClass('ag-hidden', !displayed))
                setResizableAriaHidden(!displayed ? "true" : "false");
            },
            setAriaExpanded: expanded => setAriaExpanded(expanded),
            getUserCompInstance: () => userCompRef.current || undefined,
        };

        ctrl.setComp(compProxy, eGui.current, eResize.current!);

    }, []);

    // js comps
    useLayoutEffect(() => showJsComp(userCompDetails, context, eGui.current!), [userCompDetails]);

    // add drag handling, must be done after component is added to the dom
    useEffect(()=> {
        if (eGui.current) {
            ctrl.setDragSource(eGui.current);
        }
    }, [userCompDetails]);

    const className = useMemo( ()=> 'ag-header-group-cell ' + cssClasses.toString(), [cssClasses] );
    const resizableClassName = useMemo( ()=> 'ag-header-cell-resize ' + cssResizableClasses.toString(), [cssResizableClasses] );

    const reactUserComp = userCompDetails && userCompDetails.componentFromFramework;
    const UserCompClass = userCompDetails && userCompDetails.componentClass;

    return (
        <div ref={setRef} className={className} col-id={colId} 
                    role="columnheader" tabIndex={-1} aria-expanded={ariaExpanded}>
            { reactUserComp && <UserCompClass { ...userCompDetails!.params } ref={ userCompRef } /> }
            <div ref={eResize} aria-hidden={resizableAriaHidden} className={resizableClassName}></div>
        </div>
    );
};

export default memo(HeaderGroupCellComp);