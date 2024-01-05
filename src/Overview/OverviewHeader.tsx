import { ILabShell } from '@jupyterlab/application';
import { jupyterIcon, LabIcon } from '@jupyterlab/ui-components';
import React, { useEffect, useState } from 'react';
import { LoopsLogo } from '../assets/loops-logo';
import { createStyles } from '@mantine/core';

const useStyles = createStyles((theme, _params) => ({
  loopsHeader: {
    flexGrow: 0,
    label: 'loops-header',
    height: '2em',

    display: 'flex',
    justifyContent: 'space-between',
    gap: '1em',
    padding: '0.1em 0.5em'
  },
  title: {},
  file: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis'
  }
}));

interface IOverviewHeaderProps {
  labShell: ILabShell;
}

export function OverviewHeader({ labShell }: IOverviewHeaderProps): JSX.Element {
  const { classes } = useStyles();
  const [title, setTitle] = useState<string>(labShell.currentWidget?.title.label ?? 'None');

  const [icon, setIcon] = useState<LabIcon | undefined>(jupyterIcon);

  useEffect(() => {
    const handleFocusChange = (sender: ILabShell, labShellArgs: ILabShell.IChangedArgs): void => {
      setTitle(labShellArgs.newValue?.title.label ?? 'None');
      setIcon(
        labShellArgs.newValue?.title.icon
          ? new LabIcon({
              name: 'loops:' + (labShellArgs.newValue?.title.icon as LabIcon).name,
              svgstr: (labShellArgs.newValue?.title.icon as LabIcon).svgstr
            })
          : undefined
      );
    };

    labShell.currentChanged.connect(handleFocusChange);
    return () => {
      labShell.currentChanged.disconnect(handleFocusChange);
    };
  }, [labShell]);

  return (
    <header className={classes.loopsHeader}>
      <div className={classes.title}>
        <LoopsLogo height={38} />
      </div>
      <div className={classes.file}>
        {icon && (
          <icon.react
            tag="span"
            height="16px"
            verticalAlign="sub" // looks slightly better then middle
          />
        )}
        {title}
      </div>
    </header>
  );
}
