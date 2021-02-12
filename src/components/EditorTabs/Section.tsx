import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Collapse from '@material-ui/core/Collapse';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles((theme) => ({
  headingWrapper: {
    position: 'relative',
  },
  headingIcon: {
    left: -1 * theme.spacing(2),
  },
  headingButton: {
    justifyContent: 'flex-start',
    width: '100%',
    padding: theme.spacing(1, 1, 1, 0),
    textTransform: 'none',
  },
  headingTypography: {
    fontWeight: 800,
  },
  contentWrapper: {
    padding: theme.spacing(1, 0, 1, 3),
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
      <Box display="flex" alignItems="center">
        <Button
          className={classes.headingButton}
          onClick={() => setOpen(!open)}
        >
          <ArrowDropDownIcon className={classes.headingIcon} style={{ transform: `rotate(${open ? 0 : -90}deg)` }} />
          <Typography className={classes.headingTypography} variant="h5">{name}</Typography>
        </Button>
      </Box>
      <Collapse in={open}>
        <Box className={classes.contentWrapper}>{children}</Box>
      </Collapse>
      <Divider />
    </>
  );
};

export default Section;
