import React, { ReactElement, useEffect } from 'react';
import { CellProvenance } from '../../Provenance/JupyterListener';
import HtmlDiff from '@armantang/html-diff';
import { TypeIcon } from './TypeIcon';
import { ExecutionBadge } from './ExecutionBadge';
import { CellUsers } from './CellUsers';
import { CompareBadge } from './CompareBadge';
import { User } from '@jupyterlab/services';
import parse from 'html-react-parser';
import { createStyles } from '@mantine/styles';
import { has } from 'immer/dist/internal';
import { createUnifedDiff, hasImage } from '../../Detail/ImgDetailDiff';
import { createSummaryVisualizationFromHTML, hasDataframe } from '../../Detail/DataDiff';
import { isCode } from '@jupyterlab/nbformat';

const useStyles = createStyles((theme, _params) => ({
  tinyHeight: {
    height: '12.8px'
  },
  inOutSplit: {
    // borderTop: '1px solid var(--jp-toolbar-border-color)'
  }
}));

export interface ICodeCellProps {
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

export function CodeCell({
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
}: ICodeCellProps): JSX.Element {
  const { classes, cx } = useStyles();
  const added = previousCell === undefined;
  //cheap diff
  // TODO also comapre output
  const unchanged =
    previousCell && // there is a previous cell
    cell.inputModel.source.toString() === previousCell.inputModel.source.toString() && // input is the same
    cell.outputHTML.length === previousCell.outputHTML.length && // same number of outputs
    cell.outputHTML.every((v, i) => v === previousCell.outputHTML[i]); // same outputs

  const [detailDiffCreated, setDetailDiffCreated] = React.useState(false);
  const [detailDiffOutput, setDetailDiffOutput] = React.useState((<></>) as JSX.Element);
  const [outputChanged, setOutputChanged] = React.useState(false);

  console.log('rendering code cell diff');

  // for code, show input (source code) and output (rendered output) next to each other
  const { input, inputChanged } = getInput(cell, previousCell, isActiveCell, fullWidth, cx, classes);
  // const { output, outputChanged } = getOutput(cell, previousCell, isActiveCell, fullWidth, cx, classes);

  useEffect(() => {
    const diffHtml = async () => {
      // console.log('creating cell output diff');
      const { output, outputChanged } = await getOutput(cell, previousCell, cx, classes);
      setDetailDiffCreated(true);
      setDetailDiffOutput(output);
      setOutputChanged(outputChanged);
    };
    if (fullWidth && !detailDiffCreated) {
      console.log(stateNo, cell.id, 'use effect');
      diffHtml();
    }
  }, [cell, previousCell, fullWidth]);

  // useEffect(() => {
  //   console.log(stateNo, cell.id, 'use effect');
  //   setDetailDiffOutput(<span>hurra</span>);
  // }, [cell, previousCell, isActiveCell]);

  // check if output has content
  const hasOutput = detailDiffOutput.props.children && detailDiffOutput.props.children?.length > 0;
  const split = hasOutput ? <div className={cx(classes.inOutSplit)}></div> : <></>;

  let type: 'code' | 'data' | 'img' = 'code';
  //check if any string contains an image
  const containsImg = cell.outputHTML.some(output => {
    return hasImage(output);
  });
  type = containsImg ? 'img' : type;
  if (!containsImg) {
    // if no image, check if any string contains a dataframe (image more important than data)
    const containsData = cell.outputHTML.some(output => {
      hasDataframe(output);
    });
    type = containsData ? 'data' : type;
  }

  // create a cell with input and output
  return (
    <>
      <div
        data-cell-id={cellId}
        onClick={setActiveCell}
        onDoubleClick={toggleFullwidth}
        className={cx(
          'jp-Cell',
          { ['active']: isActiveCell === true },
          { ['added']: previousCell === undefined },
          { ['executed']: executions > 0 },
          { ['changed']: unchanged === false }
        )}
      >
        <TypeIcon type={type} executions={executions} />
        {multiUser && fullWidth ? <CellUsers cellUsers={cellExecutions.get(cellId)?.user ?? []} /> : <></>}
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

        {input}
        {split}
        {fullWidth && (outputChanged || isActiveCell) ? (
          detailDiffOutput
        ) : (
          <div className={cx('unchanged', 'transparent', 'output')}></div>
        )}
      </div>
    </>
  );
}

function getInput(
  cell: CellProvenance,
  previousCell: CellProvenance | undefined,
  isActiveCell: boolean,
  fullWidth: boolean,
  cx: (...args: any) => string,
  classes: Record<string, string>
): { inputChanged: boolean; input: JSX.Element } {
  let inputChanged = false;
  //Default: show the input as it is
  let input = (
    <div className="input">
      <div
        className="input jp-InputArea jp-Cell-inputArea jp-Editor jp-InputArea-editor"
        dangerouslySetInnerHTML={{ __html: cell.inputHTML ?? '' }}
      />
    </div>
  );

  if (!fullWidth) {
    //If the state is not full width, just show a small area as indicator
    input = (
      <div className={cx(classes.tinyHeight, 'input')}>
        {/* <div className="jp-InputArea jp-Cell-inputArea jp-Editor jp-InputArea-editor">
          <div className={cx(classes.tinyHeight)}></div>
        </div> */}
      </div>
    );
  }

  //If there is a previous state, compare the input with the previous input
  if (previousCell?.inputHTML && cell.inputHTML) {
    const previousCode = (
      Array.isArray(previousCell.inputModel.source)
        ? previousCell.inputModel.source.join('\n')
        : previousCell.inputModel.source
    ).replace(/\n/g, '\n<br>');
    const currentCode = (
      Array.isArray(cell.inputModel.source) ? cell.inputModel.source.join('\n') : cell.inputModel.source
    ).replace(/\n/g, '\n<br>');
    const diff = new HtmlDiff(previousCode, currentCode);
    const unifiedDiff = diff.getUnifiedContent();

    const thisInputChanged = diff.newWords.length + diff.oldWords.length !== 0;
    inputChanged = inputChanged || thisInputChanged; // set to true if any input changed

    if (thisInputChanged && fullWidth) {
      // changed and full width --> show diff
      input = <div className="input mycode" dangerouslySetInnerHTML={{ __html: unifiedDiff }} />;
    } else if (fullWidth && isActiveCell) {
      // no change, but full width and active --> show input as it is
      input = (
        <div
          className={cx('unchanged', 'transparent', 'input')}
          onMouseEnter={e => {
            (e.target as HTMLDivElement)
              .closest('.jp-Cell')
              ?.querySelectorAll('.unchanged')
              .forEach(elem => elem.classList.remove('transparent'));
          }}
          onMouseLeave={e => {
            (e.target as HTMLDivElement)
              .closest('.jp-Cell')
              ?.querySelectorAll('.unchanged')
              .forEach(elem => elem.classList.add('transparent'));
          }}
          dangerouslySetInnerHTML={{ __html: cell.inputHTML ?? '' }}
        />
      );
    } else {
      // no change, not active, or not full width --> don't show input at all
      // just indicate the code cell
      input = <div className={cx('unchanged', 'transparent', 'input', classes.tinyHeight)}></div>;
    }
  }

  return {
    inputChanged,
    input
  };
}

async function getOutput(
  cell: CellProvenance,
  previousCell: CellProvenance | undefined,
  cx: (...args: any) => string,
  classes: Record<string, string>
): Promise<{ outputChanged: boolean; output: JSX.Element }> {
  let outputChanged = false;
  let output = <></>;

  //  check if its a code cell and if there is output
  // raw cells have no output
  if (isCode(cell.inputModel) && cell.outputHTML.length > 0) {
    const outputs: JSX.Element[] = [];
    for (const [j, output] of cell.outputHTML.entries()) {
      // create detail diff if active cell, or output changed, or there was no output earlier
      outputChanged = outputChanged || output !== previousCell?.outputHTML[j];

      // create a detailed diff

      if (hasDataframe(output)) {
        // TODO check why I inverted it here
        const addColor = '#66C2A5';
        const removeColor = '#F05268';
        const unchangedColor = '#F5F5F5';

        const allNewData = !hasDataframe(previousCell?.outputHTML[j]); // no previous data
        const unchangedData = !allNewData && previousCell?.outputHTML[j] === output; // no change

        const color1 = allNewData ? addColor : unchangedData ? unchangedColor : removeColor;
        const color2 = allNewData ? addColor : unchangedData ? unchangedColor : addColor;

        const tableSummary: HTMLDivElement = createSummaryVisualizationFromHTML(
          output,
          previousCell?.outputHTML[j],
          true,
          true,
          color1,
          color2,
          false
        );

        // add 5px padding:
        tableSummary.style.padding = '5px';
        outputs.push(<div dangerouslySetInnerHTML={{ __html: tableSummary.outerHTML }} />);
      } else if (hasImage(output)) {
        let image: string | ReactElement = output;
        // is there a image to compare to?
        if (previousCell && hasImage(previousCell.outputHTML[j])) {
          image = await createUnifedDiff(output, previousCell.outputHTML[j]);
          outputs.push(<div className={cx(classes.output, 'output')}>{image}</div>);
        } else {
          outputs.push(<div className={cx(classes.output, 'output')} dangerouslySetInnerHTML={{ __html: image }} />);
        }
      } else {
        // code, text, rich text/html
        let codeDiff = output;
        // is there code to compare to?
        if (previousCell?.outputHTML[j]) {
          const diff = new HtmlDiff(previousCell.outputHTML[j], output);
          codeDiff = diff.getUnifiedContent();
        }

        outputs.push(<div className={cx(classes.output, 'output')} dangerouslySetInnerHTML={{ __html: codeDiff }} />);
      }
    }

    output = <div className="outputs jp-OutputArea jp-Cell-outputArea">{outputs}</div>;
  }

  return {
    output,
    outputChanged
  };
}
