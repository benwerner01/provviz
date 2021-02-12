import React, { Dispatch, SetStateAction } from 'react';
import { PROVJSONBundle } from '../../util/document';

export type DocumentContext = {
  document: PROVJSONBundle;
  setDocument: Dispatch<SetStateAction<PROVJSONBundle>>;
}

const emptyDocument: PROVJSONBundle = {
  prefix: {},
};

export default React.createContext<DocumentContext>({
  document: emptyDocument,
  setDocument: (d: SetStateAction<PROVJSONBundle>) => undefined,
});
