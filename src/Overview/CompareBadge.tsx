import '@armantang/html-diff/dist/index.css';
import { createStyles } from '@mantine/core';
import React from 'react';
import {
  IconCodeCircle,
  IconCodeCircle2,
  IconEye,
  IconEyeFilled,
  IconGitCompare,
  IconVersionsFilled,
  IconZoomCode
} from '@tabler/icons-react';

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

    borderRadius: '0.4rem'
  }
}));

/** parent needs to have positon:relative set */
export function CompareBadge(): JSX.Element {
  const { classes, cx } = useStyles();

  return <div className={cx(classes.CompareBadge, 'compare-badge')}>Diff</div>;
}
