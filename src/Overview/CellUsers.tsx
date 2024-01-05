import '@armantang/html-diff/dist/index.css';
import { User } from '@jupyterlab/services';
import { Avatar, Tooltip, createStyles } from '@mantine/core';
import React from 'react';

const useStyles = createStyles((theme, _params) => ({
  cellUsers: {
    position: 'absolute',
    top: '0rem',
    right: '0.8rem',
    zIndex: 1
  }
}));

export interface ICellUsersProps {
  cellUsers: User.IIdentity[];
}

/** parent needs to have positon:relative set */
export function CellUsers({ cellUsers }: ICellUsersProps): JSX.Element {
  const { classes, cx } = useStyles();

  if (cellUsers.length === 0) {
    return <></>;
  }

  // Get all users of the state and sort by frequency of executions
  const users = new Map<string, { user: User.IIdentity; frequency: number }>();

  // for each user (aggregated state could have multipe users per cell)
  cellUsers.forEach(user => {
    const freq = users.get(user.username)?.frequency ?? 0;
    users.set(user.username, { user: user, frequency: freq + 1 });
  });
  const sortedUsers = [...users.values()].sort((a, b) => b.frequency - a.frequency);

  let avatars = [...sortedUsers.values()].map((user, i) => {
    return (
      <Avatar
        src={user.user.avatar_url as string}
        alt={user.user.name}
        radius="xl"
        size={18} // 24 == sm,
        color="dark.0"
        variant="filled"
      >
        {user.user.initials}
      </Avatar>
    );
  });

  const maxUsersDisplayed = 3;
  // truncate avatars if there are more than maxUsersDisplayed, add a +X badge
  if (avatars.length > maxUsersDisplayed) {
    // replace at least two avatars with the +X badge)
    const maxLength = maxUsersDisplayed - 1;
    avatars = avatars.slice(0, maxLength);
    avatars.push(
      <Avatar radius="xl" size={18} color="dark.0" variant="filled">
        +{sortedUsers.length - maxLength}
      </Avatar>
    );
  }

  const userTooltip = sortedUsers.map(user => `${user.user.name} (${user.frequency})`).join(', ');

  avatars = avatars.reverse(); //show most active last

  return (
    <div className={cx(classes.cellUsers)}>
      <Tooltip label={userTooltip} withArrow multiline width={180}>
        <Avatar.Group spacing={5}>{avatars}</Avatar.Group>
      </Tooltip>
    </div>
  );
}
