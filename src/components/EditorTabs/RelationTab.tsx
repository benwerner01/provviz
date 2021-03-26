import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import DocumentContext from '../contexts/DocumentContext';
import { RelationVariant } from '../../util/definition/relation';
import { ATTRIBUTE_DEFINITIONS } from '../../util/definition/attribute';
import { palette } from '../../util/theme';
import DefinedAttribute from '../DefinedAttribute';
import mutations from '../../util/mutations';

const useStyles = makeStyles((theme) => ({
  deleteButton: {
    marginRight: theme.spacing(1),
    backgroundColor: palette.danger.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: palette.danger.dark,
    },
  },
  warningIcon: {
    color: palette.danger.main,
  },
  warningTypography: {
    color: palette.danger.main,
  },
}));

type RelationTabProps = {
  variant: RelationVariant;
  id: string;
  openSections: string[];
  setOpenSections: (openSections: string[]) => void;
  onDelete?: () => void;
}

const RelationTab: React.FC<RelationTabProps> = ({
  variant, id, onDelete, openSections, setOpenSections,
}) => {
  const classes = useStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const handleDelete = () => {
    setDocument(mutations.relation.delete(variant, id));
    if (onDelete) onDelete();
  };

  return (
    <>
      <Box display="flex" mb={1}>
        <Typography variant="h5">
          <strong>
            {`${variant[0].toUpperCase()}${variant.slice(1)}: `}
          </strong>
          {id}
        </Typography>
      </Box>
      <Divider />
      {ATTRIBUTE_DEFINITIONS
        .filter(({ domain }) => domain.includes(variant))
        .map((attribute) => (
          <Box m={2} key={attribute.key}>
            <DefinedAttribute
              attribute={attribute}
              variant={variant}
              domainID={id}
            />
          </Box>
        ))}
      <Box display="flex" flexWrap="wrap" alignItems="center" mt={2}>
        <Button onClick={handleDelete} className={classes.deleteButton} variant="contained">Delete</Button>
      </Box>
    </>
  );
};

export default RelationTab;
