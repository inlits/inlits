import algoliasearch from 'algoliasearch/lite';

// Initialize Algolia client
export const searchClient = algoliasearch(
  'SAP9OOG0OB',
  'ebd532d5ae98566be0e8abff109dd750'
);

export const searchIndex = searchClient.initIndex('content');