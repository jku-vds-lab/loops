import React, { useEffect } from 'react';
import { CellProvenance } from '../../Provenance/JupyterListener';
import HtmlDiff from '@armantang/html-diff';
import { TypeIcon } from './TypeIcon';
import { ExecutionBadge } from './ExecutionBadge';
import { CellUsers } from './CellUsers';
import { CompareBadge } from './CompareBadge';
import { User } from '@jupyterlab/services';
import parse from 'html-react-parser';
import { createStyles } from '@mantine/styles';

const useStyles = createStyles((theme, _params) => ({
  tinyHeight: {
    height: '12.8px'
  }
}));

export interface IMarkdownCellProps {
  fullWidth: boolean;
  multiUser: boolean;

  cell: CellProvenance;
  cellId: string;
  isActiveCell: boolean;
  stateNo: number;
  timestamp: Date;
  executions: number;
  cellExecutions: Map<string, { count: number; user: User.IIdentity[] }>;

  previousCell?: CellProvenance;
  previousStateNo?: number;
  previousStateTimestamp?: Date;

  setActiveCell: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  toggleFullwidth: () => void;
}

export function MarkdownCell({
  fullWidth,
  multiUser,

  cell,
  cellId,
  isActiveCell,
  stateNo,
  timestamp,
  executions,
  cellExecutions,

  previousCell,
  previousStateNo,
  previousStateTimestamp,

  setActiveCell,
  toggleFullwidth
}: IMarkdownCellProps): JSX.Element {
  const { classes, cx } = useStyles();

  const added = previousCell === undefined;
  const changed = previousCell && cell.inputModel.source.toString() !== previousCell.inputModel.source.toString();

  const [detailDiffContent, setDetailDiffContent] = React.useState([] as JSX.Element[]);

  // console.log('rendering markdown cell diff');
  useEffect(() => {
    const diffHtml = () => {
      // console.log('creating markdown cell diff');
      const contents = cell.outputHTML.map((output, outputIndex) => {
        let content = output;
        if (previousCell?.outputHTML[outputIndex] && content) {
          const diff = new HtmlDiff(previousCell.outputHTML[outputIndex], content);
          if (diff.newWords.length + diff.oldWords.length !== 0) {
            content = diff.getUnifiedContent();
          }
        }
        return parse(content) as JSX.Element;
      });
      return contents;
    };
    const htmlDiffContent = diffHtml();
    setDetailDiffContent(htmlDiffContent);
  }, [cell, previousCell, setDetailDiffContent]);

  if (fullWidth) {
    return (
      <div
        id={`${stateNo}-${cellId}`}
        data-cell-id={cellId}
        onClick={setActiveCell}
        onDoubleClick={toggleFullwidth}
        className={cx(
          'jp-Cell',
          { ['active']: isActiveCell === true },
          { ['added']: added },
          { ['executed']: executions > 0 },
          { ['changed']: changed }
        )}
      >
        <TypeIcon type={'markdown'} executions={executions} />
        {multiUser ? <CellUsers cellUsers={cellExecutions.get(cellId)?.user ?? []} /> : <></>}
        <ExecutionBadge executions={executions} />
        {
          // Add CompareBadge if old, oldStateNo, and oldTimestamp are defined
          previousCell && previousStateNo && previousStateTimestamp && (
            <CompareBadge
              old={previousCell}
              oldStateNo={previousStateNo}
              oldTimestamp={previousStateTimestamp}
              current={cell}
              currentStateNo={stateNo}
              currentTimestamp={timestamp}
            />
          )
        }
        {detailDiffContent}
      </div>
    );
  }
  //else: compact
  return (
    <div
      id={`${stateNo}-${cellId}`}
      data-cell-id={cellId}
      onClick={setActiveCell}
      onDoubleClick={toggleFullwidth}
      className={cx(
        'jp-Cell',
        { ['active']: isActiveCell === true },
        { ['added']: added },
        { ['executed']: executions > 0 },
        { ['changed']: changed }
      )}
    >
      <TypeIcon type={'markdown'} executions={executions} />
      <ExecutionBadge executions={executions} />
      <div className={cx(classes.tinyHeight)}></div>
    </div>
  );
}
