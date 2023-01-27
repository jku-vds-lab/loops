import React from 'react';
import { MultilineString } from '@jupyterlab/nbformat';
import { createStyles } from '@mantine/core';

const useStyles = createStyles((theme, _params, getRef) => ({
  codeCell: {
    border: '1px dashed lightgray !important',
    padding: '5px',
    margin: '5px',

    whiteSpace: 'pre-wrap'
  },
  active: {
    border: '1px solid red !important'
  }
}));

interface ICodeCellDiffProps {
  content: MultilineString;
  active: boolean;
}

export function CodeCellDiff({ active, content }: ICodeCellDiffProps) {
  const { classes } = useStyles();
  return (
    <div
      className={`cell CodeMirror ${classes.codeCell} ${
        active ? classes.active : ''
      }`}
    >
      {content}
    </div>
  );
}
