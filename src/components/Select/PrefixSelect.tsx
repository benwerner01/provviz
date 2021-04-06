import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import FromControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import DocumentContext from '../contexts/DocumentContext';
import queries from '../../util/queries';

const useStyles = makeStyles((theme) => ({
  formControlRoot: {
    minWidth: 85,
    '& div': {
      borderRadius: 8,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
    '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
      top: -7,
    },
  },
  select: {
    padding: theme.spacing(1.5),
  },
  label: {
    backgroundColor: theme.palette.common.white,
  },
}));

type PrefixSelectProps = {
  prefix: string;
  onChange: (updatedPrefix: string) => void;
  bundleID?: string;
  additionalPrefixes?: string[];
}

const PrefixSelect: React.FC<PrefixSelectProps> = ({
  prefix, onChange, bundleID, additionalPrefixes,
}) => {
  const { document } = useContext(DocumentContext);
  const classes = useStyles();

  const prefixes = [
    ...(additionalPrefixes || []),
    ...queries.namespace.getAll(bundleID)(document),
  ].filter((current, i, all) => all.indexOf(current) === i);

  return (
    <FromControl variant="outlined" classes={{ root: classes.formControlRoot }}>
      <InputLabel className={classes.label}>Prefix</InputLabel>
      <Select
        value={prefix}
        onChange={({ target }) => onChange(target.value as string)}
        classes={{ select: classes.select }}
      >
        {prefixes.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
      </Select>
    </FromControl>
  );
};

export default PrefixSelect;
