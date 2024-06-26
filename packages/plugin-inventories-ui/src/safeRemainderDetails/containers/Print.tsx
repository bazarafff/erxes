import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import queryString from 'query-string';
import { gql } from '@apollo/client';
// local
import { queries } from '../graphql';
import Spinner from '@erxes/ui/src/components/Spinner';
import { getEnv } from '@erxes/ui/src/utils/core';
import { generateParams } from './List';

type Props = {
  component: any;
};

function ListContainer(props: Props) {
  // Hooks
  const location = useLocation();
  const { id } = useParams();

  const queryParams = queryString.parse(location.search);

  /**
   * Queries
   */
  const safeRemainderDetailQuery = useQuery(gql(queries.safeRemainderDetail), {
    notifyOnNetworkStatusChange: true,
    variables: { _id: id },
  });

  const safeRemainderItemsCountQuery = useQuery(
    gql(queries.safeRemainderItemsCount),
    {
      fetchPolicy: 'network-only',
      variables: {
        remainderId: id,
        status: queryParams.status,
        diffType: queryParams.diffType,
        productCategoryIds: queryParams.productCategoryIds,
      },
    },
  );

  const totalCount =
    (safeRemainderItemsCountQuery.data &&
      safeRemainderItemsCountQuery.data.safeRemainderItemsCount) ||
    0;

  const safeRemainderItemsQuery = useQuery(gql(queries.safeRemainderItems), {
    fetchPolicy: 'network-only',
    variables: {
      remainderId: id,
      status: queryParams.status,
      diffType: queryParams.diffType,
      productCategoryIds: queryParams.productCategoryIds,
      perPage: totalCount,
      page: 1,
    },
  });

  if (safeRemainderItemsQuery.loading) {
    return <Spinner objective={true} />;
  }

  /**
   * Definitions
   */
  const safeRemainder =
    (safeRemainderDetailQuery.data &&
      safeRemainderDetailQuery.data.safeRemainderDetail) ||
    {};

  const safeRemainderItems =
    (safeRemainderItemsQuery.data &&
      safeRemainderItemsQuery.data.safeRemainderItems) ||
    [];

  const exportCensus = () => {
    const { REACT_APP_API_URL } = getEnv();
    const params = generateParams({ queryParams });

    const stringified = queryString.stringify({
      remainderId: id,
      ...params,
    });

    window.open(
      `${REACT_APP_API_URL}/pl:inventories/file-export-census?${stringified}`,
      '_blank',
    );
  };

  const componentProps = {
    loading: safeRemainderItemsQuery.loading,
    safeRemainder,
    safeRemainderItems,
    totalCount,
    exportCensus,
  };

  const Component = props.component;
  return <Component {...componentProps} />;
}

export default ListContainer;
