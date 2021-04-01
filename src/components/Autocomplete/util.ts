import { createFilterOptions } from '@material-ui/lab/Autocomplete';
import { PROVJSONDocument } from '../../util/definition/document';
import queries from '../../util/queries';

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
      prefix,
      name: queries.document.parseNameFromID(input),
    };
  }
  // ...otherwise let's use the default namespace instead.
  return {
    prefix: queries.namespace.getDefaultPrefix(document),
    name: input,
  };
};
