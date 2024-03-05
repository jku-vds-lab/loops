import React from 'react';

export interface IDeletedCellProps {
  cellId: string;
  isActiveCell: boolean;
  stateNo: number;
}

export function DeletedCell({ cellId, isActiveCell, stateNo }: IDeletedCellProps): JSX.Element {
  // console.log('render deleted cell');
  return (
    <div
      id={`${stateNo}-${cellId}`}
      data-cell-id={cellId}
      className={`jp-Cell deleted  ${isActiveCell === true ? 'active' : ''}`}
    >
      <div style={{ height: '12.8px' }}></div>
    </div>
  );
}
