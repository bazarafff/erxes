import * as compose from 'lodash.flowright';

import {
  CheckSyncedMutationResponse,
  CheckSyncedOrdersQueryResponse,
  CheckSyncedOrdersTotalCountQueryResponse,
  PosListQueryResponse,
  ToSyncOrdersMutationResponse,
} from '../types';
import { mutations, queries } from '../graphql';
import { router, withProps } from '@erxes/ui/src/utils/core';

import Alert from '@erxes/ui/src/utils/Alert';
import { Bulk } from '@erxes/ui/src/components';
import CheckSyncedOrders from '../components/syncedOrders/CheckSyncedOrders';
import { IRouterProps } from '@erxes/ui/src/types';
import React, { useState } from 'react';
import { gql } from '@apollo/client';
import { graphql } from '@apollo/client/react/hoc';
import { withRouter } from 'react-router-dom';

type Props = {
  queryParams: any;
  history: any;
};

type FinalProps = {
  checkSyncItemsQuery: CheckSyncedOrdersQueryResponse;
  checkSyncedOrdersTotalCountQuery: CheckSyncedOrdersTotalCountQueryResponse;
  posListQuery: PosListQueryResponse;
} & Props &
  IRouterProps &
  CheckSyncedMutationResponse &
  ToSyncOrdersMutationResponse;

const CheckSyncedOrdersContainer = (props: FinalProps) => {
  const [unSyncedOrderIds, setUnSyncedOrderIds] = useState([]);
  const [syncedOrderInfos, setSyncedOrderInfos] = useState({});
  const brandId = props.queryParams.brandId || 'noBrand';

  const setBrand = (brandId: string) => {
    router.setParams(props.history, { brandId: brandId });
    return router;
  };

  const {
    toCheckMsdSynced,
    checkSyncItemsQuery,
    checkSyncedOrdersTotalCountQuery,
    posListQuery,
  } = props;

  // remove action
  const checkSynced = async ({ orderIds }, emptyBulk) => {
    await toCheckMsdSynced({
      variables: { ids: orderIds, brandId },
    })
      .then((response) => {
        emptyBulk();
        const statuses = response.data.toCheckMsdSynced;

        const unSyncedOrderIds = (
          statuses.filter((s) => !s.isSynced) || []
        ).map((s) => s._id);
        const syncedOrderInfos = {};
        const syncedOrders = statuses.filter((s) => s.isSynced) || [];

        syncedOrders.forEach((item) => {
          syncedOrderInfos[item._id] = {
            syncedBillNumber: item.syncedBillNumber || '',
            syncedDate: item.syncedDate || '',
            syncedCustomer: item.syncedCustomer || '',
          };
        });

        setUnSyncedOrderIds(unSyncedOrderIds);
        setSyncedOrderInfos(syncedOrderInfos);
        Alert.success('Check finished');
      })
      .catch((e) => {
        Alert.error(e.message);
      });
  };

  const toSyncMsdOrders = (orderIds) => {
    props
      .toSyncMsdOrders({
        variables: { orderIds },
      })
      .then((response) => {
        const { skipped, error, success } = response.data.toSyncMsdOrders;
        const changed = unSyncedOrderIds.filter((u) => !orderIds.includes(u));
        setUnSyncedOrderIds(changed);
        Alert.success(
          `Алгассан: ${skipped.length}, Алдаа гарсан: ${error.length}, Амжилттай: ${success.length}`
        );
      })
      .catch((e) => {
        Alert.error(e.message);
      });
  };

  const orders = checkSyncItemsQuery.posOrders || [];
  const totalCount = checkSyncedOrdersTotalCountQuery.posOrdersTotalCount || 0;

  const updatedProps = {
    ...props,
    loading: checkSyncItemsQuery.loading,
    orders,
    totalCount,
    checkSynced,
    setBrand,
    unSyncedOrderIds: unSyncedOrderIds,
    syncedOrderInfos: syncedOrderInfos,
    toSyncMsdOrders,
    posList: posListQuery.posList,
  };

  const content = (props) => <CheckSyncedOrders {...props} {...updatedProps} />;

  return <Bulk content={content} />;
};

const generateParams = ({ queryParams }) => {
  const pageInfo = router.generatePaginationParams(queryParams || {});

  return {
    paidStartDate: queryParams.paidStartDate,
    paidEndDate: queryParams.paidEndDate,
    createdStartDate: queryParams.createdStartDate,
    createdEndDate: queryParams.createdEndDate,
    posToken: queryParams.posToken,
    userId: queryParams.user,
    posId: queryParams.pos,
    search: queryParams.search,
    sortField: queryParams.sortField,
    sortDirection: Number(queryParams.sortDirection) || undefined,
    page: queryParams.page ? parseInt(queryParams.page, 10) : 1,
    perPage: queryParams.perPage ? parseInt(queryParams.perPage, 10) : 20,
  };
};

export default withProps<Props>(
  compose(
    graphql<{ queryParams: any }, CheckSyncedOrdersQueryResponse>(
      gql(queries.checkSyncOrders),
      {
        name: 'checkSyncItemsQuery',
        options: ({ queryParams }) => ({
          variables: generateParams({ queryParams }),
          fetchPolicy: 'network-only',
        }),
      }
    ),

    graphql<{ queryParams: any }, CheckSyncedOrdersTotalCountQueryResponse>(
      gql(queries.checkSyncOrdersTotalCount),
      {
        name: 'checkSyncedOrdersTotalCountQuery',
        options: ({ queryParams }) => ({
          variables: generateParams({ queryParams }),
          fetchPolicy: 'network-only',
        }),
      }
    ),
    graphql<Props, CheckSyncedMutationResponse, { orderIds: string[] }>(
      gql(mutations.toCheckMsdSynced),
      {
        name: 'toCheckMsdSynced',
      }
    ),
    graphql<Props, ToSyncOrdersMutationResponse, { orderIds: string[] }>(
      gql(mutations.toSyncMsdOrders),
      {
        name: 'toSyncMsdOrders',
      }
    ),

    graphql<{ queryParams: any }, PosListQueryResponse>(
      gql(`query posList {
        posList {
          _id
          name
          description
        }
      }`),
      {
        name: 'posListQuery',
      }
    )
  )(withRouter<IRouterProps>(CheckSyncedOrdersContainer))
);