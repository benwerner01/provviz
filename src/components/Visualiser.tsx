import React, {
  ReactNode, SetStateAction, useEffect, useLayoutEffect, useState,
} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import download from 'downloadjs';
import { Typography } from '@material-ui/core';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { PROVJSONDocument, validateDocument, Variant } from '../util/definition/document';
import DocumentContext from './contexts/DocumentContext';
import Inspector, { TABS_HEIGHT } from './Inspector';
import GraphView from './GraphView';
import TreeView from './TreeView';
import MenuBar, { MENU_BAR_HEIGHT, View } from './MenuBar';
import VisualisationContext, { VisualisationSettings, defaultSettings } from './contexts/VisualisationContext';
import { palette } from '../util/theme';
import queries from '../util/queries';

export const MIN_WIDTH = 350;

export type VisualiserProps = {
  documentName?: string;
  document: object;
  onChange: ((updatedDocument: object) => void) | null;
  initialSettings?: VisualisationSettings;
  onSettingsChange?: (updatedSettings: VisualisationSettings) => void;
  width: number;
  height: number;
  wasmFolderURL: string;
}

export type Selection = {
  variant: Variant;
  id: string;
}

const useStyles = makeStyles((theme) => ({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  graphvizWrapper: {
    width: '100%',
    height: '100%',
    transition: theme.transitions.create('max-height'),
    overflow: 'hidden',
  },
  validationErrorHeading: {
    color: palette.danger.main,
  },
}));

