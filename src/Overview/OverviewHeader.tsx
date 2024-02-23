import { ILabShell } from '@jupyterlab/application';
import { jupyterIcon, LabIcon } from '@jupyterlab/ui-components';
import { createStyles, Modal, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import React, { useEffect, useRef, useState } from 'react';
import { LoopsLogo } from '../assets/loops-logo';
import { useIsVisible } from '../useIsVisible';

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

  const ref = useRef<HTMLElement>(null);
  const isVisible = useIsVisible(ref);
  const [opened, { open, close }] = useDisclosure(false);
  const [modalOpened, setModalOpened] = useState(false);

  useEffect(() => {
    if (isVisible && !modalOpened && title.includes('.ipynb')) {
      //check if we are in firefox
      const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      if (!isFirefox) {
        setModalOpened(true);
        open();
      }
    }
  }, [isVisible, title]);

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
    <header ref={ref} className={classes.loopsHeader}>
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
      <Modal
        opened={opened}
        onClose={close}
        title="🚨 Please Note"
        transitionProps={{ transition: 'fade', duration: 600, timingFunction: 'linear' }}
      >
        <Text size="md" mb="xs" weight={500}>
          Loops is currently in active development and is best experienced using Firefox. While fully functional on
          other browsers, please be aware that the styling may not be as comprehensive, resulting in a suboptimal visual
          display of the extension.
        </Text>
      </Modal>
    </header>
  );
}
