import React, { useEffect, useRef, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Popover from '@material-ui/core/Popover';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { ChromePicker } from 'react-color';

const WIDTH = 300;
const HEIGHT = 30;

const useStyles = makeStyles((theme) => ({
  label: {
    color: theme.palette.grey[600],
    fontSize: 12,
    marginRight: theme.spacing(1),
  },
  buttonWrapper: {
    position: 'relative',
    borderStyle: 'solid',
    borderColor: theme.palette.grey[500],
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
    width: WIDTH,
  },
  colorButton: {
    flexShrink: 0,
    height: HEIGHT,
    borderRadius: 0,
    opacity: 1,
    transition: theme.transitions.create(['opacity', 'width']),
    '&:hover': {
      opacity: 0.8,
    },
  },
  clearIconButton: {
    borderLeftStyle: 'solid',
    borderLeftWidth: 1,
    borderLeftColor: theme.palette.grey[500],
    borderRadius: 0,
    padding: 0,
    height: HEIGHT,
    width: HEIGHT,
    transition: theme.transitions.create(['background-color', 'opacity']),
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    },
  },
}));

export type ColorPickerProps = {
  label?: string;
  initialColor: string;
  onChange: (updatedColor: string) => void;
  onClear?: () => void;
  mb?: number;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  mb, label, initialColor, onChange, onClear,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const classes = useStyles();

  const [color, setColor] = useState<string>(initialColor);
  const [displayPicker, setDisplayPicker] = useState<boolean>(false);

  useEffect(() => {
    setColor(initialColor);
  }, [initialColor]);

  const displayClearButton = onClear !== undefined;

  return (
    <Box mb={mb}>
      <Typography className={classes.label}>{label || 'Color'}</Typography>
      <Box
        display="flex"
        className={classes.buttonWrapper}
      >
        <Button
          style={{
            width: displayClearButton ? WIDTH - HEIGHT : WIDTH,
            backgroundColor: color,
          }}
          className={classes.colorButton}
          ref={buttonRef}
          onClick={() => setDisplayPicker(!displayPicker)}
        />
        <IconButton
          style={{ opacity: displayClearButton ? 1 : 0 }}
          className={classes.clearIconButton}
          disableRipple
          disableFocusRipple
          onClick={onClear}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Popover
        open={displayPicker}
        onClose={() => setDisplayPicker(false)}
        anchorEl={buttonRef.current}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <ChromePicker
          color={color}
          onChange={({ hex }) => setColor(hex)}
          onChangeComplete={({ hex }) => onChange(hex)}
        />
      </Popover>
    </Box>
  );
};

export default ColorPicker;
