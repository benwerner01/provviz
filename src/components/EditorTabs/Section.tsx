import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Collapse from '@material-ui/core/Collapse';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';

const useStyles = makeStyles((theme) => ({
  headingWrapper: {
    position: 'relative',
    left: -1 * theme.spacing(2),
  },
  headingIconButton: {
    padding: theme.spacing(1),
  },
  headingTypography: {
    fontWeight: 800,
  },
  collapse: {
    padding: theme.spacing(0, 0, 0, 3),
  },
}));

type SectionProps = {
  initiallyOpen?: boolean;
  name: string;
}

const Section: React.FC<SectionProps> = ({ initiallyOpen, name, children }) => {
  const classes = useStyles();
  const [open, setOpen] = useState<boolean>(initiallyOpen || false);

  return (
    <>
      <Divider />
      <Box display="flex" alignItems="center" className={classes.headingWrapper}>
        <IconButton
          className={classes.headingIconButton}
          onClick={() => setOpen(!open)}
        >
          <ArrowDropDownIcon style={{ transform: `rotate(${open ? 0 : -90}deg)` }} />
        </IconButton>
        <Typography className={classes.headingTypography} variant="h5">{name}</Typography>
      </Box>
      <Collapse className={classes.collapse} in={open}>
        {children}
      </Collapse>
    </>
  );
};

export default Section;
