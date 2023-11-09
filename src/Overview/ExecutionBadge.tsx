import '@armantang/html-diff/dist/index.css';
import { createStyles } from '@mantine/core';
import React from 'react';

const useStyles = createStyles((theme, _params, getRef) => ({
  executionBadge: {
    position: 'absolute',
    top: '0rem',
    right: '0rem',
    width: '0.8rem',
    height: '0.8rem',
    zIndex: 1,

    backgroundColor: 'var(--jp-brand-color1)',
    color: 'white',
    fontSize: '0.6rem',
    fontWeight: 'bold',
    lineHeight: '0.8rem',
    textAlign: 'center',

    borderRadius: '50%'
  }
}));

interface IExecutionBadgeProps {
  executions: number;
}

/** parent needs to have positon:relative set */
export function ExecutionBadge({ executions }: IExecutionBadgeProps): JSX.Element {
  const { classes, cx } = useStyles();

  if (executions === 0) {
    return <></>;
  }

  return <div className={cx(classes.executionBadge)}>{executions}</div>;
}
