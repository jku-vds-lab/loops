import { ILabShell } from '@jupyterlab/application';
import { jupyterIcon, LabIcon } from '@jupyterlab/ui-components';
import React, { useEffect, useState } from 'react';
import { LoopsLogo } from '../assets/loops-logo';

interface IOverviewHeaderProps {
  labShell: ILabShell;
}

export function OverviewHeader({
  labShell
}: IOverviewHeaderProps): JSX.Element {
  const [title, setTitle] = useState<string>(
    labShell.currentWidget?.title.label ?? 'None'
  );

  const [icon, setIcon] = useState<LabIcon | undefined>(jupyterIcon);

  useEffect(() => {
    const handleFocusChange = (
      sender: ILabShell,
      labShellArgs: ILabShell.IChangedArgs
    ): void => {
      setTitle(labShellArgs.newValue?.title.label ?? 'None');
      setIcon(
        labShellArgs.newValue?.title.icon
          ? new LabIcon({
              name:
                'loops:' + (labShellArgs.newValue?.title.icon as LabIcon).name,
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
    <header className="loops-header">
      <div className="title">
        <LoopsLogo height={30} />
      </div>
      <div>
        {icon && (
          <icon.react
            tag="span"
            marginRight="0.25em"
            height="16px"
            verticalAlign="sub" // looks slightly better then middle
          />
        )}
        {title}
      </div>
    </header>
  );
}
