import periodLockQueries from './periodLocks';
import contractQueries from './contracts';
import contractTypeQueries from './contractTypes';
import insuranceTypeQueries from './insuranceTypes';
import invoiceQueries from './invoices';
import scheduleQueries from './schedules';
import transactionQueries from './transactions';
import collateralQueries from './collaterals';
import classificationQueries from './classification';
import nonBalanceTransactionQueries from './nonBalanceTransactions';

export default {
  ...periodLockQueries,
  ...contractTypeQueries,
  ...contractQueries,
  ...insuranceTypeQueries,
  ...invoiceQueries,
  ...scheduleQueries,
  ...transactionQueries,
  ...collateralQueries,
  ...classificationQueries,
  ...nonBalanceTransactionQueries
};
