import React, { useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import Collapse from '@material-ui/core/Collapse';
import Fade from '@material-ui/core/Fade';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import Documentation from './Documentation';
import DocumentContext from '../contexts/DocumentContext';
import { RELATIONS, RelationVariant } from '../../lib/definition/relation';
import { ATTRIBUTE_DEFINITIONS, PROVVIZ_ATTRIBUTE_DEFINITIONS } from '../../lib/definition/attribute';
import { palette } from '../../lib/theme';
import DefinedAttribute from '../DefinedAttribute';
import mutations from '../../lib/mutations';
import CustomAttributes from '../CustomAttributes';
import Section from './Section';

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

export type RelationInspectorProps = {
  variant: RelationVariant;
  id: string;
  openSections: string[];
  setOpenSections: (openSections: string[]) => void;
  onDelete?: () => void;
}

const RelationInspector: React.FC<RelationInspectorProps> = ({
  variant, id, onDelete, openSections, setOpenSections,
}) => {
  const classes = useStyles();
  const { setDocument } = useContext(DocumentContext);

  const [displayDocumentation, setDisplayDocumentation] = useState<boolean>(false);

  const handleDelete = () => {
    setDocument(mutations.relation.delete(variant, id));
    if (onDelete) onDelete();
  };

  const collapsableSections = [
    {
      name: 'Custom Attributes',
      open: openSections.includes('Custom Attributes'),
      content: <CustomAttributes variant={variant} id={id} />,
    },
    {
      name: 'Visualisation',
      open: openSections.includes('Visualisation'),
      content: PROVVIZ_ATTRIBUTE_DEFINITIONS
        .filter(({ domain }) => domain.includes(variant))
        .map((attribute) => (
          <DefinedAttribute
            key={attribute.name}
            attribute={attribute}
            variant={variant}
            domainID={id}
            // bundleID={bundleID}
          />
        )),
    },
  ];

  const relation = RELATIONS.find(({ name }) => name === variant);

  return (
    <>
      <Box display="flex" mb={1} justifyContent="space-between" alignItems="center">
        <Typography variant="h5">
          <strong>
            {`${variant[0].toUpperCase()}${variant.slice(1)}: `}
          </strong>
          {id}
        </Typography>
        <Tooltip
          title={(
            <>
              <strong>
                <i>{variant}</i>
              </strong>
              {' Documentation'}
            </>
          )}
        >
          <IconButton onClick={() => setDisplayDocumentation(!displayDocumentation)}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>
      {relation && (
      <Collapse in={displayDocumentation}>
        <Documentation
          documentation={relation.documentation}
          url={relation.url}
        />
      </Collapse>
      )}
      <Fade in={!displayDocumentation}><Divider /></Fade>
      <Box my={1.5} mx={3}>
        {ATTRIBUTE_DEFINITIONS
          .filter(({ domain }) => domain.includes(variant))
          .map((attribute) => (
            <DefinedAttribute
              key={attribute.key}
              attribute={attribute}
              variant={variant}
              domainID={id}
            />
          ))}
      </Box>
      <Divider />
      {collapsableSections.map(({ open, name, content }) => (
        <Section
          key={name}
          open={open}
          name={name}
          toggleOpen={() => setOpenSections(open
            ? openSections.filter((sectionName) => sectionName !== name)
            : [...openSections, name])}
        >
          {content}
        </Section>
      ))}
      <Box display="flex" flexWrap="wrap" alignItems="center" mt={2}>
        <Button onClick={handleDelete} className={classes.deleteButton} variant="contained">Delete</Button>
      </Box>
    </>
  );
};

export default RelationInspector;
