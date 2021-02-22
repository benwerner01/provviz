import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';
import WarningIcon from '@material-ui/icons/Warning';
import DocumentContext from '../contexts/DocumentContext';
import EditableIdentifier from '../EditableIdentifier';
import NodeAutocomplete from '../Autocomplete/NodeAutocomplete';
import queries from '../../util/queries';
import mutations from '../../util/mutations';
import {
  Variant,
  ATTRIBUTE_DEFINITIONS,
  PROVJSONBundle,
  PROVAttributeDefinition,
  RelationName,
  RELATIONS,
} from '../../util/document';
import ColorPicker from '../ColorPicker';
import VisualisationContext from '../contexts/VisualisationContext';
import Section from './Section';
import { palette } from '../../util/theme';
import CustomAttributes from '../CustomAttributes';

const useDateTimeStyles = makeStyles((theme) => ({
  root: {
    display: 'block',
    marginBottom: theme.spacing(2),
  },
}));

type DateTimeAttributeProps = {
  domainID: string;
  attribute: PROVAttributeDefinition;
}

const DateTimeAttribute: React.FC<DateTimeAttributeProps> = ({
  domainID, attribute,
}) => {
  const classes = useDateTimeStyles();
  const { document, setDocument } = useContext(DocumentContext);

  return (
    <TextField
      label={attribute.name}
      type="datetime-local"
      classes={classes}
      value={queries.document.getAttributeValue(attribute, domainID)(document)}
      onChange={(e) => setDocument(
        mutations.node.setAttribute(domainID, attribute, e.target.value),
      )}
      InputLabelProps={{ shrink: true }}
    />
  );
};

