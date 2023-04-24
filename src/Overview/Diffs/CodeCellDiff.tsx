import React from 'react';
import { createStyles } from '@mantine/core';

const useStyles = createStyles((theme, _params, getRef) => ({
  codeCell: {
    // TODO read on why the Juypter CSS is selected over mine
    border: '1px dashed lightgray !important',
    padding: '5px',
    margin: '5px',
    borderRadius: '5px !important',
    whiteSpace: 'pre-wrap'
  },
  active: {
    border: '1px solid #7389FF !important'
  }
}));

interface ICodeCellDiffProps {
  active: boolean;
  children: JSX.Element;
}

export function CodeCellDiff({ active, children }: ICodeCellDiffProps): JSX.Element {
  const { classes } = useStyles();
  return <div className={`${classes.codeCell} ${active ? classes.active : ''} cell CodeMirror`}>{children}</div>;
}
