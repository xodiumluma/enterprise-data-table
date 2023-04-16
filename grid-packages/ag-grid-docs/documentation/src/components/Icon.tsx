import * as CarbonIcon from '@carbon/icons-react';
import classNames from 'classnames';
import React from 'react';
import BoldChevronRight from '../images/inline-svgs/bold-chevron-right.svg';
import EnterpriseIcon from '../images/inline-svgs/enterprise.svg';
import ReplayDemoIcon from '../images/inline-svgs/replay-demo-icon.svg';
import TakeControlIcon from '../images/inline-svgs/take-control-icon.svg';
import styles from './Icon.module.scss';

// Uses IBM Carbon Design System icons as a base
// Full list of Carbon icons => https://carbondesignsystem.com/guidelines/icons/library

export const ICON_MAP = {
    info: CarbonIcon.Information,
    warning: CarbonIcon.WarningAlt,
    email: CarbonIcon.Email,
    creditCard: CarbonIcon.Purchase,
    lightBulb: CarbonIcon.Idea,
    enterprise: EnterpriseIcon,
    github: CarbonIcon.LogoGithub,
    twitter: CarbonIcon.LogoTwitter,
    youtube: CarbonIcon.LogoYoutube,
    linkedin: CarbonIcon.LogoLinkedin,
    collapseCategories: CarbonIcon.CollapseCategories,
    search: CarbonIcon.Search,
    arrowUp: CarbonIcon.ArrowUp,
    arrowRight: CarbonIcon.ArrowRight,
    arrowDown: CarbonIcon.ArrowDown,
    arrowLeft: CarbonIcon.ArrowLeft,
    link: CarbonIcon.Link,
    cursor: CarbonIcon.Cursor_1,
    chevronRight: BoldChevronRight,
    centerToFit: CarbonIcon.CenterToFit,
    sidePanelClose: CarbonIcon.SidePanelClose,
    replaydemo: ReplayDemoIcon,
    takeControl: TakeControlIcon,
};

export type IconName = keyof typeof ICON_MAP;

type Props = { name: IconName; svgClasses?: string };

export const Icon = ({ name, svgClasses }: Props) => {
    const IconSvg = ICON_MAP[name];

    return <IconSvg size="32" className={classNames(styles.icon, 'icon', svgClasses)} />;
};
