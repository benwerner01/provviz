import React, { Dispatch, SetStateAction } from 'react';
import { PROVJSONDocument } from '../../util/document';

export type DocumentContext = {
  document: PROVJSONDocument;
  setDocument: Dispatch<SetStateAction<PROVJSONDocument>>;
}

const emptyDocument: PROVJSONDocument = {
  prefix: {},
};

export default React.createContext<DocumentContext>({
  document: emptyDocument,
  setDocument: (d: SetStateAction<PROVJSONDocument>) => undefined,
});
