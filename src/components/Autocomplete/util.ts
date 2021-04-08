import { createFilterOptions } from '@material-ui/lab/Autocomplete';
import { PROVJSONDocument } from '../../lib/definition/document';
import queries from '../../lib/queries';

export const filterOptions = createFilterOptions<string | NewNode>();

export type NewNode = {
  prefix?: string;
  name: string;
}

export const parseNewNodeFromInput = (
  document: PROVJSONDocument, bundleID?: string,
) => (input: string): NewNode => {
  const prefix = queries.document.parsePrefixFromID(input);
  // If the parsed prefix is in the namespace...
  if (queries.namespace.getAll(bundleID)(document).includes(prefix)) {
    // ...then let's use it as the namespace...
    return {
      prefix: prefix === 'default' ? undefined : prefix,
      name: queries.document.parseNameFromID(input),
    };
  }
  // ...otherwise let's use the default namespace instead.
  const defaultPrefix = queries.namespace.getDefaultPrefix(document);
  return {
    prefix: defaultPrefix === 'default' ? undefined : defaultPrefix,
    name: input,
  };
};
