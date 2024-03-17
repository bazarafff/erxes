var { withFilter } = require('graphql-subscriptions');

module.exports = {
  name: 'tasks',
  typeDefs: `
      taskPipelinesChanged(_id: String!): PipelineChangeResponse

      taskChecklistsChanged(contentType: String!, contentTypeId: String!): Checklist
      taskChecklistDetailChanged(_id: String!): Checklist
      taskProductsDataChanged(_id: String!): ProductsDataChangeResponse
		`,
  generateResolvers: (graphqlPubsub) => {
    return {
      pipelinesChanged: {
        subscribe: (_, { _id }) =>
          graphqlPubsub.asyncIterator(`pipelinesChanged:${_id}`),
      },
      checklistsChanged: {
        resolve(payload, _args, { dataSources: { gatewayDataSource } }, info) {
          return gatewayDataSource.queryAndMergeMissingData({
            payload,
            info,
            queryVariables: { _id: payload.checklistsChanged._id },
            buildQueryUsingSelections: (selections) => `
              query Subscription_GetChecklist($_id: String!) {
                checklistDetail(_id: $_id) {
                  ${selections}
                }
              }
          `,
          });
        },
        subscribe: (_, { contentType, contentTypeId }) =>
          graphqlPubsub.asyncIterator(
            `checklistsChanged:${contentType}:${contentTypeId}`
          ),
      },

      checklistDetailChanged: {
        resolve(payload, _args, { dataSources: { gatewayDataSource } }, info) {
          return gatewayDataSource.queryAndMergeMissingData({
            payload,
            info,
            queryVariables: { _id: payload.checklistDetailChanged._id },
            buildQueryUsingSelections: (selections) => `
              query Subscription_GetChecklist($_id: String!) {
                checklistDetail(_id: $_id) {
                  ${selections}
                }
              }
          `,
          });
        },
        subscribe: (_, { _id }) =>
          graphqlPubsub.asyncIterator(`checklistDetailChanged:${_id}`),
      },

      productsDataChanged: {
        subscribe: (_, { _id }) =>
          graphqlPubsub.asyncIterator(`productsDataChanged:${_id}`),
      },
    };
  },
};