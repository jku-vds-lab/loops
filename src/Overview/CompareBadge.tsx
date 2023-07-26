import '@armantang/html-diff/dist/index.css';
import { createStyles } from '@mantine/core';
import React, { useContext } from 'react';
import {
  IconCodeCircle,
  IconCodeCircle2,
  IconEye,
  IconEyeFilled,
  IconGitCompare,
  IconVersionsFilled,
  IconZoomCode
} from '@tabler/icons-react';
import { JupyterAppContext } from './LoopsSidebar';
import { DiffDetail } from '../Detail/DiffDetail';

const useStyles = createStyles((theme, _params, getRef) => ({
  CompareBadge: {
    label: 'CompareBadge',

    position: 'absolute',
    top: '-0.25rem',
    right: '0.75rem',
    height: '0.8rem',
    zIndex: 1,
    padding: '0 0.4rem',

    backgroundColor: '#333',
    color: 'white',
    lineHeight: '0.8rem',
    fontSize: '0.8rem',
    textAlign: 'center',

    borderRadius: '0.4rem',

    cursor: 'pointer'
  }
}));

interface ICompareBadgeProps {
  old?: Node;
  current?: Node;
}

/** parent needs to have positon:relative set */
export function CompareBadge({ old, current }: ICompareBadgeProps): JSX.Element {
  const { classes, cx } = useStyles();

  const app = useContext(JupyterAppContext);

  const openDetails = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const detail = new DiffDetail(old, current);
    app.shell.add(detail, 'down'); // the sidebar
  };

  return (
    <div
      onClick={openDetails}
      onDoubleClick={e => e.stopPropagation()}
      className={cx(classes.CompareBadge, 'compare-badge')}
    >
      Diff
    </div>
  );
}