const Visualiser: React.FC<VisualiserProps> = ({
  wasmFolderURL, width, height, documentName, document, onChange, initialSettings, onSettingsChange,
}) => {
  const classes = useStyles();
  const [svgElement, setSVGElement] = useState<SVGSVGElement | undefined>();

  const [controllingState, setControllingState] = useState(onChange === null);

  const [
    visualisationSettings,
    setVisualisationSettings] = useState<VisualisationSettings>(initialSettings || defaultSettings);

  const [localDocument, setLocalDocument] = useState<PROVJSONDocument>(document);
  const [isEmptyDocument, setIsEmtpyDocument] = useState<boolean>(true);
  const [displayInspector, setDisplayInspector] = useState<boolean>(false);
  const [displayInspectorContent, setDisplayInspectorContent] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<View>('Graph');
  const [inspectorContentHeight, setInspectorContentHeight] = useState<number>(400);
  const [validationErrors, setValidationErrors] = useState<ReactNode[]>(validateDocument(document));

  const [selected, setSelected] = useState<Selection | undefined>();
  const [displaySettings, setDisplaySettings] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchString, setSearchString] = useState<string>('');

  useEffect(() => {
    if (searching) setCurrentView('Tree');
  }, [searching]);

  useEffect(() => {
    if (controllingState && onChange !== null) {
      console.log('⚠️ WARNING: Visualiser component is changing from controlled state to uncontrolled state');
      setControllingState(false);
    } else if (!controllingState && onChange === null) {
      console.log('⚠️ WARNING: Visualiser component is changing from uncontrolled state to controlled state');
      setControllingState(true);
    }
  }, [controllingState, onChange]);

  useEffect(() => {
    setVisualisationSettings(initialSettings || defaultSettings);
  }, [documentName]);

  const contextDocument: PROVJSONDocument = controllingState ? localDocument : document;

  const contextSetDocument = controllingState
    ? setLocalDocument
    : (action: SetStateAction<PROVJSONDocument>) => {
      if (onChange) {
        if (typeof action === 'function') onChange(action(contextDocument));
        else onChange(action);
      }
    };

  useLayoutEffect(() => {
    const topLevelPrefixes = Object.keys(contextDocument.prefix || {});
    if (
      !topLevelPrefixes.includes('prov')
      || !topLevelPrefixes.includes('xsd')
      || !topLevelPrefixes.includes('provviz')
    ) {
      contextSetDocument({
        ...contextDocument,
        prefix: {
          ...contextDocument.prefix,
          xsd: 'http://www.w3.org/2001/XMLSchema#',
          prov: 'http://www.w3.org/ns/prov#',
          provviz: 'http://provviz/ns/provviz#',
        },
      });
    }
  }, [contextDocument]);

  useEffect(() => {
    setIsEmtpyDocument(queries.document.isEmpty(contextDocument));
    setValidationErrors(validateDocument(contextDocument));
  }, [contextDocument]);

  const downloadVisualisation = () => {
    if (svgElement) {
      const serializedSVG = (new XMLSerializer())
        .serializeToString(svgElement);
      download(new Blob([serializedSVG]), `${documentName || 'Visualisation'}.svg`, 'image/svg');
    }
  };

  const handleSelectedChange = (updatedSelected: Selection | undefined) => {
    if (updatedSelected && !displayInspectorContent) setDisplayInspectorContent(true);
    setSelected(updatedSelected);
  };

  const handleVisualisationSettings = (
    action: SetStateAction<VisualisationSettings>,
  ) => {
    setVisualisationSettings(action);
    if (onSettingsChange) {
      if (typeof action === 'function') onSettingsChange(action(visualisationSettings));
      else onSettingsChange(action);
    }
  };

  const contentHeight = (
    height
    - MENU_BAR_HEIGHT
    - (displayInspector ? TABS_HEIGHT : 0)
    - (displayInspectorContent ? inspectorContentHeight : 0));

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <DocumentContext.Provider
        value={{ document: contextDocument, setDocument: contextSetDocument }}
      >
        <VisualisationContext.Provider
          value={{
            visualisationSettings,
            setVisualisationSettings: handleVisualisationSettings,
          }}
        >
          <Box
            className={classes.wrapper}
            style={{ width, height }}
          >
            <MenuBar
              displaySettings={() => {
                setSelected(undefined);
                setDisplaySettings(true);
                setDisplayInspectorContent(true);
              }}
              isEmptyDocument={isEmptyDocument}
              collapseButtons={width < (searching ? 800 : 650)}
              collapseIconButtons={width < 650 && searching}
              setSelected={handleSelectedChange}
              currentView={currentView}
              setCurrentView={setCurrentView}
              downloadVisualisation={downloadVisualisation}
              searching={searching}
              setSearching={setSearching}
              searchString={searchString}
              setSearchString={setSearchString}
            />
            {validationErrors.length > 0
              ? (
                <Box m={1}>
                  <Typography className={classes.validationErrorHeading} variant="h5">
                    <strong>Error Validating PROV Document</strong>
                  </Typography>
                  <ul>
                    {validationErrors.map((error, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                      <li key={i}><Typography>{error}</Typography></li>
                    ))}
                  </ul>
                </Box>
              )
              : (
                <>
                  {isEmptyDocument ? (
                    <Box style={{ height: contentHeight }} m={1} display="flex" alignItems="center" justifyContent="center">
                      <Typography variant="h5">Empty Document</Typography>
                    </Box>
                  ) : (
                    <>
                      {currentView === 'Graph' && (
                      <GraphView
                        selected={selected}
                        setSelected={handleSelectedChange}
                        width={width}
                        wasmFolderURL={wasmFolderURL}
                        setSVGElement={setSVGElement}
                        height={contentHeight}
                      />
                      )}
                      {currentView === 'Tree' && (
                      <TreeView
                        width={width}
                        height={contentHeight}
                        selected={selected}
                        setSelected={handleSelectedChange}
                        searchString={searchString}
                      />
                      )}
                    </>
                  )}
                  <Inspector
                    displaySettings={displaySettings}
                    setDisplaySettings={setDisplaySettings}
                    contentHeight={inspectorContentHeight}
                    setContentHeight={setInspectorContentHeight}
                    selected={selected}
                    setSelected={handleSelectedChange}
                    display={displayInspector}
                    setDisplay={setDisplayInspector}
                    open={displayInspectorContent}
                    setOpen={setDisplayInspectorContent}
                  />
                </>
              )}
          </Box>
        </VisualisationContext.Provider>
      </DocumentContext.Provider>
    </MuiPickersUtilsProvider>
  );
};

export default Visualiser;
