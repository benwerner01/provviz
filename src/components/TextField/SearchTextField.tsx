import React, { useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';

type StyleProps = {
  open: boolean;
}

const useStyles = makeStyles((theme) => ({
  textFieldRoot: ({ open }: StyleProps) => ({
    paddingLeft: theme.spacing(1),
    borderStyle: 'solid',
    borderWidth: 1,
    borderRadius: 8,
    transition: theme.transitions.create(['border-color', 'background-color']),
    borderColor: open ? theme.palette.grey[300] : 'transparent',
    backgroundColor: open ? theme.palette.common.white : 'transparent',
  }),
  input: {
    transition: theme.transitions.create('width'),
  },
  iconButton: {
    padding: theme.spacing(1),
  },
}));

type SeachTextFieldProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  searchString: string;
  setSearchString: (searchString: string) => void;
}

const SearchTextField: React.FC<SeachTextFieldProps> = ({
  open, setOpen, searchString, setSearchString,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const classes = useStyles({ open });

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  return (
    <TextField
      placeholder="Search..."
      value={searchString}
      onChange={({ target }) => setSearchString(target.value)}
      classes={{ root: classes.textFieldRoot }}
      InputProps={{
        inputRef,
        disableUnderline: true,
        inputProps: {
          style: { width: open ? 130 : 0 },
        },
        endAdornment: (
          <IconButton
            disableRipple
            className={classes.iconButton}
            onClick={() => {
              if (open) setSearchString('');
              setOpen(!open);
            }}
          >
            {open ? <CloseIcon /> : <SearchIcon /> }
          </IconButton>
        ),
        classes: { input: classes.input },
      }}
    />
  );
};

export default SearchTextField;
