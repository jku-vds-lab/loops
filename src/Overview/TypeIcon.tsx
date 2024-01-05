import '@armantang/html-diff/dist/index.css';
import { createStyles } from '@mantine/core';
import { IconChartHistogram, IconCode, IconMarkdown, IconTable } from '@tabler/icons-react';
import React from 'react';
import { IExecutionBadgeProps } from './ExecutionBadge';

const useStyles = createStyles((theme, _params) => ({
  typeIcon: {
    position: 'absolute',
    top: '1px',
    left: '1px',
    width: '0.8rem',
    height: '0.8rem',
    zIndex: 1,

    // backgroundColor: 'var(--jp-brand-color1)',
    color: '#333',
    fontSize: '0.6rem',
    fontWeight: 'bold',
    lineHeight: '0.8rem',
    textAlign: 'center',

    borderRadius: '50%',

    label: 'type-icon'
  }
}));

interface ITypeIconProps extends IExecutionBadgeProps {
  type: 'markdown' | 'code' | 'data' | 'img';
}

/** parent needs to have positon:relative set */
export function TypeIcon({ type, executions }: ITypeIconProps): JSX.Element {
  const { classes, cx } = useStyles();

  if (executions === 0) {
    return <></>;
  }

  let icon = <></>;
  switch (type) {
    case 'markdown':
      icon = <IconMarkdown size={12}></IconMarkdown>;
      break;
    case 'code':
      icon = <IconCode size={12}></IconCode>;
      break;
    case 'data':
      icon = <IconTable size={12}></IconTable>;
      break;
    case 'img':
      icon = <IconChartHistogram size={12}></IconChartHistogram>;
  }

  return <div className={cx(classes.typeIcon)}>{icon}</div>;
}
