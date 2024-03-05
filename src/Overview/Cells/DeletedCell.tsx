import React from 'react';

export interface IDeletedCellProps {
  cellId: string;
  isActiveCell: boolean;
}

export function DeletedCell({ cellId, isActiveCell }: IDeletedCellProps): JSX.Element {
  // console.log('render deleted cell');
  return (
    <div data-cell-id={cellId} className={`jp-Cell deleted  ${isActiveCell === true ? 'active' : ''}`}>
      <div style={{ height: '12.8px' }}></div>
    </div>
  );
}
