import * as compose from "lodash.flowright";

import { IDeal, IPaymentsData, IProductData } from "../../types";

import { AppConsumer } from "coreui/appContext";
import { IProduct } from "@erxes/ui-products/src/types";
import { ProductCategoriesQueryResponse } from "@erxes/ui-products/src/types";
import ProductForm from "../../components/product/ProductForm";
import React from "react";
import { gql } from "@apollo/client";
import { graphql } from "@apollo/client/react/hoc";
import { queries } from "../../graphql";
import { withProps } from "@erxes/ui/src/utils/core";

type Props = {
  onChangeProductsData: (productsData: IProductData[]) => void;
  saveProductsData: () => void;
  onChangePaymentsData: (paymentsData: IPaymentsData) => void;
  productsData: IProductData[];
  products: IProduct[];
  paymentsData?: IPaymentsData;
  currentProduct?: string;
  closeModal: () => void;
  dealQuery: IDeal;
  productCategoriesQuery: ProductCategoriesQueryResponse;
};

class ProductFormContainer extends React.Component<Props> {
  render() {
    return (
      <AppConsumer>
        {({ currentUser }) => {
          if (!currentUser) {
            return;
          }

          const configs = currentUser.configs || {};

          const { productCategoriesQuery } = this.props;

          const categories = productCategoriesQuery.productCategories || [];

          const extendedProps = {
            ...this.props,
            categories: categories,
            loading: productCategoriesQuery.loading,
            currencies: configs.dealCurrency || [],
          };

          return <ProductForm {...extendedProps} />;
        }}
      </AppConsumer>
    );
  }
}

export default withProps<Props>(
  compose(
    graphql<{}, ProductCategoriesQueryResponse, {}>(
      gql(queries.productCategories),
      {
        name: "productCategoriesQuery",
      }
    )
  )(ProductFormContainer)
);
