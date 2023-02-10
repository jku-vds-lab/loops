import { ReactWidget } from '@jupyterlab/apputils';
import React from 'react';

/**
 * React component for a counter.
 *
 * @returns The React component
 */
const DiffDetailComponent = (): JSX.Element => {
  return (
    <div className="diff-detail">
      <h1>Details</h1>
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
  constructor() {
    super();
    this.addClass('jp-ReactWidget');
    this.id = 'DiffDetail';
  }

  render(): JSX.Element {
    return <DiffDetailComponent />;
  }
}
