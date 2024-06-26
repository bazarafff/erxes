import * as compose from 'lodash.flowright';

import { PagesMainQueryResponse } from '../../types';
import React from 'react';
import SiteForm from '../../components/sites/SiteForm';
import { generatePaginationParams } from '@erxes/ui/src/utils/router';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { queries } from '../../graphql';

type Props = {
  _id: string;
  queryParams: any;
};

type FinalProps = Props & {
  pagesMainQuery: PagesMainQueryResponse;
};

const FormContainer = (props: FinalProps) => {
  const { pagesMainQuery } = props;

  if (pagesMainQuery.loading) {
    return null;
  }

  const pagesMain = pagesMainQuery.webbuilderPagesMain || {};

  const updatedProps = {
    ...props,
    pages: pagesMain.list || [],
  };

  return <SiteForm {...updatedProps} />;
};

export default compose(
  graphql<Props, PagesMainQueryResponse>(gql(queries.pagesMain), {
    name: 'pagesMainQuery',
    options: ({ _id, queryParams }) => ({
      variables: {
        ...generatePaginationParams(queryParams),
        siteId: _id || '',
      },
    }),
  }),
)(FormContainer);