const useStyles = makeStyles((theme) => ({
  formControl: {
    display: 'block',
  },
  formControlLabel: {
    marginLeft: 0,
  },
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

type NodeTabProps = {
  variant: Variant;
  id: string;
  onIDChange?: (id: string) => void;
  onDelete?: () => void;
}

const NodeTab: React.FC<NodeTabProps> = ({
  variant, id, onIDChange, onDelete,
}) => {
  const classes = useStyles();
  const { document, setDocument } = useContext(DocumentContext);
  const { visualisationSettings, setVisualisationSettings } = useContext(VisualisationContext);

  const relationRangeIncludes = RELATIONS
    .filter(({ domain }) => domain === variant)
    .reduce((prev, { name }) => ({
      ...prev,
      [name]: queries.relation.getRangeWithDomain(name, id)(document),
    }), {} as { [key: string]: string[] });

  const handleRelationRangeChange = (relationName: RelationName) => (
    updatedDocument: PROVJSONBundle, rangeIDs: string[],
  ) => {
    const rangeIncludes = relationRangeIncludes[relationName];
    const add = rangeIDs.filter((rangeID) => !rangeIncludes.includes(rangeID));
    const remove = rangeIncludes.filter((rangeID) => !rangeIDs.includes(rangeID));

    add.forEach((activityID) => {
      const relationID = queries.relation.generateID()(document);
      // eslint-disable-next-line no-param-reassign
      updatedDocument = mutations.relation.create(
        relationName, relationID, id, activityID,
      )(updatedDocument);
    });
    remove.forEach((activityID) => {
      const relationID = queries.relation.getID(relationName, id, activityID)(document);
      if (!relationID) throw new Error('Could not find relationID');
      // eslint-disable-next-line no-param-reassign
      updatedDocument = {
        ...updatedDocument,
        ...mutations.relation.delete(relationName, relationID)(updatedDocument),
      };
    });

    setDocument(updatedDocument);
  };

  const fullName = queries.node.getFullName(id)(document);

  const handleColorChange = (updatedColor: string) => {
    const existingOverrideIndex = visualisationSettings.palette.overrides
      .findIndex(({ nodeID }) => nodeID === id);

    setVisualisationSettings((prev) => ({
      ...prev,
      palette: {
        ...prev.palette,
        overrides: existingOverrideIndex < 0
          ? [...prev.palette.overrides, { nodeID: id, color: updatedColor }]
          : [
            ...prev.palette.overrides.slice(0, existingOverrideIndex),
            { nodeID: id, color: updatedColor },
            ...prev.palette.overrides.slice(existingOverrideIndex + 1),
          ],
      },
    }));
  };

  const handleClearOverridingColor = () => {
    const existingOverrideIndex = visualisationSettings.palette.overrides
      .findIndex(({ nodeID }) => nodeID === id);

    if (existingOverrideIndex >= 0) {
      setVisualisationSettings((prev) => ({
        ...prev,
        palette: {
          ...prev.palette,
          overrides: [
            ...prev.palette.overrides.slice(0, existingOverrideIndex),
            ...prev.palette.overrides.slice(existingOverrideIndex + 1),
          ],
        },
      }));
    }
  };

  const handleHiddenChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setVisualisationSettings((prev) => ({
      ...prev,
      hidden: target.checked
        ? [...prev.hidden, id]
        : prev.hidden.filter((hiddenID) => hiddenID !== id),
    }));
  };

  const handleDelete = () => {
    setDocument(variant === 'bundle'
      ? mutations.bundle.remove(id)
      : mutations.node.delete(variant, id));
    if (onDelete) onDelete();
  };

  const { hidden, hideAllAttributesForNode } = visualisationSettings;

  const overridingColor = visualisationSettings.palette.overrides
    .find(({ nodeID }) => nodeID === id)?.color;

  const color = overridingColor || visualisationSettings.palette[variant];

  const isHidden = hidden.includes(id);

  const allAttributesAreHidden = hideAllAttributesForNode.includes(id);

  const collapsableSections = [
    {
      name: 'Definition',
      initiallyOpen: false,
      content: (
        <>
          <EditableIdentifier initialID={id} onChange={onIDChange} />
          {ATTRIBUTE_DEFINITIONS
            .filter(({ domain }) => domain === variant)
            .map((p) => (
              <React.Fragment key={p.name}>
                {p.range === 'DateTime' && <DateTimeAttribute attribute={p} domainID={id} />}
              </React.Fragment>
            ))}
        </>
      ),
    },
    variant === 'bundle'
      ? []
      : {
        name: 'Attributes',
        initiallyOpen: false,
        content: (
          <>
            <CustomAttributes nodeVariant={variant} nodeID={id} />
          </>
        ),
      },
    {
      name: 'Relationships',
      content: RELATIONS.filter(({ domain }) => domain === variant).map(({ name, range }) => (
        <NodeAutocomplete
          key={name}
          variant={range}
          label={name}
          value={relationRangeIncludes[name]}
          exclude={[id]}
          onChange={handleRelationRangeChange(name)}
        />
      )),
    },
    {
      name: 'Visualisation',
      content: (
        <>
          <ColorPicker
            mb={1}
            label="Override Color"
            initialColor={color}
            onChange={handleColorChange}
            onClear={overridingColor ? handleClearOverridingColor : undefined}
          />
          <FormControl className={classes.formControl}>
            <FormControlLabel
              className={classes.formControlLabel}
              labelPlacement="start"
              control={(
                <Checkbox
                  checked={isHidden}
                  onChange={handleHiddenChange}
                  color="primary"
                  name="hide"
                />
            )}
              label="Hide"
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <FormControlLabel
              className={classes.formControlLabel}
              labelPlacement="start"
              control={(
                <Checkbox
                  checked={allAttributesAreHidden}
                  onChange={({ target }) => setVisualisationSettings((prev) => ({
                    ...prev,
                    hideAllAttributesForNode: target.checked
                      ? [...prev.hideAllAttributesForNode, id]
                      : prev.hideAllAttributesForNode.filter((hiddenID) => hiddenID !== id),
                  }))}
                  color="primary"
                  name="hide"
                />
            )}
              label="Hide All Attributes"
            />
          </FormControl>
        </>
      ),
    },
  ].flat();

  const outgoingRelationships = queries.node.getOutgoingRelations(id)(document);
  const incomingRelationships = queries.node.getIncomingRelations(id)(document);

  return (
    <>
      <Box display="flex" mb={1}>
        <Typography variant="h5">
          <strong>
            {`${variant[0].toUpperCase()}${variant.slice(1)}: `}
          </strong>
          {fullName}
        </Typography>
      </Box>
      <Divider />
      {collapsableSections.map(({ initiallyOpen, name, content }) => (
        <Section key={name} initiallyOpen={initiallyOpen} name={name}>{content}</Section>
      ))}
      <Box display="flex" flexWrap="wrap" alignItems="center" mt={2}>
        <Button onClick={handleDelete} className={classes.deleteButton} variant="contained">Delete</Button>
        {(outgoingRelationships.length > 0 || incomingRelationships.length > 0) && (
          <Box my={1} display="flex" flexWrap="wrap" alignItems="center">
            <Box display="flex" alignItems="center" mr={1}>
              <WarningIcon className={classes.warningIcon} />
              <Typography className={classes.warningTypography}>
                <strong>Warning:</strong>
              </Typography>
            </Box>
            <Typography>
              {`deleting this ${variant} will also `}
              {outgoingRelationships.length > 0
                ? (
                  <>
                    <strong>{`delete ${outgoingRelationships.length} outgoing relationships`}</strong>
                    {incomingRelationships.length > 0 && (
                      <>
                        {' and '}
                        <strong>{`delete ${incomingRelationships.length} incoming relationships`}</strong>
                      </>
                    )}
                  </>
                )
                : <strong>{`delete ${incomingRelationships.length} incoming relationships`}</strong>}
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default NodeTab;
