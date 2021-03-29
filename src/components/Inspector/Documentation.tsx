import React, { ReactNode } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

const useStyles = makeStyles((theme) => ({
  wrapper: {
    borderRadius: 8,
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
    '& svg': {
      color: theme.palette.common.white,
    },
  },
  openIconButton: {
    padding: 0,
  },
}));

const Documentation: React.FC<{ documentation: ReactNode, url?: string }> = ({
  documentation, url,
}) => {
  const classes = useStyles();

  return (
    <Box display="flex" alignItems="flex-start" justifyContent="space-between" p={1} className={classes.wrapper}>
      <Typography>{documentation}</Typography>
      {url && (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <IconButton
          disableRipple
          disableFocusRipple
          className={classes.openIconButton}
        >
          <OpenInNewIcon />
        </IconButton>
      </a>
      )}
    </Box>
  );
};

export default Documentation;
