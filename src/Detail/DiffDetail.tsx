import { ReactWidget } from '@jupyterlab/apputils';
import { createStyles } from '@mantine/core';
import React from 'react';

const useStyles = createStyles((theme, _params, getRef) => ({
  diffDetail: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',

    '.jp-InputArea-editor': {
      display: 'block'
    }
  }
}));

interface IDiffDetailComponentProps {
  old?: string;
  current?: string;
}

/**
 * React component for a counter.
 *
 * @returns The React component
 */
const DiffDetailComponent = ({ old, current }: IDiffDetailComponentProps): JSX.Element => {
  const { classes, cx } = useStyles();

  return (
    <div className={cx(classes.diffDetail, 'diff-detail')}>
      {old ? <div dangerouslySetInnerHTML={{ __html: old }}></div> : <div>empty</div>}
      <div dangerouslySetInnerHTML={{ __html: current ?? '' }}></div>
    </div>
  );
};

/**
 * A Counter Lumino Widget that wraps a CounterComponent.
 */
export class DiffDetail extends ReactWidget {
  /**
   * Constructs a new CounterWidget.
   */
  constructor(private old, private current) {
    super();
    this.addClass('jp-ReactWidget');
    this.id = 'DiffDetail';
    this.title.label = 'Cell Difference';
    this.title.closable = true;
  }

  render(): JSX.Element {
    return <DiffDetailComponent old={this.old} current={this.current} />;
  }
}
