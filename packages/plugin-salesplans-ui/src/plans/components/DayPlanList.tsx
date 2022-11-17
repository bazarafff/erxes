import React from 'react';
import Row from './DayPlanRow';
import Sidebar from './DayPlanSidebar';
import { __, Alert, confirm, router } from '@erxes/ui/src/utils';
import { BarItems, Wrapper } from '@erxes/ui/src/layout';
import {
  Button,
  DataWithLoader,
  FormControl,
  ModalTrigger,
  Table
} from '@erxes/ui/src/components';
import { IDayPlan } from '../types';
import { MainStyleTitle as Title } from '@erxes/ui/src/styles/eindex';
import Form from '../containers/DayPlanForm';
import { menuSalesplans } from '../../constants';
import Pagination from '@erxes/ui/src/components/pagination/Pagination';
import { ITimeframe } from '../../settings/types';

type Props = {
  dayPlans: IDayPlan[];
  totalCount: number;
  timeFrames: ITimeframe[];
  isAllSelected: boolean;
  toggleAll: (targets: IDayPlan[], containerId: string) => void;
  history: any;
  queryParams: any;
  bulk: any[];
  emptyBulk: () => void;
  toggleBulk: () => void;
  remove: (doc: { dayPlanIds: string[] }, emptyBulk: () => void) => void;
  edit: (doc: IDayPlan) => void;
  searchValue: string;
};

type State = {
  // configsMap: IConfigsMap;
  searchValue: string;
};

class DayPlans extends React.Component<Props, State> {
  private timer?: NodeJS.Timer;

  constructor(props: Props) {
    super(props);

    this.state = {
      searchValue: this.props.searchValue || ''
    };
  }

  search = e => {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    const { history } = this.props;
    const searchValue = e.target.value;

    this.setState({ searchValue });

    this.timer = setTimeout(() => {
      router.removeParams(history, 'page');
      router.setParams(history, { searchValue });
    }, 500);
  };

  moveCursorAtTheEnd(e) {
    const tmpValue = e.target.value;

    e.target.value = '';
    e.target.value = tmpValue;
  }

  onChange = () => {
    const { toggleAll, dayPlans } = this.props;
    toggleAll(dayPlans, 'dayPlans');
  };

  renderRow = () => {
    const {
      dayPlans,
      history,
      toggleBulk,
      bulk,
      edit,
      timeFrames
    } = this.props;

    return dayPlans.map(dayPlan => (
      <Row
        key={dayPlan._id}
        history={history}
        dayPlan={dayPlan}
        timeFrames={timeFrames}
        toggleBulk={toggleBulk}
        isChecked={bulk.includes(dayPlan)}
        edit={edit}
      />
    ));
  };

  modalContent = props => {
    return <Form {...props} />;
  };

  removeDayPlans = dayPlans => {
    const dayPlanIds: string[] = [];

    dayPlans.forEach(dayPlan => {
      dayPlanIds.push(dayPlan._id);
    });

    this.props.remove({ dayPlanIds }, this.props.emptyBulk);
  };

  actionBarRight() {
    const { bulk } = this.props;

    if (bulk.length) {
      const onClick = () =>
        confirm()
          .then(() => {
            this.removeDayPlans(bulk);
          })
          .catch(error => {
            Alert.error(error.message);
          });

      return (
        <Button
          btnStyle="danger"
          size="small"
          icon="cancel-1"
          onClick={onClick}
        >
          Remove
        </Button>
      );
    }

    const trigger = (
      <Button btnStyle="success" icon="plus-circle">
        Add plans
      </Button>
    );

    return (
      <BarItems>
        <FormControl
          type="text"
          placeholder={__('Type to search')}
          onChange={this.search}
          value={this.state.searchValue}
          autoFocus={true}
          onFocus={this.moveCursorAtTheEnd}
        />
        <ModalTrigger
          size={'lg'}
          title="Add label"
          trigger={trigger}
          autoOpenKey="showProductModal"
          content={this.modalContent}
        />
      </BarItems>
    );
  }

  render() {
    const {
      isAllSelected,
      totalCount,
      queryParams,
      history,
      timeFrames
    } = this.props;

    const content = (
      <Table hover={true}>
        <thead>
          <tr>
            <th style={{ width: 60 }}>
              <FormControl
                checked={isAllSelected}
                componentClass="checkbox"
                onChange={this.onChange}
              />
            </th>
            <th>{__('Date')}</th>
            <th>{__('Branch')}</th>
            <th>{__('Department')}</th>
            <th>{__('Product')}</th>
            <th>{__('Uom')}</th>
            <th>{__('Plan')}</th>
            {timeFrames.map(tf => (
              <th key={tf._id}>{tf.name}</th>
            ))}

            <th>{__('Sum')}</th>
            <th>{__('Diff')}</th>
            <th>{__('')}</th>
          </tr>
        </thead>
        <tbody>{this.renderRow()}</tbody>
      </Table>
    );

    return (
      <Wrapper
        header={
          <Wrapper.Header
            title={__('Sales Day plans')}
            submenu={menuSalesplans}
          />
        }
        actionBar={
          <Wrapper.ActionBar
            left={<Title>{__('Sales Day plans')}</Title>}
            right={this.actionBarRight()}
          />
        }
        leftSidebar={<Sidebar queryParams={queryParams} history={history} />}
        content={
          <DataWithLoader
            data={content}
            loading={false}
            count={totalCount}
            emptyText="There is no data"
            emptyImage="/images/actions/5.svg"
          />
        }
        footer={<Pagination count={totalCount} />}
        transparent={true}
        hasBorder
      />
    );
  }
}

export default DayPlans;
